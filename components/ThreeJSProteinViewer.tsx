import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree, useFrame, extend } from '@react-three/fiber';
import { Html, Plane, Box, Sphere } from '@react-three/drei';
import * as NGL from 'ngl';

// Extend Three.js with R3F components
extend({
  Group: THREE.Group,
  Mesh: THREE.Mesh,
  PlaneGeometry: THREE.PlaneGeometry,
  MeshBasicMaterial: THREE.MeshBasicMaterial
});

// Extract PDB ID from URL
function extractPdbId(url: string): string | null {
  // Check if it's already using a protocol format
  if (url.startsWith('rcsb://') || url.startsWith('pdb://')) {
    return url.split('//')[1].toUpperCase();
  }
  
  // Try to extract PDB ID from URL
  const match = url.match(/\/(\w{4})\.(pdb|cif)$/i);
  if (match) {
    return match[1].toUpperCase();
  }
  return null;
}

interface ThreeJSProteinViewerProps {
  cifUrl: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const ThreeJSProteinViewer: React.FC<ThreeJSProteinViewerProps> = ({
  cifUrl,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create an off-screen canvas for NGL rendering
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      canvas.style.display = 'none';
      document.body.appendChild(canvas);
      canvasRef.current = canvas;

      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      textureRef.current = texture;
    }

    return () => {
      if (canvasRef.current) {
        document.body.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, []);

  // Load protein structure using NGL
  useEffect(() => {
    if (!canvasRef.current) return;

    setLoading(true);
    setError(null);

    // Create NGL Stage with our off-screen canvas
    const stage = new NGL.Stage(canvasRef.current, {
      backgroundColor: 'transparent',
      quality: 'high',
      impostor: true
    });
    stageRef.current = stage;

    // Load structure
    if (cifUrl) {
      console.log('Loading structure from URL:', cifUrl);
      
      // Extract PDB ID if possible
      const pdbId = extractPdbId(cifUrl);
      
      // Try to load using different approaches
      (async () => {
        try {
          let component: any;
          
          // First approach: Try using NGL's built-in loading with rcsb:// protocol
          if (pdbId) {
            try {
              console.log(`Loading PDB ID ${pdbId} using rcsb:// protocol`);
              component = await stage.loadFile(`rcsb://${pdbId}`, { defaultRepresentation: false });
              
              // Add representations optimized for VR
              component.addRepresentation('cartoon', { 
                colorScheme: 'chainname',
                quality: 'high',
                aspectRatio: 2.0,
                smoothSheet: true
              });
              
              component.addRepresentation('ball+stick', { 
                sele: 'hetero and not water',
                multipleBond: 'symmetric',
                quality: 'high'
              });
              
              // Position for VR viewing
              stage.autoView();
              
              setLoading(false);
              return;
            } catch (error) {
              console.warn('Failed to load with rcsb protocol:', error);
              // Continue to next approach
            }
            
            // Try with pdb:// protocol
            try {
              console.log(`Loading PDB ID ${pdbId} using pdb:// protocol`);
              component = await stage.loadFile(`pdb://${pdbId}`, { defaultRepresentation: false });
              
              // Add representations
              component.addRepresentation('cartoon', { 
                colorScheme: 'chainname',
                quality: 'high',
                aspectRatio: 2.0
              });
              
              component.addRepresentation('ball+stick', { 
                sele: 'hetero and not water',
                multipleBond: 'symmetric'
              });
              
              stage.autoView();
              
              setLoading(false);
              return;
            } catch (error) {
              console.warn('Failed to load with pdb protocol:', error);
            }
          }
          
          // Try direct URL loading
          try {
            console.log('Loading structure directly from URL:', cifUrl);
            component = await stage.loadFile(cifUrl, { defaultRepresentation: false });
            
            component.addRepresentation('cartoon', { 
              colorScheme: 'chainname',
              quality: 'high',
              aspectRatio: 2.0
            });
            
            component.addRepresentation('ball+stick', { 
              sele: 'hetero and not water',
              multipleBond: 'symmetric'
            });
            
            stage.autoView();
            
            setLoading(false);
            return;
          } catch (error) {
            console.warn('Direct URL loading failed:', error);
          }
          
          // Fallback to a known working example
          console.log('Loading fallback example structure (1CRN)');
          component = await stage.loadFile('rcsb://1CRN', { defaultRepresentation: false });
          
          component.addRepresentation('cartoon', { 
            colorScheme: 'chainname',
            quality: 'high',
            aspectRatio: 2.0
          });
          
          component.addRepresentation('ball+stick', { 
            sele: 'hetero and not water',
            multipleBond: 'symmetric'
          });
          
          stage.autoView();
          
          setLoading(false);
          setError('Using example protein (1CRN) for demonstration.');
        } catch (error) {
          console.error('All loading attempts failed:', error);
          setError(`Failed to load any protein structure.`);
          setLoading(false);
        }
      })();
    }

    // Clean up function
    return () => {
      if (stageRef.current) {
        stageRef.current.dispose();
        stageRef.current = null;
      }
    };
  }, [cifUrl]);

  // Update texture on each frame
  useFrame(() => {
    if (textureRef.current && !loading && stageRef.current) {
      stageRef.current.viewer.requestRender();
      textureRef.current.needsUpdate = true;
    }
  });

  return (
    <Plane position={[position[0], position[1], position[2]]} rotation={[rotation[0], rotation[1], rotation[2]]} scale={[scale[0], scale[1], scale[2]]}>
      {textureRef.current ? (
        <Plane ref={meshRef} args={[5, 5]} material-map={textureRef.current} material-transparent={true} material-side={THREE.DoubleSide} />
      ) : (
        <Plane args={[5, 5]} material-color="white" material-transparent={true} material-opacity={0.5} />
      )}
      {loading && (
        <Html position={[0, 0, 0.1]}>
          <div style={{ 
            color: 'white', 
            backgroundColor: 'rgba(0,0,0,0.7)', 
            padding: '10px', 
            borderRadius: '5px',
            width: '200px',
            textAlign: 'center'
          }}>
            Loading protein...
          </div>
        </Html>
      )}
      {error && (
        <Html position={[0, 0, 0.1]}>
          <div style={{ 
            color: 'white', 
            backgroundColor: 'rgba(255,0,0,0.7)', 
            padding: '10px', 
            borderRadius: '5px',
            width: '200px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        </Html>
      )}
    </Plane>
  );
};
