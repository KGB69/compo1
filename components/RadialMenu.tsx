/// <reference types="@react-three/fiber" />

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PAGES } from '../constants';
import { PageContent } from '../types';

interface RadialMenuProps {
  onSelectPage: (page: PageContent) => void;
  pageYOffset: number;
}

interface MenuItemProps {
  page: PageContent;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ page, position, isSelected, onSelect, onHover }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const isHighlighted = hovered || isSelected;

  useFrame(() => {
    if (meshRef.current) {
        meshRef.current.scale.lerp(
            new THREE.Vector3(1, 1, 1).multiplyScalar(isHighlighted ? 1.2 : 1),
            0.1
        );
         const material = meshRef.current.material as THREE.MeshStandardMaterial;
         material.color.lerp(isHighlighted ? new THREE.Color('#38bdf8') : new THREE.Color('#0ea5e9'), 0.1);
         material.emissive.lerp(isHighlighted ? new THREE.Color('#38bdf8') : new THREE.Color('#0ea5e9'), 0.1);
    }
  });
  
  const Icon = page.Icon;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            onHover();
        }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
        <meshStandardMaterial 
            color={'#0ea5e9'} 
            emissive={'#0ea5e9'}
            emissiveIntensity={isHighlighted ? 0.8 : 0.4}
            toneMapped={false}
        />
      </mesh>
      <Html center position={[0,0,0.06]}>
           <div className="w-8 h-8 pointer-events-none">
              <Icon className="w-full h-full text-white" />
           </div>
      </Html>
      <Text
        position={[0, -0.45, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {page.menuLabel}
      </Text>
    </group>
  );
};

export const RadialMenu: React.FC<RadialMenuProps> = ({ onSelectPage, pageYOffset }) => {
  const { camera } = useThree();
  const menuRef = useRef<THREE.Group>(null!);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Animate menu in
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    if (e.key.toLowerCase() === 'e' || e.key === 'ArrowRight') {
        setSelectedIndex(prev => (prev + 1) % PAGES.length);
    } else if (e.key.toLowerCase() === 'q' || e.key === 'ArrowLeft') {
        setSelectedIndex(prev => (prev - 1 + PAGES.length) % PAGES.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
        onSelectPage(PAGES[selectedIndex]);
    }
  }, [onSelectPage, selectedIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const radius = 1.2;
  const angleStep = (Math.PI * 2) / PAGES.length;

  useFrame(() => {
    if (menuRef.current) {
        // Position menu in front of camera
        const targetPosition = camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(3));
        
        const menuLowestPointOffset = radius + 0.5;
        const baseTargetY = Math.max(targetPosition.y, menuLowestPointOffset);
        targetPosition.y = baseTargetY + pageYOffset;

        menuRef.current.position.lerp(targetPosition, 0.1);
        menuRef.current.quaternion.slerp(camera.quaternion, 0.1);
        
        const targetScale = isVisible ? 1 : 0;
        menuRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group ref={menuRef}>
       <mesh position={[0,0,-0.1]}>
         <ringGeometry args={[radius * 0.9, radius * 0.95, 64]} />
         <meshBasicMaterial color="#38bdf8" toneMapped={false} transparent opacity={0.5} />
       </mesh>
       <mesh position={[0,0,-0.1]}>
         <circleGeometry args={[radius * 1.4, 64]} />
         <meshBasicMaterial color="black" transparent opacity={0.3} />
       </mesh>
      {PAGES.map((page, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <MenuItem
            key={page.id}
            page={page}
            position={[x, y, 0]}
            isSelected={index === selectedIndex}
            onSelect={() => onSelectPage(page)}
            onHover={() => setSelectedIndex(index)}
          />
        );
      })}
    </group>
  );
};