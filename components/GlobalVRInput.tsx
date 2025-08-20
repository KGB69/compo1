// @ts-nocheck - Disable TypeScript checking for React Three Fiber JSX elements
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useXR, Interactive } from '@react-three/xr';
import * as THREE from 'three';
import { vrConsole } from './VRConsole';

// Define navigator.xr for TypeScript
declare global {
  interface Navigator {
    xr?: {
      isSessionSupported(mode: string): Promise<boolean>;
      requestSession(mode: string, options?: any): Promise<any>;
    };
  }
}

interface GlobalVRInputProps {
  onMenuToggle: () => void;
  onMenuSelect?: () => void;
  onBack: () => void;
  onMove?: (x: number, y: number) => void;
}

export const GlobalVRInput: React.FC<GlobalVRInputProps> = ({ onMenuToggle, onBack, onMenuSelect, onMove }) => {
  const { controllers, isPresenting, player, session } = useXR();
  const { scene } = useThree();
  const menuButtonPressed = useRef(false);
  const backButtonPressed = useRef(false);
  const selectButtonPressed = useRef(false);
  const [debugText, setDebugText] = useState<string>('');
  const debugTextRef = useRef<THREE.Mesh | undefined>(undefined);
  const [controllerStatus, setControllerStatus] = useState<{ 
    left: boolean; 
    right: boolean;
    leftType: string;
    rightType: string;
  }>({ 
    left: false, 
    right: false,
    leftType: 'unknown',
    rightType: 'unknown'
  });
  const controllerRefs = useRef<{[key: string]: any}>({});
  const reconnectInterval = useRef<number | null>(null);
  
  // Direct access to WebXR input sources
  const xrInputSources = useRef<any[]>([]);
  
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
      setControllerStatus({left: false, right: false, leftType: 'unknown', rightType: 'unknown'});
      xrInputSources.current = [];
      return;
    }
    
    vrConsole.log('VR session active - monitoring for controllers');
    
    // Set up periodic controller check to handle reconnections
    const controllerCheckInterval = setInterval(() => {
      vrConsole.log('Performing periodic controller check...');
      checkForControllers();
    }, 5000); // Check every 5 seconds
    
    // Direct access to WebXR input sources
    const updateInputSources = () => {
      if (session) {
        try {
          // Get all input sources directly from the session
          const sources = session.inputSources;
          xrInputSources.current = Array.from(sources || []);
          
          vrConsole.log(`Direct WebXR: Found ${xrInputSources.current.length} input sources`);
          
          // Log details about each input source
          xrInputSources.current.forEach((source, index) => {
            const hand = source.handedness || 'unknown';
            vrConsole.log(`Input source ${index}: ${hand} hand, ${source.targetRayMode} mode`);
            
            // Check if gamepad is available
            if (source.gamepad) {
              vrConsole.log(`Gamepad found for ${hand}: ${source.gamepad.id || 'unknown'}, buttons: ${source.gamepad.buttons?.length || 0}, axes: ${source.gamepad.axes?.length || 0}`);
              
              // Log all button states for debugging
              const buttons = source.gamepad.buttons || [];
              for (let i = 0; i < buttons.length; i++) {
                const isPressed = buttons[i]?.pressed || false;
                const value = buttons[i]?.value || 0;
                if (isPressed) {
                  vrConsole.log(`${hand} controller button ${i} is pressed (value: ${value.toFixed(2)})`);
                }
              }
              
              // Log all axes for debugging
              const axes = source.gamepad.axes || [];
              if (axes.length > 0) {
                vrConsole.log(`${hand} controller axes: [${axes.map(a => a?.toFixed(2) || '0.00').join(', ')}]`);
              }
            } else {
              vrConsole.log(`No gamepad for ${hand} input source`);
            }
          });
        } catch (error) {
          vrConsole.log(`Error accessing input sources: ${error.message}`);
        }
      }
    };
    
    // Function to check for controllers and set up listeners
    const checkForControllers = () => {
      // Update direct WebXR input sources
      updateInputSources();
      
      // Clear previous controller status
      const newStatus = {left: false, right: false, leftType: 'unknown', rightType: 'unknown'};
      
      // First check direct WebXR input sources
      xrInputSources.current.forEach(source => {
        const hand = source.handedness;
        if (hand === 'left' || hand === 'right') {
          newStatus[hand] = true;
        }
      });
      
      // Then process controllers from react-three/xr
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
      
      // Detect controller types
      let leftType = 'unknown';
      let rightType = 'unknown';
      
      // Check WebXR input sources for controller type detection
      if (xrInputSources.current.length > 0) {
        const leftSource = xrInputSources.current.find(source => source.handedness === 'left');
        const rightSource = xrInputSources.current.find(source => source.handedness === 'right');
        
        if (leftSource?.gamepad) {
          leftType = detectControllerType(leftSource.gamepad);
        }
        
        if (rightSource?.gamepad) {
          rightType = detectControllerType(rightSource.gamepad);
        }
      }
      
      // Update controller status with types
      setControllerStatus({
        ...newStatus,
        leftType,
        rightType
      });
      
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
    }
    
    // Clean up controller references
    Object.values(controllerRefs.current).forEach(controller => {
      if (controller && controller._eventListeners) {
        controller.removeEventListener('selectstart', controller._eventListeners.selectstart);
        controller.removeEventListener('squeezestart', controller._eventListeners.squeezestart);
      }
    });
    
    // Set up event listeners for input source changes
    session.addEventListener('inputsourceschange', (event) => {
      vrConsole.log('Input sources changed');
      
      // Process new sources
      if (event.added && event.added.length) {
        vrConsole.log(`${event.added.length} new input sources added`);
        event.added.forEach(source => {
          if (source.gamepad) {
            vrConsole.log(`Gamepad found for ${source.handedness}: ${source.gamepad.id || 'unknown'}`);
          }
        });
      }
      
      // Process removed sources
      if (event.removed && event.removed.length) {
        vrConsole.log(`${event.removed.length} input sources removed`);
      }
      
      // Update input sources list
      updateInputSources();
      
      // Check for controllers again
      setTimeout(checkForControllers, 100);
    });
    
    // Try to directly access navigator.xr for additional debugging
    if (window.navigator && window.navigator.xr) {
      vrConsole.log('Navigator XR API is available');
    } else {
      vrConsole.log('Navigator XR API not found');
    }
    
    return () => {
      // Clean up
      if (reconnectInterval.current) {
        window.clearInterval(reconnectInterval.current);
      }
      
      // Clear the controller check interval
      if (controllerCheckInterval) {
        clearInterval(controllerCheckInterval);
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

  // Track last time we logged controller info to avoid spamming the console
  const lastControllerLog = useRef<number>(0);
  
  useFrame(() => {
    if (!isPresenting) {
      return;
    }
    
    // Only log controller info every 2 seconds to avoid console spam
    const now = Date.now();
    const shouldLogDetails = now - lastControllerLog.current > 2000;
    if (shouldLogDetails) {
      vrConsole.log('Checking controller status...');
      lastControllerLog.current = now;
    }

    // Try to get controllers from both direct WebXR and react-three/xr
    let leftController, rightController;
    let leftGamepad, rightGamepad;
    
    // First try direct WebXR input sources (more reliable)
    if (xrInputSources.current.length > 0) {
      const leftSource = xrInputSources.current.find(source => source.handedness === 'left');
      const rightSource = xrInputSources.current.find(source => source.handedness === 'right');
      
      if (leftSource) {
        if (shouldLogDetails) vrConsole.log('Found left controller via WebXR API');
        leftGamepad = leftSource.gamepad;
      }
      
      if (rightSource) {
        if (shouldLogDetails) vrConsole.log('Found right controller via WebXR API');
        rightGamepad = rightSource.gamepad;
      }
    }
    
    // Fallback to react-three/xr controllers if needed
    if (controllers.length > 0) {
      // @ts-ignore - XR controller handedness property
      leftController = controllers.find(c => c.handedness === 'left');
      // @ts-ignore - XR controller handedness property
      rightController = controllers.find(c => c.handedness === 'right');
      
      if (leftController && shouldLogDetails) {
        vrConsole.log('Found left controller via react-three/xr');
      }
      
      if (rightController && shouldLogDetails) {
        vrConsole.log('Found right controller via react-three/xr');
      }
      
      // Get gamepads from controllers if not already found
      if (!leftGamepad && leftController?.inputSource?.gamepad) {
        leftGamepad = leftController.inputSource.gamepad;
        if (shouldLogDetails) vrConsole.log('Using left gamepad from react-three/xr');
      }
      
      if (!rightGamepad && rightController?.inputSource?.gamepad) {
        rightGamepad = rightController.inputSource.gamepad;
        if (shouldLogDetails) vrConsole.log('Using right gamepad from react-three/xr');
      }
    }
    
    // Try to get controllers from navigator.getGamepads() as a last resort
    if ((!leftGamepad || !rightGamepad) && navigator.getGamepads) {
      try {
        const gamepads = navigator.getGamepads();
        if (gamepads && gamepads.length > 0) {
          // Look for VR gamepads
          for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad && (gamepad.id.includes('Oculus') || gamepad.id.includes('Quest') || 
                gamepad.id.includes('VR') || gamepad.id.includes('XR'))) {
              
              // Try to determine if it's left or right
              const isLeft = gamepad.id.toLowerCase().includes('left');
              const isRight = gamepad.id.toLowerCase().includes('right');
              
              if (isLeft && !leftGamepad) {
                leftGamepad = gamepad;
                if (shouldLogDetails) vrConsole.log(`Found left gamepad via navigator: ${gamepad.id}`);
              } else if (isRight && !rightGamepad) {
                rightGamepad = gamepad;
                if (shouldLogDetails) vrConsole.log(`Found right gamepad via navigator: ${gamepad.id}`);
              } else if (!leftGamepad && !rightGamepad) {
                // If we can't determine handedness but need a controller, use first one as left
                leftGamepad = gamepad;
                if (shouldLogDetails) vrConsole.log(`Using unknown gamepad as left: ${gamepad.id}`);
              }
            }
          }
        }
      } catch (e) {
        if (shouldLogDetails) vrConsole.log(`Error accessing gamepads: ${e.message}`);
      }
    }
    
    // Skip if no controllers or gamepads found
    if (!leftGamepad && !rightGamepad && !leftController && !rightController) {
      if (shouldLogDetails) vrConsole.log('No controllers detected - using fallback controls');
      return;
    }
    
    // Process left controller for menu button and movement
    if (leftGamepad) {
      const buttons = leftGamepad.buttons || [];
      const axes = leftGamepad.axes || [];
      
      // Handle movement with left thumbstick - try multiple axis combinations
      let movementX = 0;
      let movementY = 0;
      let axisUsed = 'none';
      
      // Try primary thumbstick (most common mapping: axes 0,1)
      if (axes.length >= 2) {
        movementX = axes[0] || 0;
        movementY = axes[1] || 0;
        if (Math.abs(movementX) > 0.1 || Math.abs(movementY) > 0.1) {
          axisUsed = '0,1';
        }
      }
      
      // Try secondary thumbstick if available and primary not used
      if (axisUsed === 'none' && axes.length >= 4) {
        movementX = axes[2] || 0;
        movementY = axes[3] || 0;
        if (Math.abs(movementX) > 0.1 || Math.abs(movementY) > 0.1) {
          axisUsed = '2,3';
        }
      }
      
      // Try other possible mappings if needed
      if (axisUsed === 'none' && axes.length >= 6) {
        movementX = axes[4] || 0;
        movementY = axes[5] || 0;
        if (Math.abs(movementX) > 0.1 || Math.abs(movementY) > 0.1) {
          axisUsed = '4,5';
        }
      }
      
      // If we found movement on any axis
      if (axisUsed !== 'none') {
        // Log movement for debugging (but not too often)
        if (Math.abs(movementX) > 0.5 || Math.abs(movementY) > 0.5) {
          vrConsole.log(`Left stick (${axisUsed}): X:${movementX.toFixed(2)}, Y:${movementY.toFixed(2)}`);
        }
        
        // Call movement handler if provided
        if (onMove) {
          onMove(movementX, movementY);
        }
        
        // Dispatch a custom event for Player component to detect
        const moveEvent = new CustomEvent('vr-movement', {
          detail: { x: movementX, y: movementY }
        });
        window.dispatchEvent(moveEvent);
        
        // Update the movement reference that Player component reads
        if (typeof window !== 'undefined') {
          window.vrMovement = { x: movementX, y: movementY };
        }
      }
      
      // Fallback to button-based movement if no stick movement detected
      if (axisUsed === 'none' && buttons.length >= 4) {
        // Common button mapping for directional movement
        // This varies by controller but often uses face buttons or d-pad
        const buttonMap = {
          up: [0, 4, 12], // Try multiple possible indices
          down: [1, 5, 13],
          left: [2, 6, 14],
          right: [3, 7, 15]
        };
        
        // Check each direction
        for (const upBtn of buttonMap.up) {
          if (upBtn < buttons.length && buttons[upBtn]?.pressed) {
            movementY = -1; // Forward
            vrConsole.log(`Button-based movement: Forward (button ${upBtn})`);
            break;
          }
        }
        
        for (const downBtn of buttonMap.down) {
          if (downBtn < buttons.length && buttons[downBtn]?.pressed) {
            movementY = 1; // Backward
            vrConsole.log(`Button-based movement: Backward (button ${downBtn})`);
            break;
          }
        }
        
        for (const leftBtn of buttonMap.left) {
          if (leftBtn < buttons.length && buttons[leftBtn]?.pressed) {
            movementX = -1; // Left
            vrConsole.log(`Button-based movement: Left (button ${leftBtn})`);
            break;
          }
        }
        
        for (const rightBtn of buttonMap.right) {
          if (rightBtn < buttons.length && buttons[rightBtn]?.pressed) {
            movementX = 1; // Right
            vrConsole.log(`Button-based movement: Right (button ${rightBtn})`);
            break;
          }
        }
        
        // If any button-based movement was detected
        if (movementX !== 0 || movementY !== 0) {
          if (onMove) {
            onMove(movementX, movementY);
          }
          
          // Also dispatch a custom event for Player component to detect
          const moveEvent = new CustomEvent('vr-movement', {
            detail: { x: movementX, y: movementY }
          });
          window.dispatchEvent(moveEvent);
          
          // Update the movement reference that Player component reads
          if (typeof window !== 'undefined') {
            window.vrMovement = { x: movementX, y: movementY };
          }
        }
      }
      
      // Log all button states for debugging
      if (buttons) {
        for (let i = 0; i < buttons.length; i++) {
          const isPressed = buttons[i]?.pressed || false;
          if (isPressed) {
            vrConsole.log(`Left controller button ${i} is pressed`);
          }
        }
      }
    }
    
    // Process right controller for select and back buttons
    if (rightGamepad) {
      const buttons = rightGamepad.buttons || [];
      
      // Get controller-specific button mappings based on detected type
      const controllerType = controllerStatus.rightType;
      
      // Select button indices based on controller type
      let selectButtonIndices = [0, 2, 4]; // Default (Quest: A button is usually 0)
      
      if (controllerType === 'vive') {
        selectButtonIndices = [0, 1, 3]; // Vive controller mapping
      } else if (controllerType === 'index') {
        selectButtonIndices = [0, 1, 4]; // Valve Index controller mapping
      } else if (controllerType === 'wmr') {
        selectButtonIndices = [0, 2, 7]; // Windows Mixed Reality mapping
      }
      
      vrConsole.log(`Using ${controllerType} controller mapping for select buttons: ${selectButtonIndices.join(', ')}`);
      
      for (const index of selectButtonIndices) {
        if (index < buttons.length && buttons[index]) {
          const isPressed = buttons[index].pressed;
          
          // Use rising edge detection to avoid repeated triggers
          if (wasButtonJustPressed('right', index, isPressed)) {
            vrConsole.log(`Right controller: Button ${index} pressed (select)`); 
            if (onMenuSelect) {
              vrConsole.log('Triggering menu select action');
              onMenuSelect();
              break;
            }
          }
        }
      }
      
      // Back button indices based on controller type
      let backButtonIndices = [1, 3, 5]; // Default (Quest: B button is usually 1)
      
      if (controllerType === 'vive') {
        backButtonIndices = [2, 3, 8]; // Vive controller mapping
      } else if (controllerType === 'index') {
        backButtonIndices = [1, 3, 5]; // Valve Index controller mapping
      } else if (controllerType === 'wmr') {
        backButtonIndices = [1, 3, 6]; // Windows Mixed Reality mapping
      }
      
      vrConsole.log(`Using ${controllerType} controller mapping for back buttons: ${backButtonIndices.join(', ')}`);
      
      for (const index of backButtonIndices) {
        if (index < buttons.length && buttons[index]) {
          const isPressed = buttons[index].pressed;
          
          // Use rising edge detection to avoid repeated triggers
          if (wasButtonJustPressed('right', index, isPressed)) {
            vrConsole.log(`Right controller: Button ${index} pressed (back)`);
            if (onBack) {
              vrConsole.log('Triggering back action');
              onBack();
              break;
            }
          }
        }
      }
      
      // Also check for trigger press as select action (common fallback)
      const triggerIndices = [6, 7, 2]; // Trigger is often index 6 or 7
      for (const index of triggerIndices) {
        if (index < buttons.length && buttons[index]) {
          const value = buttons[index].value || 0;
          const isPressed = buttons[index].pressed || value > 0.7; // Consider pressed if value > 0.7
          
          if (wasButtonJustPressed('right-trigger', index, isPressed)) {
            vrConsole.log(`Right controller: Trigger ${index} pressed (select)`); 
            if (onMenuSelect) {
              vrConsole.log('Triggering menu select action via trigger');
              onMenuSelect();
              break;
            }
          }
        }
      }
      
      // Check for squeeze/grip as back action (common fallback)
      const gripIndices = [8, 9, 1]; // Grip is often index 8 or 9
      for (const index of gripIndices) {
        if (index < buttons.length && buttons[index]) {
          const value = buttons[index].value || 0;
          const isPressed = buttons[index].pressed || value > 0.7; // Consider pressed if value > 0.7
          
          if (wasButtonJustPressed('right-grip', index, isPressed)) {
            vrConsole.log(`Right controller: Grip ${index} pressed (back)`);
            if (onBack) {
              vrConsole.log('Triggering back action via grip');
              onBack();
              break;
            }
          }
        }
      }
      
      // Log all button states for debugging
      for (let i = 0; i < buttons.length; i++) {
        const isPressed = buttons[i]?.pressed || false;
        if (isPressed) {
          vrConsole.log(`Right controller button ${i} is pressed`);
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
        context.fillText(`Type: ${controllerStatus.leftType}`, 250, 80);
        
        // Draw right controller status
        context.fillStyle = controllerStatus.right ? '#00FF00' : '#FF0000';
        context.fillText(`Right Controller: ${controllerStatus.right ? 'CONNECTED' : 'DISCONNECTED'}`, 20, 120);
        context.fillText(`Type: ${controllerStatus.rightType}`, 250, 120);
        
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