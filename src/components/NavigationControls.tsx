import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface NavigationControlsProps {
  onProteinSelect: (pdbId: string) => void;
  currentProtein?: string;
}

// 3D UI elements for navigation
const ProteinNode: React.FC<{
  position: [number, number, number];
  pdbId: string;
  name: string;
  onClick: (pdbId: string) => void;
  isActive?: boolean;
}> = ({ position, pdbId, name, onClick, isActive }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.scale.setScalar(hovered ? 1.2 : 1);
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[0.5, 32, 32]}
        onClick={() => onClick(pdbId)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={isActive ? '#00ff88' : hovered ? '#0088ff' : '#4444ff'}
          emissive={isActive ? '#003322' : hovered ? '#001122' : '#000044'}
          emissiveIntensity={0.5}
        />
      </Sphere>
      
      <Text
        position={[0, -1, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {pdbId}
      </Text>
      
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.2}
        color="#aaa"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  );
};

const NavigationScene: React.FC<{
  proteins: Array<{ pdbId: string; name: string }>;
  onProteinSelect: (pdbId: string) => void;
  currentProtein?: string;
}> = ({ proteins, onProteinSelect, currentProtein }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {proteins.map((protein, index) => {
        const angle = (index / proteins.length) * Math.PI * 2;
        const radius = 4;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(index * 0.5) * 2;
        
        return (
          <ProteinNode
            key={protein.pdbId}
            position={[x, y, z]}
            pdbId={protein.pdbId}
            name={protein.name}
            onClick={onProteinSelect}
            isActive={currentProtein === protein.pdbId}
          />
        );
      })}
      
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
      />
    </>
  );
};

const NavigationControls: React.FC<NavigationControlsProps> = ({ 
  onProteinSelect, 
  currentProtein 
}) => {
  const [recentProteins] = useState([
    { pdbId: '1A1U', name: 'Insulin' },
    { pdbId: '2LYZ', name: 'Lysozyme' },
    { pdbId: '1UBQ', name: 'Ubiquitin' },
    { pdbId: '4HHB', name: 'Hemoglobin' },
    { pdbId: '1BNA', name: 'DNA' },
  ]);

  return (
    <div style={{ 
      width: '100%', 
      height: '300px', 
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <NavigationScene
          proteins={recentProteins}
          onProteinSelect={onProteinSelect}
          currentProtein={currentProtein}
        />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        fontSize: '14px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '8px 12px',
        borderRadius: '4px'
      }}>
        Click on proteins to explore • Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default NavigationControls;
