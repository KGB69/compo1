import React, { useState } from 'react';

interface EnhancedProteinSearchProps {
  onProteinSelect: (pdbId: string) => void;
  currentProtein?: string;
}

const EnhancedProteinSearch: React.FC<EnhancedProteinSearchProps> = ({ 
  onProteinSelect, 
  currentProtein 
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (pdbId?: string) => {
    const id = pdbId || searchValue.trim().toUpperCase();
    
    if (!id) {
      setError('Please enter a PDB ID');
      return;
    }

    if (!/^[1-9][A-Z0-9]{3}$/.test(id)) {
      setError('Invalid PDB ID format. Use 4 characters like 1UBQ');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate PDB ID by checking if file exists
      const response = await fetch(`https://files.rcsb.org/download/${id}.pdb`, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        onProteinSelect(id);
        setSearchValue('');
        setError(null);
      } else {
        setError(`PDB ID ${id} not found. Please check the ID and try again.`);
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
      backgroundColor: '#1a1a2e',
      padding: '20px',
      borderRadius: '10px',
      border: '1px solid #333',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#00ff88', marginBottom: '15px', fontSize: '1.2rem' }}>
        Search Protein Structure
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter PDB ID (e.g., 1UBQ)"
            maxLength={4}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#0f0f1e',
              border: `1px solid ${error ? '#ff4444' : '#333'}`,
              borderRadius: '6px',
              color: 'white',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            style={{
              padding: '12px 20px',
              backgroundColor: isLoading ? '#333' : '#00ff88',
              color: isLoading ? '#666' : 'black',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '80px'
            }}
          >
            {isLoading ? '...' : 'Search'}
          </button>
        </div>
        
        {error && (
          <div style={{
            color: '#ff4444',
            fontSize: '14px',
            marginTop: '5px',
            padding: '8px',
            backgroundColor: 'rgba(255, 68, 68, 0.1)',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
      </div>

      <div>
        <h4 style={{ color: '#aaa', marginBottom: '10px', fontSize: '0.9rem' }}>
          Popular Proteins
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
          gap: '8px' 
        }}>
          {popularProteins.map(({ id, name }) => (
            <button
              key={id}
              onClick={() => handleSearch(id)}
              style={{
                padding: '8px',
                backgroundColor: currentProtein === id ? '#00ff88' : '#0f0f1e',
                color: currentProtein === id ? 'black' : 'white',
                border: `1px solid ${currentProtein === id ? '#00ff88' : '#333'}`,
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{id}</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>{name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedProteinSearch;
