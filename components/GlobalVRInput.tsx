// @ts-nocheck - Disable TypeScript checking for React Three Fiber JSX elements
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useXR, Interactive } from '@react-three/xr';
import * as THREE from 'three';
import { vrConsole } from './VRConsole';

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
  
  // Track controller button states to prevent multiple triggers
  const buttonStates = useRef<{[key: string]: boolean}>({});
  
  // Set up controller event listeners
  useEffect(() => {
    if (isPresenting) {
      vrConsole.log('VR mode active - setting up controller event listeners');
      
      // Function to set up event listeners for a controller
      const setupControllerListeners = (controller, index) => {
        // @ts-ignore - XR controller handedness property
        const hand = controller.handedness || `controller-${index}`;
        vrConsole.log(`Setting up listeners for ${hand} controller`);
        
        // Select event (trigger)
        controller.addEventListener('selectstart', () => {
          vrConsole.log(`${hand} controller: select pressed`);
          
          if (hand === 'right' && onMenuSelect) {
            vrConsole.log('Select action triggered');
            onMenuSelect();
          }
        });
        
        // Squeeze event (grip)
        controller.addEventListener('squeezestart', () => {
          vrConsole.log(`${hand} controller: squeeze pressed`);
          
          if (hand === 'right') {
            vrConsole.log('Back action triggered');
            onBack();
          }
        });
        
        // Connect gamepad events
        const connectGamepad = () => {
          if (controller.inputSource?.gamepad) {
            vrConsole.log(`${hand} controller gamepad connected`);
          }
        };
        
        // Try to connect immediately
        connectGamepad();
        
        // Also try on the next frame (sometimes needed)
        setTimeout(connectGamepad, 100);
      };
      
      // Set up listeners for all controllers
      controllers.forEach((controller, index) => {
        setupControllerListeners(controller, index);
      });
      
      // Listen for new controllers
      const onControllerConnected = (e) => {
        vrConsole.log(`New controller connected: ${e.data.handedness || 'unknown hand'}`);
        setupControllerListeners(e.data, controllers.length);
      };
      
      // @ts-ignore - Event name
      player.addEventListener('controlleradded', onControllerConnected);
      
      return () => {
        // @ts-ignore - Event name
        player.removeEventListener('controlleradded', onControllerConnected);
      };
    }
  }, [isPresenting, controllers, player, onMenuSelect, onBack]);
  
  // Helper function to check if a button was just pressed (rising edge detection)
  const wasButtonJustPressed = (controllerId: string, buttonIndex: number, isPressed: boolean) => {
    const buttonId = `${controllerId}-${buttonIndex}`;
    const wasPressed = buttonStates.current[buttonId] || false;
    buttonStates.current[buttonId] = isPressed;
    return isPressed && !wasPressed;
  };

  useFrame(() => {
    if (!isPresenting || controllers.length === 0) {
      return;
    }

    // @ts-ignore - XR controller handedness property
    const leftController = controllers.find(c => c.handedness === 'left');
    // @ts-ignore - XR controller handedness property
    const rightController = controllers.find(c => c.handedness === 'right');
    
    // Skip if no controllers found
    if (!leftController && !rightController) {
      return;
    }
    
    // Process left controller for menu button (typically Y/B button)
    if (leftController?.inputSource?.gamepad) {
      const gamepad = leftController.inputSource.gamepad;
      const buttons = gamepad.buttons;
      const axes = gamepad.axes;
      
      // Log axes for movement debugging
      if (axes && axes.length >= 2) {
        const x = axes[0]?.toFixed(2) || 'N/A';
        const y = axes[1]?.toFixed(2) || 'N/A';
        
        // Only log when there's significant movement
        if (Math.abs(Number(x)) > 0.1 || Math.abs(Number(y)) > 0.1) {
          vrConsole.log(`Left stick: X:${x}, Y:${y}`);
        }
      }
      
      // Check for menu button (typically button 3 = Y on Quest)
      const menuButtonIndices = [3, 4, 5, 6]; // Try multiple indices
      
      for (const index of menuButtonIndices) {
        if (index < buttons.length) {
          const isPressed = buttons[index]?.pressed || false;
          
          if (wasButtonJustPressed('left', index, isPressed)) {
            vrConsole.log(`Menu button (${index}) pressed - toggling menu`);
            onMenuToggle();
            break;
          }
        }
      }
    }
    
    // Process right controller for select and back actions
    if (rightController?.inputSource?.gamepad) {
      const gamepad = rightController.inputSource.gamepad;
      const buttons = gamepad.buttons;
      
      // Check for select button (typically trigger = button 0)
      if (buttons.length > 0) {
        const isSelectPressed = buttons[0]?.pressed || false;
        
        if (wasButtonJustPressed('right', 0, isSelectPressed) && onMenuSelect) {
          vrConsole.log('Select button pressed - triggering select');
          onMenuSelect();
        }
      }
      
      // Check for back button (typically grip = button 1)
      if (buttons.length > 1) {
        const isBackPressed = buttons[1]?.pressed || false;
        
        if (wasButtonJustPressed('right', 1, isBackPressed)) {
          vrConsole.log('Back button pressed - triggering back');
          onBack();
        }
      }
      
      // Log all button presses for debugging
      for (let i = 0; i < buttons.length; i++) {
        const isPressed = buttons[i]?.pressed || false;
        
        if (wasButtonJustPressed('right', i, isPressed)) {
          vrConsole.log(`Right controller button ${i} pressed`);
        }
      }
    }
  });

  return (
    <>
      {/* Visual controller indicators - make them visible for debugging */}
      {isPresenting && controllers.map((controller, i) => (
        // @ts-ignore - XR controller handedness property and React Three Fiber JSX elements
        <group key={`controller-indicator-${i}`}>
          {/* @ts-ignore - React Three Fiber JSX elements */}
          <mesh 
            position={[0, 0, 0]} 
            visible={true} // Make visible for debugging
            // @ts-ignore - Attach mesh to controller
            matrix={controller.matrix}
            matrixAutoUpdate={false}
          >
            {/* @ts-ignore - React Three Fiber JSX elements */}
            <sphereGeometry args={[0.05, 16, 16]} />
            {/* @ts-ignore - React Three Fiber JSX elements */}
            <meshBasicMaterial color={i === 0 ? "#ff0000" : "#0000ff"} />
          </mesh>
        </group>
      ))}
    </>
  );
};