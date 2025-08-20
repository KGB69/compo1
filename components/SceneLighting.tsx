import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

export function SceneLighting() {
  const { scene } = useThree();
  const lightsRef = useRef<THREE.Light[]>([]);

  useEffect(() => {
    // Create ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    
    // Create directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    
    // Add lights to scene
    scene.add(ambientLight);
    scene.add(directionalLight);
    
    // Store references
    lightsRef.current = [ambientLight, directionalLight];
    
    // Clean up
    return () => {
      lightsRef.current.forEach(light => {
        scene.remove(light);
      });
      lightsRef.current = [];
    };
  }, [scene]);
  
  return null;
}
