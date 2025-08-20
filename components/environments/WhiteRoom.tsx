// @ts-nocheck
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_SIZE } from '../../constants';

// Disable TypeScript checking for React Three Fiber JSX elements

// Use constants from constants.ts
const TILE_SIZE = 1; // Meter
const WALL_HEIGHT = 10; // Meters
const LARGE_TILE_SIZE = 4; // Increased from 2 to 4 for better performance

export default function WhiteRoom() {
  const floorRef = useRef<THREE.Mesh>(null);
  
  // Use useMemo to generate floor and ceiling tiles only once
  const { floorTiles, ceilingTiles } = useMemo(() => {
    const floorTilesArray = [];
    const ceilingTilesArray = [];
    
    // Shared materials for better performance
    const tileMaterial = new THREE.MeshStandardMaterial({ 
      color: "#ffffff",
      roughness: 0.7,
      metalness: 0.1
    });
    
    const groutMaterial = new THREE.MeshStandardMaterial({ 
      color: "#f0f0f0",
      roughness: 0.9,
      metalness: 0
    });
    
    // Create larger tiles for the floor (4x4 meters each for better performance)
    for (let x = -ROOM_SIZE/2; x < ROOM_SIZE/2; x += LARGE_TILE_SIZE) {
      for (let z = -ROOM_SIZE/2; z < ROOM_SIZE/2; z += LARGE_TILE_SIZE) {
        // Main tile
        floorTilesArray.push(
          <mesh
            key={`floor-${x}-${z}`}
            position={[x + LARGE_TILE_SIZE/2, -0.01, z + LARGE_TILE_SIZE/2]}
            rotation={[-Math.PI/2, 0, 0]}
          >
            <planeGeometry args={[LARGE_TILE_SIZE - 0.05, LARGE_TILE_SIZE - 0.05]} />
            <primitive object={tileMaterial} attach="material" />
          </mesh>
        );
        
        // Subtle border/grout between tiles
        floorTilesArray.push(
          <mesh
            key={`floor-border-${x}-${z}`}
            position={[x + LARGE_TILE_SIZE/2, -0.02, z + LARGE_TILE_SIZE/2]}
            rotation={[-Math.PI/2, 0, 0]}
          >
            <planeGeometry args={[LARGE_TILE_SIZE, LARGE_TILE_SIZE]} />
            <primitive object={groutMaterial} attach="material" />
          </mesh>
        );
      }
    }
    
    // Use the same large tile size for ceiling as floor
    for (let x = -ROOM_SIZE/2; x < ROOM_SIZE/2; x += LARGE_TILE_SIZE) {
      for (let z = -ROOM_SIZE/2; z < ROOM_SIZE/2; z += LARGE_TILE_SIZE) {
        // Main ceiling tile
        ceilingTilesArray.push(
          <mesh
            key={`ceiling-${x}-${z}`}
            position={[x + LARGE_TILE_SIZE/2, WALL_HEIGHT + 0.01, z + LARGE_TILE_SIZE/2]}
            rotation={[Math.PI/2, 0, 0]}
          >
            <planeGeometry args={[LARGE_TILE_SIZE - 0.05, LARGE_TILE_SIZE - 0.05]} />
            <primitive object={tileMaterial} attach="material" />
          </mesh>
        );
        
        // Subtle border/grout between ceiling tiles
        ceilingTilesArray.push(
          <mesh
            key={`ceiling-border-${x}-${z}`}
            position={[x + LARGE_TILE_SIZE/2, WALL_HEIGHT + 0.02, z + LARGE_TILE_SIZE/2]}
            rotation={[Math.PI/2, 0, 0]}
          >
            <planeGeometry args={[LARGE_TILE_SIZE, LARGE_TILE_SIZE]} />
            <primitive object={groutMaterial} attach="material" />
          </mesh>
        );
      }
    }
    
    return { floorTiles: floorTilesArray, ceilingTiles: ceilingTilesArray };
  }, []);  // Empty dependency array ensures this runs only once

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

      {/* Optimized lighting system for Quest 3 performance */}
      
      {/* Main ambient light for base illumination */}
      <ambientLight intensity={0.7} color="#ffffff" />
      
      {/* Reduced to just 9 ceiling lights for better performance */}
      {[...Array(9)].map((_, i) => {
        const x = (i % 3) * 10 - 10; // 3 lights in a row, evenly spaced
        const z = Math.floor(i/3) * 10 - 10; // 3 rows of lights
        return (
          <pointLight
            key={`ceiling-light-${i}`}
            position={[x, WALL_HEIGHT - 0.3, z]}
            intensity={400} // Increased intensity since we have fewer lights
            distance={12} // Increased distance to cover more area
            decay={1.8} // Slightly reduced decay for better coverage
            color="#ffffff"
            castShadow={false} // Disable shadows for performance
          />
        );
      })}
      
      {/* Just 4 floor lights at the corners for subtle floor illumination */}
      {[...Array(4)].map((_, i) => {
        const x = (i % 2 === 0) ? -10 : 10; // Left or right
        const z = (i < 2) ? -10 : 10; // Front or back
        return (
          <pointLight
            key={`floor-light-${i}`}
            position={[x, 1, z]} // Low position to light the floor
            intensity={200}
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
