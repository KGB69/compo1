import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, Controllers, Hands } from '@react-three/xr';
import ImmersiveProteinViewer from './components/ImmersiveProteinViewer';
import VRWorld from './components/VRWorld';
import PCFallbackWorld from './components/PCFallbackWorld';
import './App.css';
import './App-wide-screen.css';

function App() {
  const [currentProtein, setCurrentProtein] = useState<string>('1A1U');
  const [mode, setMode] = useState<'viewer' | 'pc' | 'vr'>('viewer');

  const handleProteinChange = (pdbId: string) => {
    setCurrentProtein(pdbId);
  };

  const renderMode = () => {
    switch (mode) {
      case 'pc':
        return <PCFallbackWorld />;
      case 'vr':
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
      default:
        return (
          <ImmersiveProteinViewer 
            pdbId={currentProtein}
            onProteinChange={handleProteinChange}
          />
        );
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {renderMode()}
      
      {/* Mode Toggle Buttons */}
      {mode === 'viewer' && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1002,
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => setMode('pc')}
            style={{
              backgroundColor: 'rgba(0, 123, 255, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            title="Test PC 3D World"
          >
            🖥️ PC World
          </button>
          <button
            onClick={() => setMode('vr')}
            style={{
              backgroundColor: 'rgba(138, 43, 226, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            title="Enter Virtual Reality Mode"
          >
            🥽 VR World
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
