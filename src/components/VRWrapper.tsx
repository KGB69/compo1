import { Canvas } from '@react-three/fiber';
import { XR, Controllers, Hands } from '@react-three/xr';
import VRWorld from './VRWorld';

// VR Wrapper component optimized for Oculus Quest
export default function VRWrapper() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas 
        shadows 
        camera={{ position: [0, 1.6, 5], fov: 75 }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
      >
        <XR>
          <Controllers />
          <Hands />
          <VRWorld />
        </XR>
      </Canvas>
    </div>
  );
}
