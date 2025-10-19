import type { TerrainPoint } from '../types/terrain.types';

export interface HeightfieldMesh {
  positions: Float32Array; // [x,y,z] in meter offsets from origin for SimpleMeshLayer
  normals: Float32Array | null; // optional
  indices: Uint32Array; // triangle indices
  texCoords: Float32Array; // [u,v] per vertex, 0..1 across grid
  gridWidth: number;
  gridHeight: number;
  cellSizeLngDeg: number;
  cellSizeLatDeg: number;
  originLon: number;
  originLat: number;
}

/** Build a 1D Gaussian kernel with radius ~= 3*sigma */
function buildGaussianKernel(sigma: number): Float32Array {
  const radius = Math.max(1, Math.ceil(sigma * 3));
  const size = radius * 2 + 1;
  const kernel = new Float32Array(size);
  const s2 = sigma * sigma;
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * s2));
    kernel[i + radius] = v;
    sum += v;
  }
  // normalize
  for (let i = 0; i < size; i++) kernel[i] /= sum;
  return kernel;
}

function convolve1D(
  src: Float32Array,
  width: number,
  height: number,
  kernel: Float32Array,
  horizontal: boolean
): Float32Array {
  const radius = (kernel.length - 1) >> 1;
  const dst = new Float32Array(src.length);

  if (horizontal) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let acc = 0;
        for (let k = -radius; k <= radius; k++) {
          const xx = Math.min(width - 1, Math.max(0, x + k));
          acc += src[y * width + xx] * kernel[k + radius];
        }
        dst[y * width + x] = acc;
      }
    }
  } else {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let acc = 0;
        for (let k = -radius; k <= radius; k++) {
          const yy = Math.min(height - 1, Math.max(0, y + k));
          acc += src[yy * width + x] * kernel[k + radius];
        }
        dst[y * width + x] = acc;
      }
    }
  }

  return dst;
}

/**
 * Apply separable Gaussian blur to a grid of values (0..1).
 */
export function gaussianSmoothGrid(
  values: Float32Array | number[],
  width: number,
  height: number,
  sigma = 1.5,
  passes = 1
): Float32Array {
  let current = values instanceof Float32Array ? values : new Float32Array(values);
  const kernel = buildGaussianKernel(sigma);
  for (let i = 0; i < passes; i++) {
    current = convolve1D(current, width, height, kernel, true);
    current = convolve1D(current, width, height, kernel, false);
  }
  return current;
}

/**
 * Builds a triangle mesh from a regular lat/lon grid of `TerrainPoint`s.
 * Assumes data is ordered by rows (y) then columns (x) consistent with generator.
 */
export function buildHeightfieldMesh(
  data: TerrainPoint[],
  gridWidth: number,
  gridHeight: number,
  elevationMultiplier = 8000
): HeightfieldMesh {
  if (data.length !== gridWidth * gridHeight) {
    throw new Error('Data length does not match grid dimensions');
  }

  const originLat = data[0].lat;
  const originLon = data[0].lon;
  const lastRowFirst = data[(gridHeight - 1) * gridWidth];
  const lastInFirstRow = data[gridWidth - 1];
  const cellSizeLatDeg = (lastRowFirst.lat - originLat) / (gridHeight - 1 || 1);
  const cellSizeLngDeg = (lastInFirstRow.lon - originLon) / (gridWidth - 1 || 1);

  // Approximate meters per degree at origin latitude for WebMercator
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon = 111320 * Math.cos(originLat * Math.PI / 180);

  const vertexCount = gridWidth * gridHeight;
  const positions = new Float32Array(vertexCount * 3);
  const normals = null; // Let deck.gl compute if needed
  const texCoords = new Float32Array(vertexCount * 2);

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const idx = y * gridWidth + x;
      const p = data[idx];
      const base = idx * 3;
      // Convert lon/lat to meter offsets from origin
      const dx = (p.lon - originLon) * metersPerDegreeLon;
      const dy = (p.lat - originLat) * metersPerDegreeLat;
      positions[base + 0] = dx;
      positions[base + 1] = dy;
      positions[base + 2] = p.riskScore * elevationMultiplier;

      const tbase = idx * 2;
      texCoords[tbase + 0] = gridWidth <= 1 ? 0 : x / (gridWidth - 1);
      texCoords[tbase + 1] = gridHeight <= 1 ? 0 : y / (gridHeight - 1);
    }
  }

  const quadCount = (gridWidth - 1) * (gridHeight - 1);
  const indices = new Uint32Array(quadCount * 6);
  let i = 0;
  for (let y = 0; y < gridHeight - 1; y++) {
    for (let x = 0; x < gridWidth - 1; x++) {
      const i0 = y * gridWidth + x;
      const i1 = i0 + 1;
      const i2 = i0 + gridWidth;
      const i3 = i2 + 1;
      // two triangles: i0,i2,i1 and i1,i2,i3 to keep winding consistent
      indices[i++] = i0; indices[i++] = i2; indices[i++] = i1;
      indices[i++] = i1; indices[i++] = i2; indices[i++] = i3;
    }
  }

  return {
    positions,
    normals,
    indices,
    texCoords,
    gridWidth,
    gridHeight,
    cellSizeLngDeg,
    cellSizeLatDeg,
    originLon,
    originLat
  };
}


