import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane, Box } from '@react-three/drei';
import * as THREE from 'three';
import ProteinInWorld from './ProteinInWorld';

// VR Player component optimized for Oculus Quest
function VRPlayer() {
  const { camera } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  
  const WORLD_SIZE = 20; // 20x20 meter floor
  const BOUNDARY_MARGIN = 0.5;

  useFrame(() => {
    if (playerRef.current) {
      // Get camera position
      const cameraPosition = camera.position;
      
      // Clamp position to world boundaries with smooth boundaries
      const clampedX = Math.max(-WORLD_SIZE/2 + BOUNDARY_MARGIN, 
                          Math.min(WORLD_SIZE/2 - BOUNDARY_MARGIN, cameraPosition.x));
      const clampedZ = Math.max(-WORLD_SIZE/2 + BOUNDARY_MARGIN, 
                          Math.min(WORLD_SIZE/2 - BOUNDARY_MARGIN, cameraPosition.z));
      
      // Keep y position (height) fixed for VR comfort
      camera.position.set(clampedX, cameraPosition.y, clampedZ);
    }
  });

  return (
    <group ref={playerRef}>
      {/* Oculus Quest optimized VR setup */}
    </group>
  );
}

// Walkable floor with grid pattern
function WalkableFloor() {
  const floorSize = 20;
  
  return (
    <group>
      {/* Main floor */}
      <Plane
        args={[floorSize, floorSize]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial 
          color="#f0f0f0" 
          roughness={0.8}
          metalness={0.1}
        />
      </Plane>
      
      {/* Grid lines */}
      {Array.from({ length: floorSize + 1 }, (_, i) => (
        <group key={`grid-${i}`}>
          {/* Horizontal lines */}
          <Box
            args={[floorSize, 0.02, 0.02]}
            position={[0, 0.01, -floorSize/2 + i]}
          >
            <meshBasicMaterial color="#cccccc" />
          </Box>
          {/* Vertical lines */}
          <Box
            args={[0.02, 0.02, floorSize]}
            position={[-floorSize/2 + i, 0.01, 0]}
          >
            <meshBasicMaterial color="#cccccc" />
          </Box>
        </group>
      ))}
      
      {/* Boundary markers */}
      <Box args={[floorSize, 0.1, 0.1]} position={[0, 0.05, floorSize/2]}>
        <meshBasicMaterial color="#ff4444" transparent opacity={0.5} />
      </Box>
      <Box args={[floorSize, 0.1, 0.1]} position={[0, 0.05, -floorSize/2]}>
        <meshBasicMaterial color="#ff4444" transparent opacity={0.5} />
      </Box>
      <Box args={[0.1, 0.1, floorSize]} position={[floorSize/2, 0.05, 0]}>
        <meshBasicMaterial color="#ff4444" transparent opacity={0.5} />
      </Box>
      <Box args={[0.1, 0.1, floorSize]} position={[-floorSize/2, 0.05, 0]}>
        <meshBasicMaterial color="#ff4444" transparent opacity={0.5} />
      </Box>
    </group>
  );
}


// Main VR World component optimized for Oculus Quest
export default function VRWorld() {
  return (
    <>
      {/* VR World Scene - Optimized lighting for Quest */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[0, 5, 0]} intensity={0.3} />
      
      {/* Optimized skybox for Quest performance */}
      <mesh>
        <sphereGeometry args={[50, 16, 16]} />
        <meshBasicMaterial color="#87CEEB" side={THREE.BackSide} />
      </mesh>
      
      {/* Walkable floor */}
      <WalkableFloor />
      
      {/* VR Player setup with Quest optimization */}
      <VRPlayer />
      
      {/* Protein model at eye level for VR interaction */}
      <ProteinInWorld pdbId="1A1U" position={[0, 1.5, 0]} />
      
      {/* Optimized fog for depth perception */}
      <fog attach="fog" args={['#87CEEB', 5, 30]} />
    </>
  );
}
