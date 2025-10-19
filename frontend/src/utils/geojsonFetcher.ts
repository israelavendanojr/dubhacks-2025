import type { FeatureCollection, Feature } from 'geojson';
import { useCallback, useState } from 'react';

// API structure types (assuming these are defined elsewhere)
type ApiDataPoint = {
    name: string;
    normalized: number;
    predicted_value: number;
    // ... other properties
};

// GeoJSON feature structure for WADNR data (inferred)
type WADNRFeature = Feature & {
    properties: {
        CNTY?: string;
        JURNM?: string;
        // ... other existing WADNR fields
        riskScore?: number;
        predictedValue?: number;
        isDataAvailable?: boolean;
    };
    // ArcGIS JSON may place attributes here if not true GeoJSON
    attributes?: Record<string, any>; 
};

type GeoJsonCollection = FeatureCollection & {
    features: WADNRFeature[];
};

// Try different WADNR API endpoints
const WA_COUNTY_GEOJSON_URL = "https://gis.dnr.wa.gov/site3/rest/services/Public_Boundaries/WADNR_PUBLIC_Cadastre_OpenData/FeatureServer/11/query?where=1%3D1&outFields=*&outSR=4326&f=geojson";

// Fallback to ArcGIS JSON format if GeoJSON fails
const FALLBACK_ARCGIS_URL = "https://gis.dnr.wa.gov/site3/rest/services/Public_Boundaries/WADNR_PUBLIC_Cadastre_OpenData/FeatureServer/11/query?where=1%3D1&outFields=*&outSR=4326&f=json";

/**
 * Converts ArcGIS JSON to proper GeoJSON format
 */
const convertArcGisToGeoJson = (arcgisData: any): GeoJsonCollection => {
    if (!arcgisData.features) {
        throw new Error('Invalid ArcGIS data: missing features array');
    }

    const geoJsonFeatures = arcgisData.features
        .map((feature: any, index: number) => {
            // ArcGIS features have geometry and attributes, we need to convert to GeoJSON format
            const geoJsonFeature: WADNRFeature = {
                type: 'Feature',
                geometry: feature.geometry || null,
                properties: feature.attributes || {}
            };
            
            // Debug logging for first few features
            if (index < 3) {
                console.log(`geojsonFetcher.ts:convertArcGisToGeoJson:${index}`, "Converting feature:", {
                    originalGeometry: feature.geometry,
                    originalAttributes: feature.attributes,
                    convertedFeature: geoJsonFeature
                });
            }
            
            return geoJsonFeature;
        })
        .filter((feature: WADNRFeature) => {
            // Filter out features with invalid geometry - be more lenient
            const hasGeometry = !!feature.geometry;
            const hasType = !!feature.geometry?.type;
            const hasCoordinates = !!(feature.geometry as any)?.coordinates;
            
            const isValid = hasGeometry && hasType && hasCoordinates;
            
            if (!isValid) {
                console.warn(`geojsonFetcher.ts:convertArcGisToGeoJson:filter`, "Filtering out invalid feature:", {
                    hasGeometry,
                    geometryType: feature.geometry?.type,
                    hasCoordinates,
                    fullGeometry: feature.geometry // Show the complete geometry structure
                });
            }
            
            return isValid;
        });

    return {
        type: 'FeatureCollection',
        features: geoJsonFeatures
    };
};

/**
 * Fetches the static Washington State county boundary data in GeoJSON format.
 * @returns The raw GeoJSON FeatureCollection.
 */
export const fetchGeoJsonData = async (): Promise<GeoJsonCollection | null> => {
    try {
        console.log("geojsonFetcher.ts:55", "Fetching Washington State county boundaries from WADNR...");
        
        // Try GeoJSON format first
        let response = await fetch(WA_COUNTY_GEOJSON_URL);
        let data;
        
        if (response.ok) {
            data = await response.json();
            console.log("geojsonFetcher.ts:78", "Successfully fetched GeoJSON data directly");
            
            // Check if it's already valid GeoJSON
            if (data.type === 'FeatureCollection' && data.features) {
                console.log("geojsonFetcher.ts:79", "Data is already valid GeoJSON:", {
                    type: data.type,
                    featureCount: data.features.length,
                    sampleFeature: data.features[0] ? {
                        type: data.features[0].type,
                        hasGeometry: !!data.features[0].geometry,
                        geometryType: data.features[0].geometry?.type,
                        properties: data.features[0].properties
                    } : null
                });
                return data as GeoJsonCollection;
            }
        }
        
        // Fall back to ArcGIS JSON format
        console.log("geojsonFetcher.ts:80", "Falling back to ArcGIS JSON format...");
        response = await fetch(FALLBACK_ARCGIS_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        data = await response.json();
        console.log("geojsonFetcher.ts:81", "Successfully fetched ArcGIS data:", {
            hasFeatures: !!data.features,
            featureCount: data.features?.length,
            sampleFeature: data.features?.[0] ? {
                hasGeometry: !!data.features[0].geometry,
                geometryType: data.features[0].geometry?.type,
                hasAttributes: !!data.features[0].attributes,
                attributes: data.features[0].attributes,
                fullFeature: data.features[0] // Show the complete feature structure
            } : null
        });
        
        // Convert ArcGIS JSON to proper GeoJSON format
        const geoJsonData = convertArcGisToGeoJson(data);
        console.log("geojsonFetcher.ts:82", "Converted to GeoJSON format:", {
            type: geoJsonData.type,
            featureCount: geoJsonData.features.length,
            sampleFeature: geoJsonData.features[0] ? {
                type: geoJsonData.features[0].type,
                hasGeometry: !!geoJsonData.features[0].geometry,
                geometryType: geoJsonData.features[0].geometry?.type,
                hasCoordinates: !!(geoJsonData.features[0].geometry as any)?.coordinates,
                properties: geoJsonData.features[0].properties,
                fullFeature: geoJsonData.features[0] // Show the complete converted feature
            } : null
        });
        
        return geoJsonData;
    } catch (error) {
        console.error("Error fetching GeoJSON data:", error);
        return null;
    }
};


/**
 * Enriches the raw GeoJSON data with risk scores and predicted values
 * from the API data.
 * @param geoJson The raw GeoJSON object fetched from the WADNR FeatureServer.
 * @param apiDataPoints Array of risk data objects from the API.
 * @returns Enriched GeoJSON object ready for Deck.gl.
 */
export const enrichGeoJsonWithRisk = (geoJson: GeoJsonCollection | null, apiDataPoints: ApiDataPoint[]): GeoJsonCollection | null => {
    if (!geoJson?.features || apiDataPoints.length === 0) {
        return geoJson;
    }

    console.log("geojsonFetcher.ts:116", "Enriching GeoJSON with risk data...");
    console.log("geojsonFetcher.ts:117", `GeoJSON features: ${geoJson.features.length}`);
    console.log("geojsonFetcher.ts:118", `API data points: ${apiDataPoints.length}`);

    // Create a lookup map for fast O(1) matching using county name
    const riskDataLookup = new Map(
        apiDataPoints.map(point => [point.name.toUpperCase().replace(/ COUNTY/g, '').trim(), point])
    );
    
    console.log("geojsonFetcher.ts:119", "Risk data lookup keys:", Array.from(riskDataLookup.keys()));

    const enrichedFeatures = geoJson.features.map((feature: WADNRFeature, index: number) => {
        
        // 1. Safely access properties (now properly converted from ArcGIS attributes)
        const featureAttributes = feature.properties || {};

        if (!featureAttributes || Object.keys(featureAttributes).length === 0) {
            console.warn(`geojsonFetcher.ts:${136 + index}`, `Feature ${index} has no usable properties.`);
            // Return feature with default properties to prevent downstream errors
            return {
                ...feature, 
                properties: { CNTY: 'MISSING', riskScore: 0, isDataAvailable: false } 
            };
        }

        // 2. Identify the county name field. WADNR uses CNTY or JURNM.
        const countyName = featureAttributes.CNTY || featureAttributes.JURNM || 'UNKNOWN';
        
        // 3. Normalize the name for robust matching (e.g., "King County" vs "King")
        const matchingKey = String(countyName).toUpperCase().replace(/ COUNTY/g, '').trim();
        
        // Debug logging for first few features
        if (index < 5) {
            console.log(`geojsonFetcher.ts:${130 + index}`, `Feature ${index}:`, {
                originalCountyName: countyName,
                matchingKey: matchingKey,
                hasMatch: riskDataLookup.has(matchingKey),
                allProperties: Object.keys(featureAttributes)
            });
        }

        const countyData = riskDataLookup.get(matchingKey);

        if (!countyData) {
            console.warn(`geojsonFetcher.ts:${157 + index}`, `No API data found for county: ${matchingKey} (original: ${countyName})`);
            return {
                ...feature,
                properties: {
                    ...featureAttributes,
                    riskScore: 0,
                    predictedValue: 0,
                    isDataAvailable: false,
                    CNTY: countyName 
                }
            };
        } else {
            // Success: Enrich the feature
            console.log(`geojsonFetcher.ts:${157 + index}`, `Matched county: ${matchingKey} -> riskScore: ${countyData.normalized}`);
            return {
                ...feature,
                properties: {
                    ...featureAttributes, 
                    riskScore: countyData.normalized,
                    predictedValue: countyData.predicted_value,
                    isDataAvailable: true,
                    CNTY: countyName 
                }
            };
        }
    });

    const enrichedGeoJson = { ...geoJson, features: enrichedFeatures };
    
    // Summary logging
    const featuresWithData = enrichedFeatures.filter(f => f.properties?.isDataAvailable);
    console.log("geojsonFetcher.ts:170", "Enrichment summary:", {
        totalFeatures: enrichedFeatures.length,
        featuresWithRiskData: featuresWithData.length,
        featuresWithoutData: enrichedFeatures.length - featuresWithData.length,
        sampleMatches: featuresWithData.slice(0, 3).map(f => ({
            county: f.properties?.CNTY,
            riskScore: f.properties?.riskScore
        }))
    });
    
    return enrichedGeoJson;
};

// --- Add this to hold the static GeoJSON data for the application ---
let cachedGeoJson: GeoJsonCollection | null = null;
let geoJsonPromise: Promise<GeoJsonCollection | null> | null = null;

export const useGeoJsonEnricher = (apiDataPoints: ApiDataPoint[]): GeoJsonCollection | null => {
    const [enrichedGeoJson, setEnrichedGeoJson] = useState<GeoJsonCollection | null>(null);

    const fetchAndEnrich = useCallback(async () => {
        // Use promise to ensure only one fetch happens
        if (!geoJsonPromise) {
            geoJsonPromise = fetchGeoJsonData();
        }

        try {
            // Wait for the geojson to load (using cache if available)
            const rawGeoJson = cachedGeoJson || await geoJsonPromise;
            cachedGeoJson = rawGeoJson;

            if (rawGeoJson) {
                const enriched = enrichGeoJsonWithRisk(rawGeoJson, apiDataPoints);
                setEnrichedGeoJson(enriched);
            }
        } catch (error) {
            console.error("Error in useGeoJsonEnricher:", error);
            setEnrichedGeoJson(null);
        }
    }, [apiDataPoints]);

    // Re-run enrichment only when apiDataPoints changes (i.e., new API response)
    if (apiDataPoints.length > 0 && !enrichedGeoJson) {
        fetchAndEnrich();
    }
    
    // Re-run enrichment if API data changes after GeoJSON is already loaded
    if (apiDataPoints.length > 0 && cachedGeoJson) {
        const enriched = enrichGeoJsonWithRisk(cachedGeoJson, apiDataPoints);
        if (enriched !== enrichedGeoJson) {
             setEnrichedGeoJson(enriched);
        }
    }

    return enrichedGeoJson;
};
