

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import * as THREE from 'three';

interface GlobalVRInputProps {
  onMenuToggle: () => void;
  onBack: () => void;
  onMenuSelect?: () => void;
}

export const GlobalVRInput: React.FC<GlobalVRInputProps> = ({ onMenuToggle, onBack, onMenuSelect }) => {
  const { controllers, isPresenting, player } = useXR();
  const menuButtonPressed = useRef(false);
  const backButtonPressed = useRef(false);
  const selectButtonPressed = useRef(false);
  
  // Debug controller buttons
  useEffect(() => {
    if (isPresenting) {
      console.log('VR mode active - controller mappings loaded');
    }
  }, [isPresenting]);

  useFrame(() => {
    if (!isPresenting || controllers.length === 0) {
      return;
    }

    // @ts-ignore - XR controller handedness property
    const leftController = controllers.find(c => c.handedness === 'left');
    // @ts-ignore - XR controller handedness property
    const rightController = controllers.find(c => c.handedness === 'right');

    // Debug controller buttons when pressed
    if (leftController?.inputSource?.gamepad) {
      const buttons = leftController.inputSource.gamepad.buttons;
      for (let i = 0; i < buttons.length; i++) {
        if (buttons[i]?.pressed) {
          console.log(`Left controller button ${i} pressed`);
        }
      }
    }

    if (rightController?.inputSource?.gamepad) {
      const buttons = rightController.inputSource.gamepad.buttons;
      for (let i = 0; i < buttons.length; i++) {
        if (buttons[i]?.pressed) {
          console.log(`Right controller button ${i} pressed`);
        }
      }
    }

    // Menu toggle: Left controller 'Y' button (index 4 on Quest)
    if (leftController?.inputSource?.gamepad) {
      const button = leftController.inputSource.gamepad.buttons[4]; // Updated from 3 to 4 for Quest
      if (button?.pressed && !menuButtonPressed.current) {
        console.log('Menu button pressed');
        onMenuToggle();
      }
      menuButtonPressed.current = button?.pressed || false;
    }
    
    // Back action: Right controller 'B' button (index 1 on Quest)
    if (rightController?.inputSource?.gamepad) {
        const button = rightController.inputSource.gamepad.buttons[1]; // Updated from 5 to 1 for Quest
        if (button?.pressed && !backButtonPressed.current) {
            console.log('Back button pressed');
            onBack();
        }
        backButtonPressed.current = button?.pressed || false;
    }
    
    // Select action: Right controller trigger (index 0 on Quest)
    if (rightController?.inputSource?.gamepad && onMenuSelect) {
        const button = rightController.inputSource.gamepad.buttons[0];
        if (button?.pressed && !selectButtonPressed.current) {
            console.log('Select button pressed');
            onMenuSelect();
        }
        selectButtonPressed.current = button?.pressed || false;
    }
  });

  return null;
};