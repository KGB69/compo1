// @ts-nocheck
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Disable TypeScript checking for React Three Fiber JSX elements

const ROOM_SIZE = 30; // Meters - increased from 20 to 30
const TILE_SIZE = 1; // Meter
const WALL_HEIGHT = 10; // Meters

export default function WhiteRoom() {
  const floorRef = useRef<THREE.Mesh>(null);
  
  // Create floor tile grid with subtle variation
  const floorTiles = [];
  
  // Create larger tiles for the floor (2x2 meters each)
  const LARGE_TILE_SIZE = 2;
  
  for (let x = -ROOM_SIZE/2; x < ROOM_SIZE/2; x += LARGE_TILE_SIZE) {
    for (let z = -ROOM_SIZE/2; z < ROOM_SIZE/2; z += LARGE_TILE_SIZE) {
      // Main tile
      floorTiles.push(
        <mesh
          key={`floor-${x}-${z}`}
          position={[x + LARGE_TILE_SIZE/2, -0.01, z + LARGE_TILE_SIZE/2]}
          rotation={[-Math.PI/2, 0, 0]}
        >
          <planeGeometry args={[LARGE_TILE_SIZE - 0.05, LARGE_TILE_SIZE - 0.05]} />
          <meshStandardMaterial 
            color="#ffffff"
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
      );
      
      // Subtle border/grout between tiles
      floorTiles.push(
        <mesh
          key={`floor-border-${x}-${z}`}
          position={[x + LARGE_TILE_SIZE/2, -0.02, z + LARGE_TILE_SIZE/2]}
          rotation={[-Math.PI/2, 0, 0]}
        >
          <planeGeometry args={[LARGE_TILE_SIZE, LARGE_TILE_SIZE]} />
          <meshStandardMaterial 
            color="#f0f0f0"
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      );
    }
  }
  
  // Create ceiling tile grid with subtle variation
  const ceilingTiles = [];
  
  // Use the same large tile size for ceiling as floor
  for (let x = -ROOM_SIZE/2; x < ROOM_SIZE/2; x += LARGE_TILE_SIZE) {
    for (let z = -ROOM_SIZE/2; z < ROOM_SIZE/2; z += LARGE_TILE_SIZE) {
      // Main ceiling tile
      ceilingTiles.push(
        <mesh
          key={`ceiling-${x}-${z}`}
          position={[x + LARGE_TILE_SIZE/2, WALL_HEIGHT + 0.01, z + LARGE_TILE_SIZE/2]}
          rotation={[Math.PI/2, 0, 0]}
        >
          <planeGeometry args={[LARGE_TILE_SIZE - 0.05, LARGE_TILE_SIZE - 0.05]} />
          <meshStandardMaterial 
            color="#ffffff" 
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
      );
      
      // Subtle border/grout between ceiling tiles
      ceilingTiles.push(
        <mesh
          key={`ceiling-border-${x}-${z}`}
          position={[x + LARGE_TILE_SIZE/2, WALL_HEIGHT + 0.02, z + LARGE_TILE_SIZE/2]}
          rotation={[Math.PI/2, 0, 0]}
        >
          <planeGeometry args={[LARGE_TILE_SIZE, LARGE_TILE_SIZE]} />
          <meshStandardMaterial 
            color="#f0f0f0" 
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      );
    }
  }

  return (
    // @ts-ignore - React Three Fiber JSX elements
    <group>
      {/* Floor */}
      {floorTiles}
      
      {/* Ceiling */}
      {ceilingTiles}

      {/* Walls */}
      <mesh position={[0, WALL_HEIGHT/2, -ROOM_SIZE/2]}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, 0.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[0, WALL_HEIGHT/2, ROOM_SIZE/2]}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, 0.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[-ROOM_SIZE/2, WALL_HEIGHT/2, 0]} rotation={[0, Math.PI/2, 0]}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, 0.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[ROOM_SIZE/2, WALL_HEIGHT/2, 0]} rotation={[0, Math.PI/2, 0]}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, 0.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>

      {/* Enhanced lighting system with more even distribution */}
      
      {/* Main ambient light to reduce harsh shadows */}
      <ambientLight intensity={0.5} color="#ffffff" />
      
      {/* Evenly distributed grid of 25 ceiling lights */}
      {[...Array(25)].map((_, i) => {
        const x = (i % 5) * 6 - 12; // 5 lights in a row, evenly spaced
        const z = Math.floor(i/5) * 6 - 12; // 5 rows of lights
        return (
          <pointLight
            key={`ceiling-light-${i}`}
            position={[x, WALL_HEIGHT - 0.3, z]}
            intensity={300} // Reduced intensity since we have more lights
            distance={8}
            decay={2}
            color="#ffffff"
            castShadow={false} // Disable shadows to prevent floor artifacts
          />
        );
      })}
      
      {/* Additional floor-facing lights to eliminate shadows */}
      {[...Array(9)].map((_, i) => {
        const x = (i % 3) * 10 - 10; // 3 lights in a row
        const z = Math.floor(i/3) * 10 - 10; // 3 rows of lights
        return (
          <pointLight
            key={`floor-light-${i}`}
            position={[x, 1, z]} // Low position to light the floor
            intensity={150}
            distance={15}
            decay={2}
            color="#fffaf0" // Slightly warm light for the floor
            castShadow={false}
          />
        );
      })}
    </group>
  );
}
