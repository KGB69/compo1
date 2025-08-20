// @ts-nocheck - Disable TypeScript checking for React Three Fiber JSX elements
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useXR, Interactive } from '@react-three/xr';
import * as THREE from 'three';

interface GlobalVRInputProps {
  onMenuToggle: () => void;
  onBack: () => void;
  onMenuSelect?: () => void;
}

export const GlobalVRInput: React.FC<GlobalVRInputProps> = ({ onMenuToggle, onBack, onMenuSelect }) => {
  const { controllers, isPresenting, player } = useXR();
  const { scene } = useThree();
  const menuButtonPressed = useRef(false);
  const backButtonPressed = useRef(false);
  const selectButtonPressed = useRef(false);
  const [debugText, setDebugText] = useState<string>('');
  const debugTextRef = useRef<THREE.Mesh | undefined>(undefined);
  
  // Debug controller buttons
  useEffect(() => {
    if (isPresenting) {
      console.log('VR mode active - controller mappings loaded');
      
      // Create debug text in VR
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.fillText('VR Debug: Press controllers to test', 20, 40);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const geometry = new THREE.PlaneGeometry(1, 0.5);
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position the debug panel in front of the player
      mesh.position.set(0, 1.6, -1.5);
      scene.add(mesh);
      debugTextRef.current = mesh;
      
      return () => {
        scene.remove(mesh);
      };
    }
  }, [isPresenting, scene]);
  
  // Update debug text
  const updateDebugText = (text: string) => {
    setDebugText(text);
    
    if (debugTextRef.current) {
      const material = debugTextRef.current.material as THREE.MeshBasicMaterial;
      const texture = material.map as THREE.CanvasTexture;
      const canvas = texture.image;
      const context = canvas.getContext('2d');
      
      if (context) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.fillText('VR Debug:', 20, 40);
        
        const lines = text.split('\n');
        lines.forEach((line, i) => {
          context.fillText(line, 20, 80 + i * 30);
        });
      }
      
      texture.needsUpdate = true;
    }
  };

  useFrame(() => {
    if (!isPresenting || controllers.length === 0) {
      return;
    }

    // @ts-ignore - XR controller handedness property
    const leftController = controllers.find(c => c.handedness === 'left');
    // @ts-ignore - XR controller handedness property
    const rightController = controllers.find(c => c.handedness === 'right');
    
    let debugInfo = '';
    
    // Show controller connection status
    debugInfo += `Left controller: ${leftController ? 'Connected' : 'Not connected'}\n`;
    debugInfo += `Right controller: ${rightController ? 'Connected' : 'Not connected'}\n`;
    
    // Show gamepad axes for movement debugging
    if (leftController?.inputSource?.gamepad) {
      const axes = leftController.inputSource.gamepad.axes;
      debugInfo += `Left stick: X:${axes[0]?.toFixed(2) || 'N/A'}, Y:${axes[1]?.toFixed(2) || 'N/A'} | `;
      debugInfo += `X:${axes[2]?.toFixed(2) || 'N/A'}, Y:${axes[3]?.toFixed(2) || 'N/A'}\n`;
    }
    
    // Debug controller buttons when pressed
    let leftButtonsPressed = false;
    let rightButtonsPressed = false;
    
    if (leftController?.inputSource?.gamepad) {
      const buttons = leftController.inputSource.gamepad.buttons;
      for (let i = 0; i < buttons.length; i++) {
        if (buttons[i]?.pressed) {
          leftButtonsPressed = true;
          console.log(`Left controller button ${i} pressed`);
          debugInfo += `Left btn ${i} pressed! \n`;
        }
      }
    }

    if (rightController?.inputSource?.gamepad) {
      const buttons = rightController.inputSource.gamepad.buttons;
      for (let i = 0; i < buttons.length; i++) {
        if (buttons[i]?.pressed) {
          rightButtonsPressed = true;
          console.log(`Right controller button ${i} pressed`);
          debugInfo += `Right btn ${i} pressed! \n`;
        }
      }
    }
    
    // Try all possible button indices for menu toggle
    const menuButtonIndices = [3, 4, 5]; // Try multiple indices
    let menuToggled = false;
    
    if (leftController?.inputSource?.gamepad) {
      for (const index of menuButtonIndices) {
        const button = leftController.inputSource.gamepad.buttons[index];
        if (button?.pressed && !menuButtonPressed.current) {
          console.log(`Menu button (index ${index}) pressed`);
          debugInfo += `Menu toggled (btn ${index})\n`;
          onMenuToggle();
          menuToggled = true;
          break;
        }
        menuButtonPressed.current = button?.pressed || false;
      }
    }
    
    // Try all possible button indices for back action
    const backButtonIndices = [0, 1, 2]; // Try multiple indices
    let backTriggered = false;
    
    if (rightController?.inputSource?.gamepad) {
      for (const index of backButtonIndices) {
        const button = rightController.inputSource.gamepad.buttons[index];
        if (button?.pressed && !backButtonPressed.current) {
          console.log(`Back button (index ${index}) pressed`);
          debugInfo += `Back triggered (btn ${index})\n`;
          onBack();
          backTriggered = true;
          break;
        }
        backButtonPressed.current = button?.pressed || false;
      }
    }
    
    // Try all possible button indices for select action
    const selectButtonIndices = [0, 1, 2]; // Try multiple indices
    let selectTriggered = false;
    
    if (rightController?.inputSource?.gamepad && onMenuSelect) {
      for (const index of selectButtonIndices) {
        const button = rightController.inputSource.gamepad.buttons[index];
        if (button?.pressed && !selectButtonPressed.current) {
          console.log(`Select button (index ${index}) pressed`);
          debugInfo += `Select triggered (btn ${index})\n`;
          onMenuSelect();
          selectTriggered = true;
          break;
        }
        selectButtonPressed.current = button?.pressed || false;
      }
    }
    
    // Update debug text if there's activity
    if (leftButtonsPressed || rightButtonsPressed || menuToggled || backTriggered || selectTriggered) {
      updateDebugText(debugInfo);
    }
  });

  return (
    <>
      {/* Visual controller indicators */}
      {isPresenting && controllers.map((controller, i) => (
        // @ts-ignore - XR controller handedness property and React Three Fiber JSX elements
        <group key={`controller-indicator-${i}`}>
          {/* @ts-ignore - React Three Fiber JSX elements */}
          <mesh position={[0, 0, 0]} visible={false}>
            {/* @ts-ignore - React Three Fiber JSX elements */}
            <sphereGeometry args={[0.05, 16, 16]} />
            {/* @ts-ignore - React Three Fiber JSX elements */}
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        </group>
      ))}
    </>
  );
};