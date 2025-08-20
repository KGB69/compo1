// @ts-nocheck - Disable TypeScript checking for React Three Fiber JSX elements
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useXR, Controllers } from '@react-three/xr';
import * as THREE from 'three';
import { vrConsole } from './VRConsole';


export const VRControllers: React.FC = () => {
  const { controllers, player } = useXR();
  const { scene } = useThree();
  const [showDebugVisuals, setShowDebugVisuals] = useState(true);
  const buttonVisuals = useRef<{[key: string]: THREE.Mesh}>({}); 
  
  // Log controller connections
  useEffect(() => {
    controllers.forEach(controller => {
      const hand = controller.inputSource?.handedness;
      vrConsole.log(`${hand} controller connected`);
      
      // Log controller details
      if (controller.inputSource?.gamepad) {
        const gamepad = controller.inputSource.gamepad;
        vrConsole.log(`${hand} controller has ${gamepad.buttons.length} buttons and ${gamepad.axes.length} axes`);
      }
      
      // Create visual indicators for buttons if in debug mode
      if (showDebugVisuals && controller.inputSource?.gamepad) {
        const gamepad = controller.inputSource.gamepad;
        const buttonCount = gamepad.buttons.length;
        
        // Create a visual for each button
        for (let i = 0; i < buttonCount; i++) {
          // Create a small sphere for each button
          const geometry = new THREE.SphereGeometry(0.01, 16, 16);
          const material = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.7
          });
          
          const mesh = new THREE.Mesh(geometry, material);
          
          // Position in a circle around the controller
          const angle = (i / buttonCount) * Math.PI * 2;
          const radius = 0.05;
          mesh.position.set(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0
          );
          
          // Add to controller
          controller.add(mesh);
          
          // Store reference
          const buttonId = `${hand}-button-${i}`;
          buttonVisuals.current[buttonId] = mesh;
          
          // Initially hide
          mesh.visible = false;
        }
      }
    });
  }, [controllers, showDebugVisuals, scene]);
  
  // Monitor controller button presses
  useFrame(() => {
    controllers.forEach(controller => {
      if (!controller.inputSource?.gamepad) return;
      
      const hand = controller.inputSource.handedness;
      const gamepad = controller.inputSource.gamepad;
      
      // Check for button presses
      gamepad.buttons.forEach((button, index) => {
        // Update visual indicator if it exists
        const buttonId = `${hand}-button-${index}`;
        const visual = buttonVisuals.current[buttonId];
        
        if (visual) {
          // Show when pressed, hide when released
          visual.visible = button.pressed && showDebugVisuals;
          
          // Change color based on press value (for analog buttons)
          if (button.value > 0) {
            const material = visual.material as THREE.MeshBasicMaterial;
            // Interpolate color from yellow to red based on press value
            const color = new THREE.Color(1, 1 - button.value, 0);
            material.color = color;
          }
        }
        
        if (button.pressed) {
          // Only log when button is first pressed (not held)
          if (!controller.userData[`button${index}Pressed`]) {
            vrConsole.log(`${hand} controller button ${index} pressed (value: ${button.value.toFixed(2)})`);
            controller.userData[`button${index}Pressed`] = true;
          }
        } else {
          // Reset button state when released
          if (controller.userData[`button${index}Pressed`]) {
            controller.userData[`button${index}Pressed`] = false;
          }
        }
      });
      
      // Check for significant axis movement
      gamepad.axes.forEach((value, index) => {
        if (Math.abs(value) > 0.5) {
          // Only log significant changes
          const prevValue = controller.userData[`axis${index}Value`] || 0;
          if (Math.abs(value - prevValue) > 0.2) {
            vrConsole.log(`${hand} controller axis ${index}: ${value.toFixed(2)}`);
            controller.userData[`axis${index}Value`] = value;
          }
        }
      });
    });
  });
  
  // Handle direct WebXR input sources
  useEffect(() => {
    if (!player) return;
    
    // Access session safely with type assertion
    const xrSession = (player as any).session;
    if (!xrSession) return;
    
    const updateInputSources = () => {
      const sources = Array.from(xrSession.inputSources || []);
      vrConsole.log(`Found ${sources.length} WebXR input sources`);
      
      // Log details of each input source
      sources.forEach((source: any, index: number) => {
        vrConsole.log(`Source ${index}: ${source.handedness} hand, ${source.targetRayMode} mode`);
      });
    };
    
    // Initial update
    updateInputSources();
    
    // Listen for input source changes
    const onInputSourcesChange = () => {
      updateInputSources();
    };
    
    xrSession.addEventListener('inputsourceschange', onInputSourcesChange);
    
    return () => {
      if (xrSession) {
        xrSession.removeEventListener('inputsourceschange', onInputSourcesChange);
      }
    };
  }, [player]);
  
  // Toggle debug visuals with B button (button 5 on Quest)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B') {
        setShowDebugVisuals(prev => !prev);
        vrConsole.log(`Debug visuals ${!showDebugVisuals ? 'enabled' : 'disabled'}`);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDebugVisuals]);

  return (
    <>
      {/* Use built-in Controllers component for controller rendering */}
      <Controllers 
        rayMaterial={{ color: '#ffffff' }}
      />
      
      {/* Debug text in VR space */}
      {showDebugVisuals && (
        <group position={[0, 1.6, -1]} rotation={[0, 0, 0]}>
          <mesh position={[0, 0.1, 0]}>
            <planeGeometry args={[0.4, 0.15]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.7} />
          </mesh>
          <group position={[0, 0.1, 0.01]}>
            <Text 
              position={[0, 0, 0]} 
              color="white" 
              fontSize={0.02} 
              anchorX="center" 
              anchorY="middle"
            >
              Controller Debug Mode
              Press buttons to test
              B key toggles visuals
            </Text>
          </group>
        </group>
      )}
    </>
  );
};

// Simple Text component for VR
const Text: React.FC<{
  children: React.ReactNode;
  position: [number, number, number];
  color: string;
  fontSize: number;
  anchorX: string;
  anchorY: string;
}> = ({ children, position, color, fontSize, anchorX, anchorY }) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  
  useEffect(() => {
    if (!context) return;
    
    // Set canvas size
    canvas.width = 512;
    canvas.height = 256;
    
    // Clear canvas
    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.fillStyle = color;
    context.font = `${Math.floor(fontSize * 1000)}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Handle multiline text
    const text = children?.toString() || '';
    const lines = text.split('\n');
    const lineHeight = fontSize * 1000 * 1.2;
    
    lines.forEach((line, i) => {
      context.fillText(line, canvas.width / 2, canvas.height / 2 - ((lines.length - 1) * lineHeight / 2) + i * lineHeight);
    });
    
    // Create texture
    const newTexture = new THREE.CanvasTexture(canvas);
    setTexture(newTexture);
    
    return () => {
      newTexture.dispose();
    };
  }, [children, color, fontSize]);
  
  if (!texture) return null;
  
  return (
    <mesh position={position}>
      <planeGeometry args={[0.4, 0.15]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}
