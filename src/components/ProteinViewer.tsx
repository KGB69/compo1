import React, { useEffect, useRef, useState } from 'react';

interface ProteinViewerProps {
  pdbId: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const ProteinViewer: React.FC<ProteinViewerProps> = ({ pdbId, onLoad, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    if (!pdbId || !containerRef.current) return;

    const loadProtein = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Clean up previous stage
        if (stageRef.current) {
          try {
            stageRef.current.dispose();
          } catch (e) {
            console.warn('NGL cleanup warning:', e);
          }
        }

        const container = containerRef.current;
        if (!container) return;

        // Clear container
        container.innerHTML = '';

        // Dynamically load NGL
        const NGL = await import('ngl');
        
        // Create NGL stage
        const stage = new NGL.Stage(container, {
          backgroundColor: 'black',
          quality: 'medium'
        });
        
        stageRef.current = stage;

        // Load protein structure
        const pdbUrl = `https://files.rcsb.org/download/${pdbId.toUpperCase()}.pdb`;
        
        try {
          // Load structure using NGL's built-in loader
          const component = await stage.loadFile(pdbUrl, {
            ext: 'pdb',
            defaultRepresentation: true
          });

          // Add cartoon representation
          component.addRepresentation('cartoon', {
            colorScheme: 'chainname',
            quality: 'medium'
          });

          // Auto-zoom to fit
          stage.autoView();

          onLoad?.();
        } catch (loadError) {
          console.warn('NGL direct loading failed, trying fallback:', loadError);
          
          // Fallback: fetch manually and load from string
          const response = await fetch(pdbUrl);
          if (!response.ok) throw new Error(`PDB file not found: ${response.status}`);
          
          const pdbData = await response.text();
          const blob = new Blob([pdbData], { type: 'text/plain' });
          const blobUrl = URL.createObjectURL(blob);
          
          const component = await stage.loadFile(blobUrl, {
            ext: 'pdb',
            defaultRepresentation: true
          });
          
          // Handle NGL component properly with type assertion
          if (component && typeof component === 'object' && 'addRepresentation' in component) {
            (component as any).addRepresentation('cartoon', {
              colorScheme: 'chainname',
              quality: 'medium'
            });
          }
          
          stage.autoView();
          
          // Clean up blob URL
          URL.revokeObjectURL(blobUrl);
        }

      } catch (err) {
        const error = err as Error;
        console.error('NGL viewer error:', error);
        setError(error.message);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay for DOM readiness
    const timeoutId = setTimeout(() => {
      loadProtein().catch(console.error);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (stageRef.current) {
        try {
          stageRef.current.dispose();
          stageRef.current = null;
        } catch (e) {
          console.warn('NGL disposal error:', e);
        }
      }
    };
  }, [pdbId, onLoad, onError]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      backgroundColor: '#000',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          fontSize: '16px',
          zIndex: 10,
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '15px',
          borderRadius: '8px'
        }}>
          Loading {pdbId} with NGL...
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ff4444',
          fontSize: '14px',
          textAlign: 'center',
          zIndex: 10,
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '8px',
          maxWidth: '90%'
        }}>
          <strong>Failed to load {pdbId}</strong><br/>
          {error}<br/>
          <small>Try a different PDB ID or check your connection</small>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px'
        }} 
      />
    </div>
  );
};

export default ProteinViewer;
