/// <reference types="@react-three/fiber" />

import React from 'react';
import { Grid } from '@react-three/drei/core';
import { ROOM_SIZE } from '../constants';

export const Ground: React.FC = () => {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      <Grid 
        position={[0, 0.01, 0]}
        args={[ROOM_SIZE, ROOM_SIZE]} 
        infiniteGrid={false}
        fadeDistance={12}
        sectionColor={"#c9c9c9"}
        cellColor={"#d9d9d9"}
      />
    </>
  );
};