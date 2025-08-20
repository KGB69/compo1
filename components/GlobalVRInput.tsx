// @ts-nocheck - Disable TypeScript checking for React Three Fiber JSX elements
import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const { controllers, isPresenting, player, session } = useXR();
  const { scene } = useThree();
  const menuButtonPressed = useRef(false);
  const backButtonPressed = useRef(false);
  const selectButtonPressed = useRef(false);
  const [debugText, setDebugText] = useState<string>('');
  const debugTextRef = useRef<THREE.Mesh | undefined>(undefined);
  const [controllerStatus, setControllerStatus] = useState<{left: boolean, right: boolean}>({left: false, right: false});
  const controllerRefs = useRef<{[key: string]: any}>({});
  const reconnectInterval = useRef<number | null>(null);
  
  // Track controller button states to prevent multiple triggers
  const buttonStates = useRef<{[key: string]: boolean}>({});
  
  // Setup controller listeners function (reusable)  
  const setupControllerListeners = useCallback((controller, index) => {
    if (!controller) return;
    
    // @ts-ignore - XR controller handedness property
    const hand = controller.handedness || `controller-${index}`;
    vrConsole.log(`Setting up listeners for ${hand} controller`);
    
    // Store reference to controller
    controllerRefs.current[hand] = controller;
    
    // Update controller status
    setControllerStatus(prev => ({
      ...prev,
      [hand]: true
    }));
    
    // Select event (trigger)
    const onSelectStart = () => {
      vrConsole.log(`${hand} controller: select pressed`);
      if (hand === 'right' && onMenuSelect) {
        vrConsole.log('Select action triggered');
        onMenuSelect();
      }
    };
    
    // Squeeze event (grip)
    const onSqueezeStart = () => {
      vrConsole.log(`${hand} controller: squeeze pressed`);
      if (hand === 'right') {
        vrConsole.log('Back action triggered');
        onBack();
      }
    };
    
    // Remove existing listeners if any (to prevent duplicates)
    controller.removeEventListener('selectstart', onSelectStart);
    controller.removeEventListener('squeezestart', onSqueezeStart);
    
    // Add listeners
    controller.addEventListener('selectstart', onSelectStart);
    controller.addEventListener('squeezestart', onSqueezeStart);
    
    // Store listeners for cleanup
    controller._eventListeners = controller._eventListeners || {};
    controller._eventListeners.selectstart = onSelectStart;
    controller._eventListeners.squeezestart = onSqueezeStart;
    
    // Connect gamepad
    const connectGamepad = () => {
      if (controller.inputSource?.gamepad) {
        vrConsole.log(`${hand} controller gamepad connected`);
        // Log gamepad details
        const gamepad = controller.inputSource.gamepad;
        vrConsole.log(`Gamepad: ${gamepad.id || 'unknown'}, buttons: ${gamepad.buttons?.length || 0}, axes: ${gamepad.axes?.length || 0}`);
      } else {
        vrConsole.log(`${hand} controller has no gamepad yet`);
      }
    };
    
    // Try to connect immediately and with delays
    connectGamepad();
    setTimeout(connectGamepad, 100);
    setTimeout(connectGamepad, 500);
    setTimeout(connectGamepad, 1000);
    
    return () => {
      // Cleanup listeners
      if (controller && controller._eventListeners) {
        controller.removeEventListener('selectstart', controller._eventListeners.selectstart);
        controller.removeEventListener('squeezestart', controller._eventListeners.squeezestart);
      }
    };
  }, [onMenuSelect, onBack]);
  
  // Monitor XR session for controller changes
  useEffect(() => {
    if (!isPresenting || !session) {
      // Clear controller status when exiting VR
      setControllerStatus({left: false, right: false});
      return;
    }
    
    vrConsole.log('VR session active - monitoring for controllers');
    
    // Function to check for controllers and set up listeners
    const checkForControllers = () => {
      // Clear previous controller status
      const newStatus = {left: false, right: false};
      
      // Process all controllers
      controllers.forEach((controller, index) => {
        // @ts-ignore - XR controller handedness property
        const hand = controller.handedness || `controller-${index}`;
        
        // Update status
        if (hand === 'left' || hand === 'right') {
          newStatus[hand] = true;
        }
        
        // Set up listeners if not already done
        if (!controllerRefs.current[hand]) {
          setupControllerListeners(controller, index);
        }
      });
      
      // Update controller status
      setControllerStatus(newStatus);
      
      // Log controller status
      vrConsole.log(`Controller status: Left: ${newStatus.left ? 'Connected' : 'Disconnected'}, Right: ${newStatus.right ? 'Connected' : 'Disconnected'}`);
    };
    
    // Check immediately
    checkForControllers();
    
    // Set up periodic checking for controllers
    reconnectInterval.current = window.setInterval(checkForControllers, 1000);
    
    // Listen for controller connected events
    const onControllerConnected = (e) => {
      vrConsole.log(`Controller connected event: ${e.data.handedness || 'unknown hand'}`);
      setupControllerListeners(e.data, controllers.length);
    };
    
    // Listen for controller disconnected events
    const onControllerDisconnected = (e) => {
      // @ts-ignore - XR controller handedness property
      const hand = e.data.handedness || 'unknown';
      vrConsole.log(`Controller disconnected: ${hand}`);
      
      // Update status
      setControllerStatus(prev => ({
        ...prev,
        [hand]: false
      }));
      
      // Remove from refs
      delete controllerRefs.current[hand];
    };
    
    // Add event listeners to player
    if (player) {
      // @ts-ignore - Event names
      player.addEventListener('controlleradded', onControllerConnected);
      player.addEventListener('controllerremoved', onControllerDisconnected);
    }
    
    // Add event listeners to session
    if (session) {
      session.addEventListener('inputsourceschange', (event) => {
        vrConsole.log('XR input sources changed');
        
        // Process added sources
        if (event.added && event.added.length) {
          vrConsole.log(`${event.added.length} input sources added`);
          event.added.forEach(source => {
            vrConsole.log(`Input source added: ${source.handedness || 'unknown'} hand`);
          });
        }
        
        // Process removed sources
        if (event.removed && event.removed.length) {
          vrConsole.log(`${event.removed.length} input sources removed`);
        }
        
        // Check for controllers again
        setTimeout(checkForControllers, 100);
      });
    }
    
    return () => {
      // Clean up
      if (reconnectInterval.current) {
        window.clearInterval(reconnectInterval.current);
      }
      
      if (player) {
        // @ts-ignore - Event names
        player.removeEventListener('controlleradded', onControllerConnected);
        player.removeEventListener('controllerremoved', onControllerDisconnected);
      }
      
      // Clean up controller references
      Object.values(controllerRefs.current).forEach(controller => {
        if (controller && controller._eventListeners) {
          controller.removeEventListener('selectstart', controller._eventListeners.selectstart);
          controller.removeEventListener('squeezestart', controller._eventListeners.squeezestart);
        }
      });
      
      controllerRefs.current = {};
    };
  }, [isPresenting, session, controllers, player, setupControllerListeners]);
  
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

  // Create visual status panel for controller connection
  useEffect(() => {
    if (isPresenting) {
      // Create a canvas for the controller status
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      
      // Function to update the status display
      const updateStatusDisplay = () => {
        const context = canvas.getContext('2d');
        if (!context) return;
        
        // Clear canvas
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw border
        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        
        // Draw title
        context.fillStyle = 'white';
        context.font = 'bold 24px Arial';
        context.fillText('Controller Status', 20, 40);
        
        // Draw left controller status
        context.font = '20px Arial';
        context.fillStyle = controllerStatus.left ? '#00FF00' : '#FF0000';
        context.fillText(`Left Controller: ${controllerStatus.left ? 'CONNECTED' : 'DISCONNECTED'}`, 20, 80);
        
        // Draw right controller status
        context.fillStyle = controllerStatus.right ? '#00FF00' : '#FF0000';
        context.fillText(`Right Controller: ${controllerStatus.right ? 'CONNECTED' : 'DISCONNECTED'}`, 20, 120);
        
        // Draw reconnection info
        context.fillStyle = '#FFFF00';
        context.font = '16px Arial';
        context.fillText('Auto-reconnection active - checking every second', 20, 160);
        context.fillText('If controllers are not detected, try:', 20, 190);
        context.fillText('1. Press any button on controllers', 30, 220);
        context.fillText('2. Restart VR session', 30, 245);
      };
      
      // Create texture and material
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      
      // Create mesh for the status panel
      const geometry = new THREE.PlaneGeometry(1, 0.5);
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position the panel in VR space (above and to the left)
      mesh.position.set(-1.2, 1.6, -1.5);
      mesh.rotation.y = Math.PI / 8; // Angle slightly toward center
      scene.add(mesh);
      
      // Store reference
      debugTextRef.current = mesh;
      
      // Update initially
      updateStatusDisplay();
      
      // Update when controller status changes
      const intervalId = setInterval(() => {
        updateStatusDisplay();
        texture.needsUpdate = true;
      }, 500);
      
      return () => {
        clearInterval(intervalId);
        scene.remove(mesh);
      };
    }
  }, [isPresenting, controllerStatus, scene]);

  return (
    <>
      {/* Visual controller indicators with enhanced visibility */}
      {isPresenting && controllers.map((controller, i) => {
        // @ts-ignore - XR controller handedness property
        const hand = controller.handedness || `controller-${i}`;
        const color = hand === 'left' ? "#ff0000" : "#0000ff";
        
        return (
          // @ts-ignore - React Three Fiber JSX elements
          <group key={`controller-indicator-${i}`}>
            {/* Controller sphere */}
            {/* @ts-ignore - React Three Fiber JSX elements */}
            <mesh 
              position={[0, 0, 0]} 
              visible={true}
              // @ts-ignore - Attach mesh to controller
              matrix={controller.matrix}
              matrixAutoUpdate={false}
            >
              {/* @ts-ignore - React Three Fiber JSX elements */}
              <sphereGeometry args={[0.05, 16, 16]} />
              {/* @ts-ignore - React Three Fiber JSX elements */}
              <meshBasicMaterial color={color} transparent={true} opacity={0.8} />
            </mesh>
            
            {/* Controller beam for better visibility */}
            {/* @ts-ignore - React Three Fiber JSX elements */}
            <mesh
              position={[0, 0, -0.05]}
              visible={true}
              // @ts-ignore - Attach mesh to controller
              matrix={controller.matrix}
              matrixAutoUpdate={false}
            >
              {/* @ts-ignore - React Three Fiber JSX elements */}
              <cylinderGeometry args={[0.002, 0.002, 0.2, 8]} />
              {/* @ts-ignore - React Three Fiber JSX elements */}
              <meshBasicMaterial color={color} />
            </mesh>
          </group>
        );
      })}
    </>
  );
};