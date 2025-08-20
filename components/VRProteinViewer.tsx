/**
 * VRProteinViewer Component
 * 
 * This component provides an immersive 3D visualization of protein structures in VR.
 * It integrates NGL Viewer's protein rendering capabilities with React Three Fiber and XR.
 * 
 * Key features:
 * - Direct integration of NGL's internal Three.js objects into the React Three Fiber scene
 * - Optimized buffer geometry extraction with proper error handling
 * - Enhanced material properties for better VR appearance
 * - Interactive controls for rotation, scaling, and position adjustment
 * - Debug mode for troubleshooting rendering issues
 * - Fallback 2D plane rendering when 3D extraction fails
 * 
 * Last updated: August 18, 2025
 */

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Box, useHelper, PivotControls } from '@react-three/drei';
import { useController } from '@react-three/xr';
import * as NGL from 'ngl';

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

interface VRProteinViewerProps {
  cifUrl: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  interactive?: boolean;
}

/**
 * Main VRProteinViewer component
 * 
 * This component renders a 3D protein structure in VR using NGL Viewer's capabilities
 * integrated with React Three Fiber and XR.
 * 
 * Usage:
 * ```tsx
 * <VRProteinViewer 
 *   cifUrl="rcsb://1CRN" 
 *   position={[0, 1, -1]} 
 *   scale={0.5} 
 *   interactive={true} 
 * />
 * ```
 * 
 * Features:
 * - True 3D rendering of protein structures in VR
 * - Interactive controls for rotation and inspection
 * - Auto-rotation with adjustable speed
 * - Debug mode via URL parameter (?debug=true)
 * - Fallback to 2D plane if 3D extraction fails
 * 
 * @param cifUrl - URL or PDB ID of the protein structure to load (e.g., "rcsb://1CRN")
 * @param position - 3D position coordinates [x, y, z]
 * @param rotation - Initial rotation of the protein model [x, y, z]
 * @param scale - Scale factor for the protein model
 * @param interactive - Whether to enable interactive controls
 */
export function VRProteinViewer({
  cifUrl,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  interactive = true
}: VRProteinViewerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // State for UI controls visibility
  const [showControls, setShowControls] = useState(false);
  
  // State for interactive controls
  const [modelRotation, setModelRotation] = useState<[number, number, number]>(rotation);
  const [modelScale, setModelScale] = useState<number>(scale);
  
  // Toggle controls visibility
  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev);
  }, []);

  // Auto-rotation for simple interaction
  const autoRotateRef = useRef<boolean>(interactive);
  const rotationSpeedRef = useRef<number>(0.005);
  const initialRotation = useRef<[number, number, number]>(rotation);
  
  // Reset rotation to initial position
  const resetRotation = useCallback(() => {
    if (meshRef.current) {
      meshRef.current.rotation.set(initialRotation.current[0], initialRotation.current[1], initialRotation.current[2]);
    }
  }, []);

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
          });
          component.addRepresentation('ball+stick', { 
            sele: 'hetero and not water',
          });
          
          stageRef.current.autoView();
          
          console.log('Protein loaded successfully');
          setLoading(false);
          setIsLoaded(true);
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

  // Simple auto-rotation for the protein model
  useFrame((state, delta) => {
    if (interactive && autoRotateRef.current && meshRef.current) {
      // Apply auto-rotation
      setModelRotation(prev => [
        prev[0],
        prev[1] + rotationSpeedRef.current,
        prev[2]
      ]);
    }
  });
  
  // XR Controller for right hand
  const rightController = useController('right');
  
  // XR Controller for left hand
  const leftController = useController('left');
  
  // Track if controller trigger is pressed
  const [rightTriggerPressed, setRightTriggerPressed] = useState(false);
  const [leftTriggerPressed, setLeftTriggerPressed] = useState(false);
  
  // Visual feedback state for controller interaction
  const [rightControllerActive, setRightControllerActive] = useState(false);
  const rightControllerActiveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle XR controller interaction
  useEffect(() => {
    if (rightController) {
      const onSelectStart = () => {
        setRightTriggerPressed(true);
        // Toggle auto-rotation when right trigger is pressed
        autoRotateRef.current = !autoRotateRef.current;
        console.log('Auto-rotation toggled via right controller:', autoRotateRef.current);
        
        // Visual feedback
        setRightControllerActive(true);
        if (rightControllerActiveTimeoutRef.current) {
          clearTimeout(rightControllerActiveTimeoutRef.current);
        }
        rightControllerActiveTimeoutRef.current = setTimeout(() => {
          setRightControllerActive(false);
        }, 500); // Show visual feedback for 500ms
      };
      
      const onSelectEnd = () => {
        setRightTriggerPressed(false);
      };
      
      rightController.controller.addEventListener('selectstart', onSelectStart);
      rightController.controller.addEventListener('selectend', onSelectEnd);
      
      return () => {
        rightController.controller.removeEventListener('selectstart', onSelectStart);
        rightController.controller.removeEventListener('selectend', onSelectEnd);
        if (rightControllerActiveTimeoutRef.current) {
          clearTimeout(rightControllerActiveTimeoutRef.current);
        }
      };
    }
  }, [rightController]);
  
  // Visual feedback state for left controller interaction
  const [leftControllerActive, setLeftControllerActive] = useState(false);
  const leftControllerActiveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle left controller for speed adjustment
  useEffect(() => {
    if (leftController) {
      const onSelectStart = () => {
        setLeftTriggerPressed(true);
        
        // Visual feedback
        setLeftControllerActive(true);
        if (leftControllerActiveTimeoutRef.current) {
          clearTimeout(leftControllerActiveTimeoutRef.current);
        }
      };
      
      const onSelectEnd = () => {
        setLeftTriggerPressed(false);
        
        // End visual feedback after a short delay
        leftControllerActiveTimeoutRef.current = setTimeout(() => {
          setLeftControllerActive(false);
        }, 500);
      };
      
      leftController.controller.addEventListener('selectstart', onSelectStart);
      leftController.controller.addEventListener('selectend', onSelectEnd);
      
      return () => {
        leftController.controller.removeEventListener('selectstart', onSelectStart);
        leftController.controller.removeEventListener('selectend', onSelectEnd);
        if (leftControllerActiveTimeoutRef.current) {
          clearTimeout(leftControllerActiveTimeoutRef.current);
        }
      };
    }
  }, [leftController]);
  
  // Adjust rotation speed with left controller Y axis
  useFrame(() => {
    if (leftController && leftTriggerPressed) {
      const gamepad = leftController.inputSource?.gamepad;
      if (gamepad && gamepad.axes.length >= 2) {
        // Use Y axis (up/down) to control rotation speed
        const yAxis = gamepad.axes[1];
        // Map from [-1, 1] to [0.001, 0.02]
        rotationSpeedRef.current = 0.001 + (1 - yAxis) * 0.01;
        console.log('Rotation speed adjusted:', rotationSpeedRef.current);
      }
    }
  });
  
  // Debug mode for troubleshooting rendering issues
  const isDebugMode = useMemo(() => window.location.search.includes('debug=true'), []);
  
  /**
   * Debug visualization component
   * 
   * Renders a wireframe box to help visualize the position and scale of the protein model.
   * This is only visible when debug mode is enabled via URL parameter (?debug=true).
   * 
   * @param position - 3D position coordinates [x, y, z]
   */
  const DebugVisualization = ({ position }: { position: [number, number, number] }) => {
    return (
      <Box 
        args={[0.5, 0.5, 0.5]} 
        position={position}
        visible={true}
        material-wireframe={true}
        material-color="#ff0000"
        material-transparent={true}
        material-opacity={0.5}
      />
    );
  };
  
  /**
   * TrueProtein3DModel Component
   * 
   * This is the core component that extracts NGL's internal Three.js buffer geometries
   * and creates proper Three.js meshes for rendering in the React Three Fiber scene.
   * 
   * Key improvements:
   * - Optimized buffer geometry extraction with proper attribute copying
   * - Support for large models with Uint32Array indices
   * - Enhanced material properties with MeshPhysicalMaterial for better VR appearance
   * - Proper error handling for each step of the extraction process
   * - Debug logging for troubleshooting
   */
  const TrueProtein3DModel = () => {
    const { scene, raycaster, camera, gl } = useThree();
    const proteinGroupRef = useRef<THREE.Group | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Handle click events for non-VR mode
    const handleClick = (event: MouseEvent) => {
      if (!proteinGroupRef.current) return;
      
      // Calculate mouse position in normalized device coordinates
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObject(proteinGroupRef.current, true);
      
      if (intersects.length > 0) {
        // Toggle auto-rotation
        autoRotateRef.current = !autoRotateRef.current;
        console.log('Auto-rotation toggled via click:', autoRotateRef.current);
      }
    };
    
    // Add click event listener for non-VR mode
    useEffect(() => {
      gl.domElement.addEventListener('click', handleClick);
      
      return () => {
        gl.domElement.removeEventListener('click', handleClick);
      };
    }, [gl.domElement, camera, raycaster]);
    
    // Create a group to hold the protein model
    useEffect(() => {
      if (!proteinGroupRef.current) {
        const group = new THREE.Group();
        group.position.set(position[0], position[1], position[2]);
        group.rotation.set(modelRotation[0], modelRotation[1], modelRotation[2]);
        group.scale.set(modelScale, modelScale, modelScale);
        scene.add(group);
        proteinGroupRef.current = group;
        meshRef.current = group as unknown as THREE.Mesh; // For compatibility with existing code
      }
      
      return () => {
        if (proteinGroupRef.current) {
          scene.remove(proteinGroupRef.current);
          proteinGroupRef.current = null;
        }
      };
    }, [scene]);
    
    // Update rotation and scale when they change
    useEffect(() => {
      if (proteinGroupRef.current) {
        proteinGroupRef.current.rotation.set(modelRotation[0], modelRotation[1], modelRotation[2]);
        proteinGroupRef.current.scale.set(modelScale, modelScale, modelScale);
      }
    }, [modelRotation, modelScale]);
    
    // Direct integration with NGL's Three.js objects
    useEffect(() => {
      if (stageRef.current && !loading && !error && proteinGroupRef.current && !isInitialized) {
        console.log('Initializing direct NGL to Three.js integration');
        
        // Access NGL's viewer object which contains the Three.js scene
        const viewer = stageRef.current.viewer;
        
        if (!viewer || !viewer.renderer || !viewer.renderer.domElement) {
          console.error('NGL viewer or renderer not available');
          return;
        }
        
        try {
          // Access NGL's internal representation
          const stage = stageRef.current;
          const compList = stage.compList;
          
          if (!compList || compList.length === 0) {
            console.error('No components found in NGL stage');
            return;
          }
          
          console.log('NGL components found:', compList.length);
          
          if (isDebugMode) {
            // Log detailed component information in debug mode
            compList.forEach((comp, i) => {
              console.log(`Component ${i} details:`, {
                name: comp.name,
                structureType: comp.structure ? comp.structure.type : 'unknown',
                atomCount: comp.structure ? comp.structure.atomCount : 0,
                reprCount: comp.reprList ? comp.reprList.length : 0
              });
            });
          }
          
          // For each component, extract the representation objects
          compList.forEach((comp, compIndex) => {
            const reprList = comp.reprList;
            console.log(`Component ${compIndex} has ${reprList.length} representations`);
            
            // For each representation, extract the buffer objects
            reprList.forEach((repr, reprIndex) => {
              // Access the buffer list which contains the actual 3D objects
              const bufferList = repr.bufferList;
              console.log(`Representation ${reprIndex} has ${bufferList.length} buffers`);
              
              // For each buffer, extract the geometry and material
              bufferList.forEach((buffer, bufferIndex) => {
                try {
                  if (buffer.geometry) {
                    try {
                      // Create a new Three.js geometry
                      const geometry = new THREE.BufferGeometry();
                      
                      // Copy position attribute - essential for rendering
                      if (buffer.geometry.attributes.position) {
                        try {
                          const posArray = buffer.geometry.attributes.position.array;
                          if (posArray && posArray.length > 0) {
                            geometry.setAttribute(
                              'position',
                              new THREE.BufferAttribute(
                                new Float32Array(posArray),
                                3
                              )
                            );
                          } else {
                            console.warn('Position attribute has invalid or empty array');
                            return; // Skip this buffer if position data is invalid
                          }
                        } catch (err) {
                          console.error('Error copying position attribute:', err);
                          return; // Skip this buffer if position data can't be copied
                        }
                      } else {
                        console.warn('Buffer geometry missing position attribute');
                        return; // Skip this buffer if no position data
                      }
                      
                      // Copy normal attribute if available
                      if (buffer.geometry.attributes.normal) {
                        try {
                          const normalArray = buffer.geometry.attributes.normal.array;
                          if (normalArray && normalArray.length > 0) {
                            geometry.setAttribute(
                              'normal',
                              new THREE.BufferAttribute(
                                new Float32Array(normalArray),
                                3
                              )
                            );
                          }
                        } catch (err) {
                          console.warn('Error copying normal attribute:', err);
                          // Continue without normals - they can be computed if needed
                        }
                      }
                      
                      // Copy color attribute if available
                      if (buffer.geometry.attributes.color) {
                        try {
                          const colorArray = buffer.geometry.attributes.color.array;
                          if (colorArray && colorArray.length > 0) {
                            geometry.setAttribute(
                              'color',
                              new THREE.BufferAttribute(
                                new Float32Array(colorArray),
                                3
                              )
                            );
                          }
                        } catch (err) {
                          console.warn('Error copying color attribute:', err);
                          // Continue without colors - material color will be used instead
                        }
                      }
                      
                      // Copy index if available
                      if (buffer.geometry.index) {
                        try {
                          const indexArray = buffer.geometry.index.array;
                          if (indexArray && indexArray.length > 0) {
                            // Use the appropriate index type based on vertex count
                            // This is a critical optimization for large protein models
                            // Standard WebGL only supports 16-bit indices (max 65535 vertices)
                            // For larger models, we need to use 32-bit indices and ensure compatibility
                            const indexValues = Array.from(indexArray).map(Number);
                            const maxIndex = Math.max(...indexValues);
                            if (maxIndex > 65535) {
                              geometry.setIndex(
                                new THREE.BufferAttribute(
                                  new Uint32Array(indexArray),
                                  1
                                )
                              );
                            } else {
                              geometry.setIndex(
                                new THREE.BufferAttribute(
                                  new Uint16Array(indexArray),
                                  1
                                )
                              );
                            }
                          }
                        } catch (err) {
                          console.warn('Error copying index attribute:', err);
                          // Continue without indices - non-indexed rendering will be used
                        }
                      }
                      
                      // Compute normals if they're missing
                      if (!buffer.geometry.attributes.normal) {
                        geometry.computeVertexNormals();
                      }
                      
                      // Optimize the geometry
                      geometry.computeBoundingSphere();
                      geometry.computeBoundingBox();
                    
                    // Create material with improved properties for VR
                    // Enhanced materials with physical properties for better appearance in VR
                    // - Added clearcoat for subtle shine
                    // - Adjusted metalness and roughness for more realistic appearance
                    // - Added environment map intensity for subtle reflections
                    let material;
                    if (buffer.geometry.attributes.color) {
                      material = new THREE.MeshPhysicalMaterial({
                        vertexColors: true,
                        metalness: 0.1,
                        roughness: 0.7,
                        clearcoat: 0.2,          // Add subtle clearcoat for better VR appearance
                        clearcoatRoughness: 0.3,
                        envMapIntensity: 0.5,    // Subtle environment reflection
                        side: THREE.DoubleSide
                      });
                    } else {
                      // Use representation color if available with enhanced material
                      let color;
                      try {
                        color = repr.getParameters().color || new THREE.Color(0x3498db);
                      } catch (err) {
                        console.warn('Error getting representation color:', err);
                        color = new THREE.Color(0x3498db); // Default blue
                      }
                      
                      material = new THREE.MeshPhysicalMaterial({
                        color: color,
                        metalness: 0.1,
                        roughness: 0.7,
                        clearcoat: 0.2,
                        clearcoatRoughness: 0.3,
                        envMapIntensity: 0.5,
                        side: THREE.DoubleSide
                      });
                    }
                    
                    // Create mesh and add to group
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.name = `protein-${compIndex}-${reprIndex}-${bufferIndex}`;
                    mesh.userData.isProteinPart = true; // Mark as protein part for interaction
                    mesh.userData.reprType = repr.name; // Store representation type
                    
                    // Make the mesh castable and receivable for shadows if enabled
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                    
                    if (proteinGroupRef.current) {
                      proteinGroupRef.current.add(mesh);
                      console.log(`Added protein mesh ${mesh.name} to group`);
                    }
                    
                    // Add debug info
                    if (window.location.search.includes('debug=true')) {
                      console.log(`Mesh ${mesh.name} details:`, {
                        vertexCount: geometry.attributes.position.count,
                        triangleCount: geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3,
                        hasNormals: !!geometry.attributes.normal,
                        hasColors: !!geometry.attributes.color,
                        isIndexed: !!geometry.index
                      });
                    }
                    } catch (err) {
                      console.error(`Error creating mesh for buffer ${bufferIndex}:`, err);
                    }
                  }
                } catch (err) {
                  console.error(`Error processing buffer ${bufferIndex}:`, err);
                }
              });
            });
          });
          
          // Mark as initialized to prevent multiple initializations
          setIsInitialized(true);
          console.log('Direct NGL integration complete');
          
        } catch (error) {
          console.error('Error during direct NGL integration:', error);
        }
      }
    }, [scene, loading, error, isInitialized]);
    
    return null;
  };
  
  // Create a component that renders the protein as a 2D texture on a plane (fallback)
  const ProteinPlane = () => {
    const { scene } = useThree();
    
    // Create mesh on component mount
    useEffect(() => {
      if (!meshRef.current) {
        // Create a plane geometry and material
        const planeGeometry = new THREE.PlaneGeometry(5, 5);
        const material = textureRef.current 
          ? new THREE.MeshBasicMaterial({ 
              map: textureRef.current, 
              transparent: true, 
              side: THREE.DoubleSide
            })
          : new THREE.MeshBasicMaterial({ 
              color: 'white', 
              transparent: true, 
              opacity: 0.5
            });
            
        // Create mesh
        const mesh = new THREE.Mesh(planeGeometry, material);
        mesh.position.set(position[0], position[1], position[2]);
        mesh.rotation.set(modelRotation[0], modelRotation[1], modelRotation[2]);
        mesh.scale.set(modelScale, modelScale, modelScale);
        
        // Add to scene and store reference
        scene.add(mesh);
        meshRef.current = mesh;
      }
      
      // Clean up
      return () => {
        if (meshRef.current) {
          scene.remove(meshRef.current);
          if (meshRef.current.geometry) meshRef.current.geometry.dispose();
          if (meshRef.current.material instanceof THREE.Material) {
            meshRef.current.material.dispose();
          } else if (Array.isArray(meshRef.current.material)) {
            meshRef.current.material.forEach(material => material.dispose());
          }
          meshRef.current = null;
        }
      };
    }, [scene]);
    
    // Update material when texture changes
    useEffect(() => {
      if (meshRef.current && textureRef.current) {
        if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
          meshRef.current.material.map = textureRef.current;
          meshRef.current.material.needsUpdate = true;
        }
      }
    }, [textureRef.current]);
    
    // Update rotation and scale when they change
    useEffect(() => {
      if (meshRef.current) {
        meshRef.current.rotation.set(modelRotation[0], modelRotation[1], modelRotation[2]);
        meshRef.current.scale.set(modelScale, modelScale, modelScale);
      }
    }, [modelRotation, modelScale]);
    
    return null;
  };

  // State to trigger re-renders when auto-rotation changes
  const [autoRotateState, setAutoRotateState] = useState(autoRotateRef.current);
  
  // Update state when auto-rotation changes
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (autoRotateState !== autoRotateRef.current) {
        setAutoRotateState(autoRotateRef.current);
      }
    }, 100);
    
    return () => clearInterval(checkInterval);
  }, [autoRotateState]);
  
  return (
    <>
      {/* Render the 3D protein model */}
      <TrueProtein3DModel />
      {/* Fallback 2D plane in case 3D model fails */}
      {!isLoaded && <ProteinPlane />}
      
      {/* Debug visualization for bounding box in debug mode */}
      {isDebugMode && !loading && !error && meshRef.current && (
        <>
          {/* Using drei's built-in components for debug visualization */}
          <DebugVisualization position={position} />
        </>
      )}
      
      {/* Help button to show/hide controls */}
      {!loading && !error && (
        <Html position={[position[0] + 0.5, position[1] + 1.5, position[2]]} transform>
          <button 
            onClick={toggleControls}
            style={{ 
              color: 'white',
              backgroundColor: 'rgba(0,0,255,0.7)',
              padding: '5px',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 5px rgba(255,255,255,0.5)',
              transition: 'transform 0.2s ease-in-out'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ?
          </button>
        </Html>
      )}
      
      {/* Visual indicator for rotation state */}
      {!loading && !error && (
        <Html position={[position[0], position[1] + 1.5, position[2]]} transform>
          <div style={{ 
            color: 'white',
            backgroundColor: autoRotateRef.current ? 'rgba(0,128,0,0.7)' : 'rgba(128,0,0,0.7)',
            padding: '5px',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            boxShadow: rightControllerActive ? '0 0 15px 5px rgba(255,255,255,0.8)' : 'none',
            transition: 'box-shadow 0.2s ease-in-out'
          }}>
            {autoRotateRef.current ? '⟳' : '⏹'}
          </div>
        </Html>
      )}
      
      {/* Visual indicator for left controller interaction */}
      {!loading && !error && leftControllerActive && (
        <Html position={[position[0] - 0.5, position[1] + 1.5, position[2]]} transform>
          <div style={{ 
            color: 'white',
            backgroundColor: 'rgba(0,0,255,0.7)',
            padding: '5px',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            boxShadow: '0 0 15px 5px rgba(0,128,255,0.8)',
            animation: 'pulse 1s infinite'
          }}>
            ↕
          </div>
        </Html>
      )}
      
      {loading && (
        <Html position={[position[0], position[1], position[2] + 0.1]} transform>
          <div style={{ 
            color: 'white', 
            backgroundColor: 'rgba(0,0,0,0.7)', 
            padding: '10px', 
            borderRadius: '5px',
            width: '200px',
            textAlign: 'center'
          }}>
            Loading protein data...
          </div>
        </Html>
      )}
      
      {error && (
        <Html position={[position[0], position[1], position[2] + 0.1]} transform>
          <div style={{ 
            color: 'white', 
            backgroundColor: 'rgba(255,0,0,0.7)', 
            padding: '10px', 
            borderRadius: '5px',
            width: '200px',
            textAlign: 'center'
          }}>
            Error: {error}
          </div>
        </Html>
      )}
      
      {showControls && !loading && !error && (
        <Html position={[position[0], position[1] - 2, position[2]]} transform>
          <div style={{ 
            color: 'white', 
            backgroundColor: 'rgba(0,0,0,0.7)', 
            padding: '10px', 
            borderRadius: '5px',
            width: '200px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Protein Controls</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button 
                onClick={() => {
                  autoRotateRef.current = !autoRotateRef.current;
                  setAutoRotateState(autoRotateRef.current);
                }}
                style={{
                  backgroundColor: autoRotateRef.current ? '#4CAF50' : '#f44336',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                {autoRotateRef.current ? 'Stop' : 'Start'}
              </button>
              
              <button 
                onClick={resetRotation}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Reset
              </button>
            </div>
            <div style={{ marginTop: '10px' }}>
              <label style={{ marginRight: '10px' }}>Speed:</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="range" 
                  min="0.001" 
                  max="0.02" 
                  step="0.001" 
                  defaultValue={rotationSpeedRef.current}
                  onChange={(e) => rotationSpeedRef.current = parseFloat(e.target.value)}
                  style={{ width: '120px' }}
                />
                <div style={{ 
                  marginLeft: '10px', 
                  width: '30px', 
                  height: '20px', 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>
                  {Math.round(rotationSpeedRef.current * 1000)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#aaa' }}>
              <p style={{ margin: '5px 0' }}>Right controller trigger: Toggle rotation</p>
              <p style={{ margin: '5px 0' }}>Left controller trigger + move: Adjust speed</p>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}
