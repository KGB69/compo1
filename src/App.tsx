import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import ImmersiveProteinViewer from './components/ImmersiveProteinViewer';
import VRWorld from './components/VRWorld';
import PCFallbackWorld from './components/PCFallbackWorld';
import './App.css';
import './App-wide-screen.css';

function App() {
  const [currentProtein, setCurrentProtein] = useState<string>('1A1U');
  const [mode, setMode] = useState<'viewer' | 'pc' | 'vr'>('viewer');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setInstallPrompt(null);
      });
    }
  };

  const handleProteinChange = (pdbId: string) => {
    setCurrentProtein(pdbId);
  };

  return (
    <div className="app">
      {installPrompt && (
        <button className="install-button" onClick={handleInstallClick}>
          Install ProteinVR
        </button>
      )}
      <div className="mode-selector">
        <button 
          className={mode === 'viewer' ? 'active' : ''}
          onClick={() => setMode('viewer')}
        >
          3D Viewer
        </button>
        <button 
          className={mode === 'pc' ? 'active' : ''}
          onClick={() => setMode('pc')}
        >
          PC World
        </button>
        <button 
          className={mode === 'vr' ? 'active' : ''}
          onClick={() => setMode('vr')}
        >
          VR World
        </button>
      </div>
      
      <div className="protein-selector">
        <input
          type="text"
          value={currentProtein}
          onChange={(e) => handleProteinChange(e.target.value)}
          placeholder="Enter PDB ID (e.g., 1A1U)"
        />
      </div>
      
      <div className="content">
        {mode === 'viewer' && (
          <ImmersiveProteinViewer 
            pdbId={currentProtein}
            onProteinChange={handleProteinChange}
          />
        )}
        {mode === 'pc' && <PCFallbackWorld />}
        {mode === 'vr' && (
          <div style={{ width: '100vw', height: '100vh' }}>
            <Canvas 
              shadows 
              camera={{ position: [0, 1.6, 3], fov: 75 }}
              style={{ width: '100%', height: '100%' }}
            >
              <VRWorld />
            </Canvas>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
