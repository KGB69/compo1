import React, { useState, useEffect, useRef } from 'react';
import './ImmersiveProteinViewer.css';

interface ImmersiveProteinViewerProps {
  pdbId: string;
  onProteinChange: (pdbId: string) => void;
}

interface ViewMode {
  name: string;
  type: string;
  description: string;
  params?: any;
}

const VIEW_MODES: ViewMode[] = [
  { name: 'Spacefill', type: 'spacefill', description: 'Atoms as spheres showing overall volume' },
  { name: 'Ball & Stick', type: 'ball+stick', description: 'Atoms as spheres with bond connections' },
  { name: 'Cartoon', type: 'cartoon', description: 'Simplified shapes for secondary structures' },
  { name: 'Ribbons', type: 'ribbon', description: 'Flat ribbons for secondary structures' },
  { name: 'Wireframe', type: 'line', description: 'Bonds shown as lines' },
  { name: 'Backbone', type: 'backbone', description: 'Alpha-carbon backbone only' },
  { name: 'Sticks', type: 'licorice', description: 'Thick lines for bonds' },
  { name: 'Rockets', type: 'rocket', description: 'Stylized arrows for secondary structures' },
  { name: 'Strands', type: 'strand', description: 'Outline of secondary structures' },
  { name: 'Trace', type: 'trace', description: 'Backbone trace without exact atom positions' },
  { name: 'Dots', type: 'point', description: 'Atoms as dots' },
  { name: 'Mesh', type: 'mesh', description: 'Mesh representation' },
  { name: 'Surface', type: 'surface', description: 'Molecular surface representation' }
];

const ImmersiveProteinViewer: React.FC<ImmersiveProteinViewerProps> = ({ 
  pdbId, 
  onProteinChange 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(VIEW_MODES[2]); // Default to Cartoon
  const [showViewModePanel, setShowViewModePanel] = useState(false);

  useEffect(() => {
    if (!pdbId || !containerRef.current) return;

    const loadProtein = async () => {
      try {
        // Clean up previous stage properly
        if (stageRef.current) {
          try {
            stageRef.current.dispose();
            stageRef.current = null;
          } catch (e) {
            console.warn('NGL cleanup warning:', e);
          }
        }

        const container = containerRef.current;
        if (!container) return;

        // Clear container completely and ensure fresh canvas
        container.innerHTML = '';
        
        // Force canvas cleanup to prevent WebGL context conflicts
        const existingCanvases = container.querySelectorAll('canvas');
        existingCanvases.forEach(canvas => {
          // Remove canvas from DOM to force context cleanup
          if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
          // Attempt to lose WebGL context
          const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
          if (gl) {
            try {
              const loseContext = gl.getExtension('WEBGL_lose_context');
              if (loseContext) {
                loseContext.loseContext();
              }
            } catch (e) {
              console.warn('WebGL context cleanup warning:', e);
            }
          }
        });

        // Add a small delay to prevent WebGL context issues
        await new Promise(resolve => setTimeout(resolve, 200));

        // Dynamically load NGL
        const NGL = await import('ngl');
        
        // Create NGL stage with optimized settings to prevent conflicts
        const stage = new NGL.Stage(container, {
          backgroundColor: 'black',
          quality: 'low', // Use low quality to reduce resource usage
          sampleLevel: 0,
          impostor: false
        });
        
        stageRef.current = stage;

        // Load protein structure with error handling
        const pdbUrl = `https://files.rcsb.org/download/${pdbId.toUpperCase()}.pdb`;
        
        try {
          const component = await stage.loadFile(pdbUrl, {
            ext: 'pdb',
            defaultRepresentation: false
          });

          if (component) {
            // Apply current view mode
            try {
              component.addRepresentation(currentViewMode.type, {
                colorScheme: 'chainname',
                quality: 'medium',
                ...currentViewMode.params
              });
            } catch (repError) {
              console.warn('Failed to add representation:', repError);
              // Fallback to cartoon if specific mode fails
              component.addRepresentation('cartoon', {
                colorScheme: 'chainname',
                quality: 'medium'
              });
            }

            // Auto-zoom to fit
            stage.autoView();
          }

        } catch (loadError) {
          console.error('NGL loading failed:', loadError);
          setError(`Failed to load ${pdbId}. Please try a different PDB ID.`);
        }

      } catch (err) {
        const error = err as Error;
        console.error('NGL viewer error:', error);
        setError(`Viewer error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadProtein();

    return () => {
      if (stageRef.current) {
        try {
          stageRef.current.dispose();
          stageRef.current = null;
        } catch (e) {
          console.warn('NGL disposal error:', e);
        }
      }
    };
  }, [pdbId, currentViewMode]);

  const handleSearch = () => {
    const id = searchInput.trim().toUpperCase();
    if (id && /^[1-9][A-Z0-9]{3}$/.test(id)) {
      onProteinChange(id);
      setSearchInput('');
      setIsSearchVisible(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsSearchVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setCurrentViewMode(mode);
    setShowViewModePanel(false);
  };

  const toggleViewModePanel = () => {
    setShowViewModePanel(!showViewModePanel);
  };

  const popularProteins = [
    { id: '1UBQ', name: 'Ubiquitin' },
    { id: '1A1U', name: 'Hemoglobin' },
    { id: '1L2Y', name: 'TRP Cage' },
    { id: '2LYZ', name: 'Lysozyme' },
    { id: '1CRN', name: 'Crambin' },
    { id: '1BNA', name: 'DNA' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Main NGL Canvas */}
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }} 
      />

      {/* Top Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        {/* Search Toggle */}
        {!isSearchVisible ? (
          <button
            onClick={() => setIsSearchVisible(true)}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '25px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
          >
            🔍 Search PDB
          </button>
        ) : (
          <div style={{
            display: 'flex',
            gap: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '15px',
            borderRadius: '25px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value.toUpperCase());
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter PDB ID"
              maxLength={4}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                padding: '8px 15px',
                outline: 'none',
                width: '120px',
                textAlign: 'center'
              }}
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#333' : '#00ff88',
                color: isLoading ? '#666' : 'black',
                border: 'none',
                borderRadius: '15px',
                padding: '8px 16px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isLoading ? 'Loading...' : 'Load'}
            </button>
          </div>
        )}

        {/* Current Protein Info */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '20px',
          padding: '10px 20px',
          fontSize: '14px',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer'
        }}
        onClick={toggleViewModePanel}
        title="Click to change view mode"
        >
          {currentViewMode.name}
        </div>

        {/* View Mode Toggle */}
        <button
          onClick={toggleViewModePanel}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '25px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
        >
          🎨 View Modes
        </button>
      </div>

      {/* Popular Proteins Quick Access */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1001
      }}>
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '10px',
          padding: '15px',
          backdropFilter: 'blur(10px)',
          maxWidth: '200px'
        }}>
          <h4 style={{ color: '#aaa', marginBottom: '10px', fontSize: '12px' }}>
            Quick Access
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {popularProteins.map(({ id, name }) => (
              <button
                key={id}
                onClick={() => onProteinChange(id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: pdbId === id ? '#00ff88' : '#0f0f1e',
                  color: pdbId === id ? 'black' : 'white',
                  border: `1px solid ${pdbId === id ? '#00ff88' : '#333'}`,
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{id}</div>
                <div style={{ fontSize: '10px', opacity: 0.7 }}>{name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Mode Panel */}
      {showViewModePanel && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '20px',
          zIndex: 1002,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '10px',
          padding: '15px',
          backdropFilter: 'blur(10px)',
          maxHeight: '400px',
          overflowY: 'auto',
          minWidth: '250px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>View Modes</h3>
            <button 
              onClick={() => setShowViewModePanel(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
                width: '30px',
                height: '30px'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.type}
                onClick={() => handleViewModeChange(mode)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: currentViewMode.type === mode.type ? '#00ff88' : '#0f0f1e',
                  color: currentViewMode.type === mode.type ? 'black' : 'white',
                  border: `1px solid ${currentViewMode.type === mode.type ? '#00ff88' : '#333'}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}
                title={mode.description}
              >
                <div style={{ fontWeight: 'bold' }}>{mode.name}</div>
                <div style={{ fontSize: '10px', opacity: 0.7 }}>{mode.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '18px',
          zIndex: 1002,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '20px',
          borderRadius: '10px'
        }}>
          Loading {pdbId}...
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ff4444',
          fontSize: '16px',
          zIndex: 1002,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <strong>Error loading {pdbId}</strong><br/>
          {error}<br/>
          <small>Try a different PDB ID</small>
        </div>
      )}
    </div>
  );
};

export default ImmersiveProteinViewer;
