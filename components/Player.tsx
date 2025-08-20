
import React, { useEffect, useRef, useCallback } from 'react';
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
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const controls = usePlayerControls();
  const velocity = useRef(new THREE.Vector3());
  const desktopMoveDirection = new THREE.Vector3();

  const { player, controllers, isPresenting } = useXR();

  useEffect(() => {
    if (isPresenting) {
        if (isLocked) controlsRef.current?.unlock();
        return;
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
        
        if (leftController?.inputSource?.gamepad) {
            const axes = leftController.inputSource.gamepad.axes;
            
            // Quest controllers typically use axes[2] and axes[3] for the thumbstick
            // But some devices might use axes[0] and axes[1], so we check both
            let stickX = 0;
            let stickY = 0;
            
            // Check primary axes (0,1)
            if (Math.abs(axes[0]) > 0.1 || Math.abs(axes[1]) > 0.1) {
                stickX = axes[0];
                stickY = axes[1];
                console.log('Using primary axes for movement:', stickX, stickY);
            } 
            // Check secondary axes (2,3)
            else if (Math.abs(axes[2]) > 0.1 || Math.abs(axes[3]) > 0.1) {
                stickX = axes[2];
                stickY = axes[3];
                console.log('Using secondary axes for movement:', stickX, stickY);
            }

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
                const speed = PLAYER_SPEED * delta * 1.5; // Increased speed for better responsiveness
                player.position.add(moveVector.multiplyScalar(speed));
                
                console.log('VR movement applied:', moveVector);
            }
        }
        
        // VR Collision detection with larger room size (30m)
        const halfRoomSize = 30 / 2; // Using the updated room size from WhiteRoom.tsx
        const playerPadding = 0.5;
        player.position.x = THREE.MathUtils.clamp(player.position.x, -halfRoomSize + playerPadding, halfRoomSize - playerPadding);
        player.position.z = THREE.MathUtils.clamp(player.position.z, -halfRoomSize + playerPadding, halfRoomSize - playerPadding);
        player.position.y = 0; // Keep player on the ground
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

  return isPresenting ? null : <PointerLockControls ref={controlsRef} onLock={handleLock} onUnlock={handleUnlock} />;
};