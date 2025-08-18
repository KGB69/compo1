import { Canvas } from '@react-three/fiber';
import { XR } from '@react-three/xr';
import VRWorld from './VRWorld';

// VR Wrapper component optimized for Oculus Quest
interface VRWrapperProps {
  children: React.ReactNode;
}

export default function VRWrapper({ children }: VRWrapperProps) {
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
          {children}
          <VRWorld />
        </XR>
      </Canvas>
    </div>
  );
}
