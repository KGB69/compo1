import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Plane } from '@react-three/drei';
import * as THREE from 'three';
import ProteinInWorld from './ProteinInWorld';

// PC Player with WASD movement and mouse look
function PCPlayer() {
  const { camera, gl } = useThree();
  const moveSpeed = 0.1;
  const lookSpeed = 0.002;
  
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false
  });
  
  const mouse = useRef({ x: 0, y: 0 });
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  
  const WORLD_SIZE = 20;
  const BOUNDARY_MARGIN = 0.5;

  useEffect(() => {
    // Mouse controls
    const handleMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === gl.domElement) {
        mouse.current.x -= event.movementX * lookSpeed; // Inverted X for natural left/right
        mouse.current.y -= event.movementY * lookSpeed; // Inverted Y for natural up/down
        mouse.current.y = Math.max(-Math.PI/2, Math.min(Math.PI/2, mouse.current.y));
      }
    };

    // Keyboard controls
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
      }
    };

    // Pointer lock for mouse look
    const handleClick = () => {
      gl.domElement.requestPointerLock();
    };

    gl.domElement.addEventListener('click', handleClick);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      gl.domElement.removeEventListener('click', handleClick);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [gl]);

  useFrame(() => {
    // Update camera rotation
    euler.current.set(mouse.current.y, mouse.current.x, 0);
    camera.quaternion.setFromEuler(euler.current);

    // Calculate movement direction
    const direction = new THREE.Vector3();
    const speed = keys.current.shift ? moveSpeed * 2 : moveSpeed;

    if (keys.current.w) direction.z -= 1;
    if (keys.current.s) direction.z += 1;
    if (keys.current.a) direction.x -= 1;
    if (keys.current.d) direction.x += 1;

    direction.normalize();
    direction.applyQuaternion(camera.quaternion);
    direction.y = 0; // Keep movement horizontal

    // Apply movement
    camera.position.add(direction.multiplyScalar(speed));

    // Boundary collision detection
    camera.position.x = Math.max(-WORLD_SIZE/2 + BOUNDARY_MARGIN, 
                          Math.min(WORLD_SIZE/2 - BOUNDARY_MARGIN, camera.position.x));
    camera.position.z = Math.max(-WORLD_SIZE/2 + BOUNDARY_MARGIN, 
                          Math.min(WORLD_SIZE/2 - BOUNDARY_MARGIN, camera.position.z));
    
    // Keep camera at eye level
    camera.position.y = 1.6;
  });

  return null;
}

// Walkable floor (same as VR version)
function WalkableFloor() {
  const floorSize = 20;
  
  return (
    <group>
      {/* Main floor */}
      <Plane
        args={[floorSize, floorSize]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial 
          color="#f0f0f0" 
          roughness={0.8}
          metalness={0.1}
        />
      </Plane>
      
      {/* Grid lines */}
      {Array.from({ length: floorSize + 1 }, (_, i) => (
        <group key={`grid-${i}`}>
          <Box
            args={[floorSize, 0.02, 0.02]}
            position={[0, 0.01, -floorSize/2 + i]}
          >
            <meshBasicMaterial color="#cccccc" />
          </Box>
          <Box
            args={[0.02, 0.02, floorSize]}
            position={[-floorSize/2 + i, 0.01, 0]}
          >
            <meshBasicMaterial color="#cccccc" />
          </Box>
        </group>
      ))}
      
      {/* Boundary markers */}
      <Box args={[floorSize, 0.1, 0.1]} position={[0, 0.05, floorSize/2]}>
        <meshBasicMaterial color="#ff4444" transparent opacity={0.5} />
      </Box>
      <Box args={[floorSize, 0.1, 0.1]} position={[0, 0.05, -floorSize/2]}>
        <meshBasicMaterial color="#ff4444" transparent opacity={0.5} />
      </Box>
      <Box args={[0.1, 0.1, floorSize]} position={[floorSize/2, 0.05, 0]}>
        <meshBasicMaterial color="#ff4444" transparent opacity={0.5} />
      </Box>
      <Box args={[0.1, 0.1, floorSize]} position={[-floorSize/2, 0.05, 0]}>
        <meshBasicMaterial color="#ff4444" transparent opacity={0.5} />
      </Box>
    </group>
  );
}

// White fog effect
function WorldFog() {
  return (
    <fog attach="fog" args={['#ffffff', 5, 15]} />
  );
}

// Lighting setup for PC
function PCLighting() {
  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight
        position={[-10, 5, -5]}
        intensity={0.3}
      />
    </group>
  );
}

// Skybox
function Skybox() {
  return (
    <mesh>
      <sphereGeometry args={[50, 32, 32]} />
      <meshBasicMaterial
        color="#e6f3ff"
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// PC Controls UI with size and mode controls
function PCControlsUI({ 
  scale, 
  onScaleChange, 
  viewMode, 
  onViewModeChange, 
  height, 
  onHeightChange 
}: {
  scale: number;
  onScaleChange: (newScale: number) => void;
  viewMode: 'ball-and-stick' | 'ribbon' | 'cartoon' | 'surface';
  onViewModeChange: (newMode: 'ball-and-stick' | 'ribbon' | 'cartoon' | 'surface') => void;
  height: number;
  onHeightChange: (newHeight: number) => void;
}) {
  const scaleOptions = [
    { value: 0.05, label: 'Tiny' },
    { value: 0.1, label: 'Small' },
    { value: 0.2, label: 'Medium' },
    { value: 0.4, label: 'Large' },
    { value: 0.8, label: 'Huge' }
  ];

  const heightOptions = [
    { value: 1, label: 'Low' },
    { value: 1.5, label: 'Medium' },
    { value: 2, label: 'High' },
    { value: 2.5, label: 'Very High' },
    { value: 3, label: 'Extremely High' }
  ];

  const viewModes = [
    { value: 'ball-and-stick', label: 'Ball & Stick' },
    { value: 'ribbon', label: 'Ribbon' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'surface', label: 'Surface' }
  ];

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      color: 'white',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: '15px',
      borderRadius: '10px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>🖥️ PC Mode Controls</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Size:</label>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {scaleOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onScaleChange(opt.value)}
              style={{
                padding: '5px 10px',
                backgroundColor: scale === opt.value ? '#4CAF50' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Height:</label>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {heightOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onHeightChange(opt.value)}
              style={{
                padding: '5px 10px',
                backgroundColor: height === opt.value ? '#2196F3' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Visualization Mode:</label>
        <select 
          value={viewMode} 
          onChange={(e) => onViewModeChange(e.target.value as 'ball-and-stick' | 'ribbon' | 'cartoon' | 'surface')}
          style={{
            width: '100%',
            padding: '5px',
            backgroundColor: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '3px',
            fontSize: '12px'
          }}
        >
          {viewModes.map(mode => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Main PC Fallback World component
interface PCFallbackWorldProps {
  pdbId?: string;
}

export default function PCFallbackWorld({ pdbId = '1A1U' }: PCFallbackWorldProps) {
  const [proteinHeight, setProteinHeight] = useState(1.5);
  const [proteinScale, setProteinScale] = useState(1);
  const [viewMode, setViewMode] = useState<'ball-and-stick' | 'ribbon' | 'cartoon' | 'surface'>('cartoon');

  const handleHeightChange = (newHeight: number) => {
    setProteinHeight(newHeight);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.6, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      >
        <WorldFog />
        <PCLighting />
        <Skybox />
        <WalkableFloor />
        <PCPlayer />
        <ProteinInWorld pdbId={pdbId} scale={proteinScale} viewMode={viewMode} heightOffset={proteinHeight} />
      </Canvas>
      
      <PCControlsUI 
        scale={proteinScale} 
        onScaleChange={setProteinScale} 
        viewMode={viewMode} 
        onViewModeChange={setViewMode} 
        height={proteinHeight} 
        onHeightChange={handleHeightChange} 
      />
      
      {/* Exit button */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={() => window.location.reload()} // Simple way to exit
          style={{
            backgroundColor: 'rgba(255, 69, 0, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
        >
          🚪 Exit PC Mode
        </button>
      </div>
    </div>
  );
}
