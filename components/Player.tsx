
// @ts-nocheck - Disable TypeScript checking for React Three Fiber JSX elements
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei/core';
import * as THREE from 'three';
import { usePlayerControls } from '../hooks/useKeyboardControls';
import { PLAYER_SPEED, PLAYER_HEIGHT, ROOM_SIZE } from '../constants';
import { GameState } from '../types';
import { useXR } from '@react-three/xr';

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

  useFrame((state, delta) => {
    const canMove = gameState === GameState.EXPLORING || gameState === GameState.MENU;

    if (!canMove) {
      velocity.current.set(0, 0, 0);
      return;
    }
    
    if (isPresenting && player && controllers.length > 0) {
        // VR Movement Logic with enhanced debugging and controls
        // @ts-ignore - XR controller handedness property
        const leftController = controllers.find(c => c.handedness === 'left');
        // @ts-ignore - XR controller handedness property
        const rightController = controllers.find(c => c.handedness === 'right');
        
        let debugInfo = '';
        
        // Show controller connection status
        debugInfo += `Left: ${leftController ? 'Connected' : 'Not connected'}\n`;
        debugInfo += `Right: ${rightController ? 'Connected' : 'Not connected'}\n`;
        
        if (leftController?.inputSource?.gamepad) {
            const axes = leftController.inputSource.gamepad.axes;
            debugInfo += `Axes: [${axes.map(a => a?.toFixed(2) || 'N/A').join(', ')}]\n`;
            
            // Try all possible axis combinations for movement
            let stickX = 0;
            let stickY = 0;
            let axisUsed = 'none';
            
            // Check all possible axis combinations
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
            
            debugInfo += `Using axes: ${axisUsed}\n`;
            debugInfo += `Movement: X:${stickX.toFixed(2)}, Y:${stickY.toFixed(2)}\n`;

            // Apply movement if stick is being used
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
                const speed = PLAYER_SPEED * delta * 2.0; // Increased speed for better responsiveness
                player.position.add(moveVector.multiplyScalar(speed));
                
                debugInfo += `Moving: ${moveVector.x.toFixed(2)}, ${moveVector.z.toFixed(2)}\n`;
                debugInfo += `Position: ${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)}\n`;
            }
            
            // Update the debug text
            updateMovementDebugText(debugInfo);
        }
        
        // VR Collision detection with room size from constants
        const halfRoomSize = ROOM_SIZE / 2;
        const playerPadding = 0.5;
        player.position.x = THREE.MathUtils.clamp(player.position.x, -halfRoomSize + playerPadding, halfRoomSize - playerPadding);
        player.position.z = THREE.MathUtils.clamp(player.position.z, -halfRoomSize + playerPadding, halfRoomSize - playerPadding);
        player.position.y = 0; // Keep player on the ground
        
        // Add visual indicator at player's feet
        if (!player.children.length) {
          const indicator = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 })
          );
          indicator.position.y = -0.8; // Position at feet level
          player.add(indicator);
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