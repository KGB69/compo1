import React, { useState, useEffect } from 'react';
import ProteinViewer from './ProteinViewer';

interface FullScreenViewerProps {
  pdbId: string;
  onExit: () => void;
  onSearch: (pdbId: string) => void;
}

const FullScreenViewer: React.FC<FullScreenViewerProps> = ({ 
  pdbId, 
  onExit, 
  onSearch 
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    if (searchInput.trim()) {
      setIsLoading(true);
      onSearch(searchInput.trim().toUpperCase());
      setSearchInput('');
      setIsSearchVisible(false);
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Full screen toggle with F key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsSearchVisible(prev => !prev);
      }
      if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

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
      {/* Full screen protein viewer */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}>
        <ProteinViewer 
          pdbId={pdbId}
          onLoad={() => setIsLoading(false)}
          onError={(error) => console.error('Full screen error:', error)}
        />
      </div>

      {/* Exit button */}
      <button 
        onClick={onExit}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '20px',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          zIndex: 1001
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        ✕
      </button>

      {/* Search overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        transition: 'all 0.3s ease'
      }}>
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
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter PDB ID (e.g., 1UBQ)"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                padding: '8px 15px',
                outline: 'none',
                width: '200px'
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
                fontSize: '14px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {isLoading ? '...' : 'Go'}
            </button>
            <button
              onClick={() => setIsSearchVisible(false)}
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0 8px'
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Instructions overlay */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: 'white',
        fontSize: '14px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '10px 15px',
        borderRadius: '8px',
        backdropFilter: 'blur(5px)',
        zIndex: 1001
      }}>
        <div>Press <strong>F</strong> to toggle search | <strong>ESC</strong> to exit</div>
      </div>

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
          Loading {searchInput}...
        </div>
      )}
    </div>
  );
};

export default FullScreenViewer;
