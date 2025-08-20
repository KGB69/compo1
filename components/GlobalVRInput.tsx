

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR } from '@react-three/xr';

interface GlobalVRInputProps {
  onMenuToggle: () => void;
  onBack: () => void;
}

export const GlobalVRInput: React.FC<GlobalVRInputProps> = ({ onMenuToggle, onBack }) => {
  const { controllers, isPresenting } = useXR();
  const menuButtonPressed = useRef(false);
  const backButtonPressed = useRef(false);

  useFrame(() => {
    if (!isPresenting || controllers.length === 0) {
      return;
    }

    const leftController = controllers.find(c => c.handedness === 'left');
    const rightController = controllers.find(c => c.handedness === 'right');

    // Menu toggle: Left controller 'Y' button (index 3 on Oculus Touch)
    if (leftController?.inputSource?.gamepad) {
      const button = leftController.inputSource.gamepad.buttons[3];
      if (button?.pressed && !menuButtonPressed.current) {
        onMenuToggle();
      }
      menuButtonPressed.current = button?.pressed || false;
    }
    
    // Back action: Right controller 'B' button (index 5 on Oculus Touch)
    if (rightController?.inputSource?.gamepad) {
        const button = rightController.inputSource.gamepad.buttons[5]; 
        if (button?.pressed && !backButtonPressed.current) {
            onBack();
        }
        backButtonPressed.current = button?.pressed || false;
    }
  });

  return null;
};