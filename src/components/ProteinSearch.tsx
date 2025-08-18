import React, { useState } from 'react';
import type { ProteinSearchResult } from '../services/proteinService';
import { proteinService } from '../services/proteinService';

interface ProteinSearchProps {
  onProteinSelect: (pdbId: string) => void;
}

const ProteinSearch: React.FC<ProteinSearchProps> = ({ onProteinSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ProteinSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProtein, setSelectedProtein] = useState<string | null>(null);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await proteinService.searchProteins(term);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProteinSelect = (pdbId: string) => {
    setSelectedProtein(pdbId);
    onProteinSelect(pdbId);
  };

  const handleQuickLoad = (pdbId: string) => {
    setSearchTerm(pdbId);
    handleProteinSelect(pdbId);
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h3 style={{ 
        color: '#fff', 
        marginBottom: '15px',
        fontSize: '18px'
      }}>
        Protein Search
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search proteins (e.g., insulin, hemoglobin, 1A1U)"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #333',
            backgroundColor: '#0f0f23',
            color: '#fff',
            outline: 'none'
          }}
        />
        
        {isSearching && (
          <div style={{
            color: '#aaa',
            marginTop: '5px',
            fontSize: '14px'
          }}>
            Searching...
          </div>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ 
          color: '#aaa', 
          marginBottom: '8px',
          fontSize: '14px'
        }}>
          Quick Load:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['1A1U', '2LYZ', '1UBQ', '4HHB', '1BNA'].map(id => (
            <button
              key={id}
              onClick={() => handleQuickLoad(id)}
              style={{
                padding: '6px 12px',
                backgroundColor: selectedProtein === id ? '#00ff88' : '#333',
                color: selectedProtein === id ? '#000' : '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div>
          <h4 style={{ 
            color: '#fff', 
            marginBottom: '10px',
            fontSize: '16px'
          }}>
            Search Results ({results.length})
          </h4>
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #333',
            borderRadius: '4px'
          }}>
            {results.map((result) => (
              <div
                key={result.id}
                onClick={() => handleProteinSelect(result.id)}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #333',
                  cursor: 'pointer',
                  backgroundColor: selectedProtein === result.id ? '#003366' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedProtein !== result.id) {
                    e.currentTarget.style.backgroundColor = '#222';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProtein !== result.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#fff',
                  marginBottom: '4px'
                }}>
                  {result.id} - {result.title}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#aaa' 
                }}>
                  {result.organism} • {result.method} • {result.resolution}Å
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProteinSearch;
