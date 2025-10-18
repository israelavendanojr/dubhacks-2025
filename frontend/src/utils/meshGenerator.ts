import type { TerrainPoint } from '../types/terrain.types';
import { getRiskColor } from './colorMapping';

export interface MeshVertex {
  position: [number, number, number]; // [x, y, z] in world coordinates
  normal: [number, number, number];   // [nx, ny, nz] for lighting
  color: [number, number, number, number]; // [r, g, b, a] for vertex color
}

export interface TerrainMesh {
  vertices: MeshVertex[];
  indices: number[];
  vertexCount: number;
  triangleCount: number;
}

/**
 * Generate a smooth triangulated mesh from terrain grid data
 * Creates a continuous surface with proper normals and vertex colors
 */
export function generateTerrainMesh(terrainData: TerrainPoint[]): TerrainMesh {
  const GRID_SIZE = 100; // 100x100 grid
  const vertices: MeshVertex[] = [];
  const indices: number[] = [];
  
  // Create vertices from terrain data
  for (let i = 0; i < terrainData.length; i++) {
    const point = terrainData[i];
    const elevation = point.riskScore * 8000; // Much higher elevation for dramatic effect
    
    // Get vertex color based on risk score
    const color = getRiskColor(point.riskScore);
    
    vertices.push({
      position: [point.lon, point.lat, elevation],
      normal: [0, 0, 1], // Will be recalculated after mesh generation
      color: color
    });
  }
  
  // Generate triangle indices (2 triangles per grid cell)
  for (let y = 0; y < GRID_SIZE - 1; y++) {
    for (let x = 0; x < GRID_SIZE - 1; x++) {
      const topLeft = y * GRID_SIZE + x;
      const topRight = topLeft + 1;
      const bottomLeft = (y + 1) * GRID_SIZE + x;
      const bottomRight = bottomLeft + 1;
      
      // First triangle (top-left, top-right, bottom-left)
      indices.push(topLeft, topRight, bottomLeft);
      
      // Second triangle (top-right, bottom-right, bottom-left)
      indices.push(topRight, bottomRight, bottomLeft);
    }
  }
  
  // Calculate vertex normals for smooth lighting
  calculateVertexNormals(vertices, indices);
  
  return {
    vertices,
    indices,
    vertexCount: vertices.length,
    triangleCount: indices.length / 3
  };
}

/**
 * Calculate smooth vertex normals for proper lighting
 */
function calculateVertexNormals(vertices: MeshVertex[], indices: number[]): void {
  // Initialize normals to zero
  vertices.forEach(vertex => {
    vertex.normal = [0, 0, 0];
  });
  
  // Calculate face normals and accumulate to vertices
  for (let i = 0; i < indices.length; i += 3) {
    const i1 = indices[i];
    const i2 = indices[i + 1];
    const i3 = indices[i + 2];
    
    const v1 = vertices[i1];
    const v2 = vertices[i2];
    const v3 = vertices[i3];
    
    // Calculate face normal using cross product
    const edge1 = [
      v2.position[0] - v1.position[0],
      v2.position[1] - v1.position[1],
      v2.position[2] - v1.position[2]
    ];
    
    const edge2 = [
      v3.position[0] - v1.position[0],
      v3.position[1] - v1.position[1],
      v3.position[2] - v1.position[2]
    ];
    
    // Cross product: edge1 × edge2
    const normal = [
      edge1[1] * edge2[2] - edge1[2] * edge2[1],
      edge1[2] * edge2[0] - edge1[0] * edge2[2],
      edge1[0] * edge2[1] - edge1[1] * edge2[0]
    ];
    
    // Normalize the normal
    const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
    if (length > 0) {
      normal[0] /= length;
      normal[1] /= length;
      normal[2] /= length;
    }
    
    // Accumulate to vertex normals
    v1.normal[0] += normal[0];
    v1.normal[1] += normal[1];
    v1.normal[2] += normal[2];
    
    v2.normal[0] += normal[0];
    v2.normal[1] += normal[1];
    v2.normal[2] += normal[2];
    
    v3.normal[0] += normal[0];
    v3.normal[1] += normal[1];
    v3.normal[2] += normal[2];
  }
  
  // Normalize all vertex normals
  vertices.forEach(vertex => {
    const length = Math.sqrt(
      vertex.normal[0] * vertex.normal[0] + 
      vertex.normal[1] * vertex.normal[1] + 
      vertex.normal[2] * vertex.normal[2]
    );
    
    if (length > 0) {
      vertex.normal[0] /= length;
      vertex.normal[1] /= length;
      vertex.normal[2] /= length;
    }
  });
}

/**
 * Apply Gaussian smoothing to the mesh for even smoother surface
 * Optional enhancement for ultra-smooth appearance
 */
export function smoothTerrainMesh(mesh: TerrainMesh, iterations: number = 1): TerrainMesh {
  const GRID_SIZE = 100;
  const smoothedVertices = [...mesh.vertices];
  
  for (let iter = 0; iter < iterations; iter++) {
    const tempVertices = [...smoothedVertices];
    
    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let x = 1; x < GRID_SIZE - 1; x++) {
        const index = y * GRID_SIZE + x;
        const vertex = tempVertices[index];
        
        // Get neighboring vertices
        const neighbors = [
          tempVertices[(y - 1) * GRID_SIZE + x],     // top
          tempVertices[(y + 1) * GRID_SIZE + x],     // bottom
          tempVertices[y * GRID_SIZE + (x - 1)],     // left
          tempVertices[y * GRID_SIZE + (x + 1)],     // right
          tempVertices[(y - 1) * GRID_SIZE + (x - 1)], // top-left
          tempVertices[(y - 1) * GRID_SIZE + (x + 1)], // top-right
          tempVertices[(y + 1) * GRID_SIZE + (x - 1)], // bottom-left
          tempVertices[(y + 1) * GRID_SIZE + (x + 1)]  // bottom-right
        ];
        
        // Average the z-coordinates (elevation)
        const avgZ = neighbors.reduce((sum, neighbor) => sum + neighbor.position[2], 0) / neighbors.length;
        
        // Apply smoothing with a factor
        const smoothingFactor = 0.3;
        smoothedVertices[index].position[2] = 
          vertex.position[2] * (1 - smoothingFactor) + avgZ * smoothingFactor;
      }
    }
  }
  
  // Recalculate normals after smoothing
  calculateVertexNormals(smoothedVertices, mesh.indices);
  
  return {
    ...mesh,
    vertices: smoothedVertices
  };
}
