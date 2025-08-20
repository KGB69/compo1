
// @ts-nocheck - Disable TypeScript checking for React Three Fiber JSX elements
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei/core';
import * as THREE from 'three';
import { usePlayerControls } from '../hooks/useKeyboardControls';
import { PLAYER_SPEED, PLAYER_HEIGHT, ROOM_SIZE } from '../constants';
import { GameState } from '../types';
import { useXR } from '@react-three/xr';
import { vrConsole } from './VRConsole';

interface PlayerProps {
  gameState: GameState;
  isLocked: boolean;
  onPointerLockChange: (isLocked: boolean) => void;
}

export const Player: React.FC<PlayerProps> = ({ gameState, isLocked, onPointerLockChange }) => {
  const { camera, scene } = useThree();
  const controlsRef = useRef<any>(null);
  const controls = usePlayerControls();
  const velocity = useRef(new THREE.Vector3());
  const desktopMoveDirection = new THREE.Vector3();
  const [movementDebugText, setMovementDebugText] = useState<string>('');
  const movementDebugRef = useRef<THREE.Mesh>();

  const { player, controllers, isPresenting } = useXR();

  // Create debug text for VR movement
  useEffect(() => {
    if (isPresenting) {
      if (isLocked) controlsRef.current?.unlock();
      
      // Log initialization to VR console
      vrConsole.log('VR Player initialized');
      vrConsole.log(`Room size: ${ROOM_SIZE}x${ROOM_SIZE} meters`);
      vrConsole.log('Move with left thumbstick');
      vrConsole.log('Fallback controls: Look down to move forward');
      
      // Create movement debug text in VR
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.fillText('Movement Debug: Use left thumbstick', 20, 40);
        context.fillStyle = '#FFFF00';
        context.font = '18px Arial';
        context.fillText('Fallback: Look down to move forward', 20, 70);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const geometry = new THREE.PlaneGeometry(1, 0.5);
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position the debug panel in front of the player
      mesh.position.set(0, 1.2, -1.5);
      scene.add(mesh);
      movementDebugRef.current = mesh;
      
      return () => {
        scene.remove(mesh);
      };
    }

    if ((gameState === GameState.PAGE_VIEW || gameState === GameState.START) && isLocked) {
      controlsRef.current?.unlock();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 't' && (gameState === GameState.EXPLORING || gameState === GameState.MENU)) {
        if (isLocked) {
          controlsRef.current?.unlock();
        } else {
          controlsRef.current?.lock();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, isLocked, isPresenting]);

  const handleLock = useCallback(() => {
    if (!isPresenting) onPointerLockChange(true);
  }, [onPointerLockChange, isPresenting]);

  const handleUnlock = useCallback(() => {
    if (!isPresenting) onPointerLockChange(false);
  }, [onPointerLockChange, isPresenting]);

  // Update movement debug text
  const updateMovementDebugText = (text: string) => {
    setMovementDebugText(text);
    
    if (movementDebugRef.current) {
      const material = movementDebugRef.current.material as THREE.MeshBasicMaterial;
      const texture = material.map as THREE.CanvasTexture;
      const canvas = texture.image;
      const context = canvas.getContext('2d');
      
      if (context) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.fillText('Movement Debug:', 20, 40);
        
        const lines = text.split('\n');
        lines.forEach((line, i) => {
          context.fillText(line, 20, 80 + i * 30);
        });
      }
      
      texture.needsUpdate = true;
    }
  };

  // Track if controllers are available
  const [controllersAvailable, setControllersAvailable] = useState<boolean>(false);
  const lastControllerCheck = useRef<number>(0);
  
  // Track head position for fallback controls
  const lastHeadPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const headVelocity = useRef<THREE.Vector3>(new THREE.Vector3());
  
  useFrame((state, delta) => {
    const canMove = gameState === GameState.EXPLORING || gameState === GameState.MENU;

    if (!canMove) {
      velocity.current.set(0, 0, 0);
      return;
    }
    
    // Check if controllers are available (not too frequently)
    if (isPresenting && performance.now() - lastControllerCheck.current > 1000) {
      const hasControllers = controllers.length > 0 && 
        (controllers.find(c => c.handedness === 'left') || controllers.find(c => c.handedness === 'right'));
      
      setControllersAvailable(hasControllers);
      lastControllerCheck.current = performance.now();
      
      if (!hasControllers) {
        vrConsole.log('No controllers detected - using fallback controls');
      }
    }
    
    if (isPresenting && player) {
      // Calculate head movement for fallback controls
      if (!controllersAvailable) {
        // Get current head position
        const headPosition = new THREE.Vector3();
        state.camera.getWorldPosition(headPosition);
        
        // Calculate head velocity
        if (lastHeadPosition.current.length() > 0) {
          headVelocity.current.subVectors(headPosition, lastHeadPosition.current);
          headVelocity.current.divideScalar(delta);
          
          // Log significant head movement
          if (headVelocity.current.length() > 1.0) {
            vrConsole.log(`Head velocity: ${headVelocity.current.length().toFixed(2)}`);
          }
        }
        
        // Store current position for next frame
        lastHeadPosition.current.copy(headPosition);
      }
      
      // Only try controller-based movement if controllers are available
      if (controllers.length > 0) {
        // VR Movement Logic with enhanced debugging and controls
        // @ts-ignore - XR controller handedness property
        const leftController = controllers.find(c => c.handedness === 'left');
        // @ts-ignore - XR controller handedness property
        const rightController = controllers.find(c => c.handedness === 'right');
        
        let debugInfo = '';
        
        // Show controller connection status
        debugInfo += `Left: ${leftController ? 'Connected' : 'Not connected'}\n`;
        debugInfo += `Right: ${rightController ? 'Connected' : 'Not connected'}\n`;
        
        // Try multiple movement methods for compatibility
        let stickX = 0;
        let stickY = 0;
        let axisUsed = 'none';
        
        // Method 1: Standard gamepad axes
        if (leftController?.inputSource?.gamepad) {
            const axes = leftController.inputSource.gamepad.axes;
            
            // Log all available axes for debugging
            if (axes && axes.length > 0) {
                debugInfo += `Axes: [${axes.map(a => a?.toFixed(2) || 'N/A').join(', ')}]\n`;
                
                // Try all possible axis combinations for movement
                // Primary thumbstick (most common)
                if (Math.abs(axes[0]) > 0.1 || Math.abs(axes[1]) > 0.1) {
                    stickX = axes[0];
                    stickY = axes[1];
                    axisUsed = '0,1';
                } 
                // Secondary thumbstick
                else if (Math.abs(axes[2]) > 0.1 || Math.abs(axes[3]) > 0.1) {
                    stickX = axes[2];
                    stickY = axes[3];
                    axisUsed = '2,3';
                }
                // Try other possible combinations
                else if (axes.length > 4 && (Math.abs(axes[4]) > 0.1 || Math.abs(axes[5]) > 0.1)) {
                    stickX = axes[4];
                    stickY = axes[5];
                    axisUsed = '4,5';
                }
            }
        }
        
        // Method 2: Try to get movement from controller position changes
        if (axisUsed === 'none' && leftController) {
            // Get controller position and orientation
            const controllerPos = new THREE.Vector3();
            leftController.getWorldPosition(controllerPos);
            
            // Get controller forward direction
            const controllerDir = new THREE.Vector3(0, 0, -1);
            controllerDir.applyQuaternion(leftController.quaternion);
            controllerDir.y = 0; // Keep movement on horizontal plane
            controllerDir.normalize();
            
            // Use controller tilt for movement direction
            const tiltThreshold = 0.3;
            if (Math.abs(controllerDir.z) > tiltThreshold || Math.abs(controllerDir.x) > tiltThreshold) {
                stickX = -controllerDir.x;
                stickY = -controllerDir.z;
                axisUsed = 'controller-tilt';
            }
        }
        
        // Method 3: Try direct button mapping for movement (fallback)
        if (axisUsed === 'none' && leftController?.inputSource?.gamepad) {
            const buttons = leftController.inputSource.gamepad.buttons;
            const buttonMap = {
                forward: 4, // Example button index
                backward: 5,
                left: 6,
                right: 7
            };
            
            // Check if any movement buttons are pressed
            if (buttons.length > Math.max(...Object.values(buttonMap))) {
                if (buttons[buttonMap.forward]?.pressed) stickY = -1;
                if (buttons[buttonMap.backward]?.pressed) stickY = 1;
                if (buttons[buttonMap.left]?.pressed) stickX = -1;
                if (buttons[buttonMap.right]?.pressed) stickX = 1;
                
                if (stickX !== 0 || stickY !== 0) {
                    axisUsed = 'button-map';
                }
            }
        }
        
        debugInfo += `Using method: ${axisUsed}\n`;
        debugInfo += `Movement: X:${stickX.toFixed(2)}, Y:${stickY.toFixed(2)}\n`;

        // Apply movement if input is detected
        if (Math.abs(stickX) > 0.1 || Math.abs(stickY) > 0.1) {
            // Get camera direction for movement relative to where user is looking
            const quaternion = new THREE.Quaternion();
            state.camera.getWorldQuaternion(quaternion);
            const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ');
            euler.x = 0; // Remove pitch (up/down)
            euler.z = 0; // Remove roll

            // Create movement vector and apply camera rotation
            const moveVector = new THREE.Vector3(stickX, 0, stickY);
            moveVector.applyEuler(euler).normalize();

            // Apply speed and move player
            const speed = PLAYER_SPEED * delta * 3.0; // Increased speed for better responsiveness
            player.position.add(moveVector.multiplyScalar(speed));
            
            debugInfo += `Moving: ${moveVector.x.toFixed(2)}, ${moveVector.z.toFixed(2)}\n`;
            debugInfo += `Position: ${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)}\n`;
            
            // Log movement to VR console when significant movement happens
            if (moveVector.length() > 0.5) {
                vrConsole.log(`Moving: ${moveVector.x.toFixed(1)}, ${moveVector.z.toFixed(1)}`);
            }
        }
        
        // Update the debug text
        updateMovementDebugText(debugInfo);
        
        // VR Collision detection with room size from constants
        const halfRoomSize = ROOM_SIZE / 2;
        const playerPadding = 0.5;
        player.position.x = THREE.MathUtils.clamp(player.position.x, -halfRoomSize + playerPadding, halfRoomSize - playerPadding);
        player.position.z = THREE.MathUtils.clamp(player.position.z, -halfRoomSize + playerPadding, halfRoomSize - playerPadding);
        player.position.y = 0; // Keep player on the ground
        
        // Add visual indicator at player's feet
        if (!player.children.length) {
          const indicator = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 })
          );
          indicator.position.y = -0.8; // Position at feet level
          player.add(indicator);
          
          // Add a direction indicator (arrow)
          const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
          const arrowLength = 0.4;
          const arrowHead = new THREE.Mesh(
            new THREE.ConeGeometry(0.08, 0.2, 8),
            arrowMaterial
          );
          arrowHead.position.set(0, -0.8, -arrowLength/2 - 0.1);
          arrowHead.rotation.x = Math.PI / 2;
          player.add(arrowHead);
          
          const arrowBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, arrowLength, 8),
            arrowMaterial
          );
          arrowBody.position.set(0, -0.8, -arrowLength/4);
          arrowBody.rotation.x = Math.PI / 2;
          player.add(arrowBody);
          
          vrConsole.log('Player position indicator created');
        }
      } else if (!controllersAvailable) {
        // FALLBACK CONTROLS: Use head movement as input when controllers aren't available
        let debugInfo = 'Using fallback head movement controls\n';
        
        // Get camera direction
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        cameraDirection.applyQuaternion(state.camera.quaternion);
        cameraDirection.y = 0; // Keep on horizontal plane
        cameraDirection.normalize();
        
        // Get head tilt/movement as input
        const headTilt = new THREE.Vector3();
        state.camera.getWorldDirection(headTilt);
        
        // Calculate movement based on head tilt and velocity
        let moveVector = new THREE.Vector3();
        
        // Method 1: Forward movement based on significant forward head tilt
        const forwardTiltThreshold = -0.3; // Looking down threshold
        if (headTilt.y < forwardTiltThreshold) {
          // Move forward when looking down
          const tiltStrength = Math.min(1.0, Math.abs(headTilt.y) * 2);
          moveVector.add(cameraDirection.clone().multiplyScalar(tiltStrength));
          debugInfo += `Forward tilt: ${headTilt.y.toFixed(2)}, strength: ${tiltStrength.toFixed(2)}\n`;
        }
        
        // Method 2: Use significant head movement velocity
        const velocityThreshold = 0.5;
        if (headVelocity.current.length() > velocityThreshold) {
          // Project head velocity onto horizontal plane
          const horizontalVelocity = new THREE.Vector3(
            headVelocity.current.x,
            0,
            headVelocity.current.z
          );
          
          // Only use forward/backward component
          const forwardComponent = horizontalVelocity.dot(cameraDirection);
          if (Math.abs(forwardComponent) > velocityThreshold) {
            const velocityStrength = Math.min(1.0, Math.abs(forwardComponent) * 0.5);
            moveVector.add(cameraDirection.clone().multiplyScalar(forwardComponent > 0 ? velocityStrength : -velocityStrength));
            debugInfo += `Head velocity: ${forwardComponent.toFixed(2)}, strength: ${velocityStrength.toFixed(2)}\n`;
          }
        }
        
        // Apply movement if any
        if (moveVector.length() > 0.1) {
          // Normalize and apply speed
          moveVector.normalize();
          const speed = PLAYER_SPEED * delta * 2.0;
          player.position.add(moveVector.multiplyScalar(speed));
          
          debugInfo += `Moving: ${moveVector.x.toFixed(2)}, ${moveVector.z.toFixed(2)}\n`;
          debugInfo += `Position: ${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)}\n`;
          
          // Log significant movement to VR console
          vrConsole.log(`Fallback movement: ${moveVector.x.toFixed(1)}, ${moveVector.z.toFixed(1)}`);
        } else {
          debugInfo += 'No movement detected\n';
        }
        
        // Update debug text
        updateMovementDebugText(debugInfo);
        
        // Apply room boundaries
        const halfRoomSize = ROOM_SIZE / 2;
        const playerPadding = 0.5;
        player.position.x = THREE.MathUtils.clamp(player.position.x, -halfRoomSize + playerPadding, halfRoomSize - playerPadding);
        player.position.z = THREE.MathUtils.clamp(player.position.z, -halfRoomSize + playerPadding, halfRoomSize - playerPadding);
        player.position.y = 0; // Keep player on the ground
      }
    } else {
        // Desktop Movement Logic
        velocity.current.x -= velocity.current.x * 10.0 * delta;
        velocity.current.z -= velocity.current.z * 10.0 * delta;

        desktopMoveDirection.z = Number(controls.forward) - Number(controls.backward);
        desktopMoveDirection.x = Number(controls.right) - Number(controls.left);
        desktopMoveDirection.normalize();

        if (controls.forward || controls.backward) {
        velocity.current.z -= desktopMoveDirection.z * PLAYER_SPEED * 10.0 * delta;
        }
        if (controls.left || controls.right) {
        velocity.current.x -= desktopMoveDirection.x * PLAYER_SPEED * 10.0 * delta;
        }
        
        if (controlsRef.current?.isLocked) {
            controlsRef.current.moveRight(-velocity.current.x * delta);
            controlsRef.current.moveForward(-velocity.current.z * delta);
            
            const halfRoomSize = ROOM_SIZE / 2;
            const playerPadding = 0.5; 
            camera.position.x = THREE.MathUtils.clamp(camera.position.x, -halfRoomSize + playerPadding, halfRoomSize - playerPadding);
            camera.position.z = THREE.MathUtils.clamp(camera.position.z, -halfRoomSize + playerPadding, halfRoomSize - playerPadding);
        }
        camera.position.y = PLAYER_HEIGHT;
    }
  });

  return isPresenting ? (
    // Visual indicator for VR player position
    <group>
      {/* This is just a placeholder - the actual indicator is added to the player in useFrame */}
    </group>
  ) : (
    <PointerLockControls ref={controlsRef} onLock={handleLock} onUnlock={handleUnlock} />
  );
};