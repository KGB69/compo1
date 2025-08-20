/// <reference types="@react-three/fiber" />

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PageContent } from '../types';

import { PlaceholderPage } from './pages/PlaceholderPage';
import { HostJoinPage } from './pages/HostJoinPage';
import { AddEntityPage } from './pages/AddEntityPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';

interface ImmersivePageProps {
  content: PageContent;
  onClose: () => void;
  pageDistance: number;
  setPageDistance: (distance: number) => void;
  pageYOffset: number;
  setPageYOffset: (offset: number) => void;
}

const PAGE_HEIGHT = 4.8;
const PAGE_WIDTH = 6;

export const ImmersivePage: React.FC<ImmersivePageProps> = ({ content, onClose, pageDistance, setPageDistance, pageYOffset, setPageYOffset }) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      const distance = pageDistance;
      const targetPosition = camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(distance));
      
      const pageHalfHeight = PAGE_HEIGHT / 2;
      const baseTargetY = Math.max(targetPosition.y, pageHalfHeight + 0.2);
      targetPosition.y = baseTargetY + pageYOffset;

      groupRef.current.position.lerp(targetPosition, 0.1);
      groupRef.current.quaternion.slerp(camera.quaternion, 0.1);
    }
  });

  let pageComponent: React.ReactNode;

  switch (content.id) {
    case 'visualise':
      pageComponent = <AddEntityPage onClose={onClose} />;
      break;
    case 'host-join':
      pageComponent = <HostJoinPage onClose={onClose} />;
      break;
    case 'assessments':
      pageComponent = (
        <PlaceholderPage
          title="Assessments"
          message="Quizzes And Extra Related Content"
          onClose={onClose}
        />
      );
      break;
    case 'settings':
      pageComponent = (
        <SettingsPage
          onClose={onClose}
          distance={pageDistance}
          setDistance={setPageDistance}
          yOffset={pageYOffset}
          setYOffset={setPageYOffset}
        />
      );
      break;
    case 'help':
      pageComponent = <HelpPage onClose={onClose} />;
      break;
    default:
      pageComponent = (
        <div className="text-white">
          <h1 className="text-2xl">Unknown Page</h1>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-sky-500 rounded">Close</button>
        </div>
      );
  }

  return (
    <group ref={groupRef}>
      <mesh>
        <planeGeometry args={[PAGE_WIDTH, PAGE_HEIGHT]} />
        <meshStandardMaterial color="#111827" side={THREE.DoubleSide} transparent opacity={0} />
      </mesh>
      <Html
        transform
        occlude
        position={[0, 0, 0.01]}
        scale={0.1}
        className="bg-transparent text-white antialiased"
        style={{ width: `${PAGE_WIDTH * 10}rem`, height: `${PAGE_HEIGHT*10}rem` }}
      >
        <div className="w-full h-full select-none">
          {pageComponent}
        </div>
      </Html>
    </group>
  );
};