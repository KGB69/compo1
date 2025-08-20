// @ts-nocheck
import React from 'react';
import WhiteRoom from './environments/WhiteRoom';
import * as THREE from 'three';



export const Scene: React.FC = () => {
  return (
    <>
      {/* Ambient lighting for overall scene illumination */}
      {/* @ts-ignore - React Three Fiber JSX elements */}
      <ambientLight intensity={0.3} />
      
      {/* White Room Environment */}
      <WhiteRoom />
    </>
  );
};