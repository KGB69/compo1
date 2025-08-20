
import React, { useState } from 'react';
import { PageContainer } from './PageContainer';
import { UIButton } from './ui/UIButton';
import { UIInput } from './ui/UIInput';
import { Search } from '../icons';
import { MolstarViewerComponent } from './MolstarViewerComponent';
import { VRProteinViewer } from '../VRProteinViewer';
import { SceneLighting } from '../SceneLighting';
import { Canvas } from '@react-three/fiber';
import { VRButton, XR } from '@react-three/xr';

interface PDBEntry {
    identifier: string;
    title: string;
    organism?: string;
}

export const AddEntityPage: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PDBEntry[]>([]);
    const [selectedProtein, setSelectedProtein] = useState<{ name: string; url: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [directPdbId, setDirectPdbId] = useState('');

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        setError(null);
        setSearchResults([]);

        try {
            // Using RCSB PDB API with POST method which is more reliable
            const response = await fetch('https://search.rcsb.org/rcsbsearch/v2/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: {
                        type: "terminal",
                        service: "text",
                        parameters: {
                            value: searchQuery
                        }
                    },
                    return_type: "entry"
                })
            });


            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            console.log('PDB search results:', data);
            
            // RCSB search API returns results in a different format
            if (!data.result_set || data.result_set.length === 0) {
                setError('No results found for your query.');
                setIsLoading(false);
                return;
            }

            // Format results for the RCSB API format
            const formattedResults: PDBEntry[] = await Promise.all(
                data.result_set.slice(0, 10).map(async (item: any) => {
                    // Extract PDB ID from the identifier field
                    const pdbId = item.identifier;
                    if (!pdbId) {
                        console.error('Could not extract PDB ID from result item:', item);
                        return null;
                    }
                    
                    // Get additional details for each entry
                    try {
                        const detailsResponse = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`);
                        if (!detailsResponse.ok) {
                            throw new Error(`Failed to get details for ${pdbId}: ${detailsResponse.status}`);
                        }
                        const details = await detailsResponse.json();
                        return {
                            identifier: pdbId,
                            title: details.struct?.title || `PDB ID: ${pdbId}`,
                            organism: details.entity?.length > 0 ? details.entity[0].src?.length > 0 ? 
                                details.entity[0].src[0].organism_scientific : undefined : undefined
                        };
                    } catch (e) {
                        console.warn(`Failed to get details for ${pdbId}:`, e);
                        return {
                            identifier: pdbId,
                            title: `PDB ID: ${pdbId}`
                        };
                    }
                }).filter(Boolean)
            );

            setSearchResults(formattedResults);
        } catch (err) {
            console.error("PDB search failed:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadProtein = (entry: PDBEntry) => {
        // Use NGL's built-in rcsb:// protocol to avoid CORS issues
        const pdbId = entry.identifier.trim().toUpperCase();
        const pdbUrl = `rcsb://${pdbId}`;
        console.log('Loading PDB with protocol:', pdbUrl);
        setSelectedProtein({ name: entry.title, url: pdbUrl });
    };
    
    const handleLoadDirectPdb = async () => {
        if (!directPdbId.trim()) return;
        
        setIsLoading(true);
        setError(null);
        
        const pdbId = directPdbId.trim().toUpperCase();
        
        try {
            // First verify the PDB ID exists
            const checkResponse = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`);
            
            if (!checkResponse.ok) {
                if (checkResponse.status === 404) {
                    setError(`PDB ID ${pdbId} not found. Please check the ID and try again.`);
                } else {
                    setError(`Error checking PDB ID: ${checkResponse.status}`);
                }
                setIsLoading(false);
                return;
            }
            
            // PDB ID exists, use NGL's built-in protocol
            const pdbUrl = `rcsb://${pdbId}`;
            console.log('Loading direct PDB with protocol:', pdbUrl);
            setSelectedProtein({ name: `PDB ID: ${pdbId}`, url: pdbUrl });
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading PDB ID:', error);
            setError(`Failed to load PDB ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsLoading(false);
        }
    };

    const handleBackToSearch = () => {
        setSelectedProtein(null);
        setSearchResults([]);
        setSearchQuery('');
        setError(null);
    };

    const [viewMode, setViewMode] = useState<'2d' | 'vr'>('2d');
    
    if (selectedProtein) {
        return (
            <PageContainer title={selectedProtein.name} breadcrumbs={['Home', 'Visualise', 'Viewer']} onClose={onClose}>
                <div className="w-full h-full flex flex-col items-center p-0 space-y-4">
                    <div className="absolute top-4 left-4 z-10 flex space-x-2">
                        <UIButton onClick={handleBackToSearch} variant="secondary" className="!text-sm !px-3 !py-1">
                            New Search
                        </UIButton>
                        <UIButton 
                            onClick={() => setViewMode(viewMode === '2d' ? 'vr' : '2d')} 
                            variant={viewMode === 'vr' ? 'primary' : 'secondary'}
                            className="!text-sm !px-3 !py-1"
                        >
                            {viewMode === '2d' ? 'VR Mode' : '2D Mode'}
                        </UIButton>
                    </div>
                    
                    {viewMode === '2d' ? (
                        <MolstarViewerComponent cifUrl={selectedProtein.url} />
                    ) : (
                        <div className="w-full h-full">
                            <VRButton className="absolute top-4 right-4 z-10" />
                            <div className="absolute top-4 left-4 z-10 flex gap-2">
                                <button 
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    onClick={() => {
                                        // Toggle VR controls
                                        const vrControls = document.getElementById('vr-controls');
                                        if (vrControls) {
                                            vrControls.style.display = 
                                                vrControls.style.display === 'none' ? 'block' : 'none';
                                        }
                                    }}
                                >
                                    Controls
                                </button>
                            </div>
                            <div 
                                id="vr-controls" 
                                className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-70 p-4 rounded text-white"
                                style={{ display: 'block' }}
                            >
                                <h3 className="font-bold mb-2">VR Controls</h3>
                                <ul className="list-disc pl-5">
                                    <li>Auto-rotation is enabled by default</li>
                                    <li>Use the slider to adjust rotation speed</li>
                                    <li>Click the protein to toggle rotation on/off</li>
                                    <li>Use the Reset button to return to initial position</li>
                                    <li>Click the ? button to show/hide controls</li>
                                    <li className="mt-2 font-bold">VR Controller Actions:</li>
                                    <li>Right controller trigger: Toggle auto-rotation</li>
                                    <li>Left controller trigger + move: Adjust rotation speed</li>
                                </ul>
                            </div>
                            <Canvas className="w-full h-full">
                                <XR>
                                    {/* Use scene lighting with proper TypeScript support */}
                                    <SceneLighting />
                                    <VRProteinViewer 
                                        cifUrl={selectedProtein.url} 
                                        position={[0, 1.5, -2]} 
                                        scale={0.5} 
                                        interactive={true}
                                    />
                                </XR>
                            </Canvas>
                        </div>
                    )}
                </div>
            </PageContainer>
        );
    }
    
    return (
        <PageContainer title="Add Entity" breadcrumbs={['Home', 'Visualise']} onClose={onClose}>
             <div className="w-full max-w-3xl flex flex-col items-center p-4 space-y-4">
                <h3 className="text-xl text-sky-200">Search Protein Data Bank</h3>
                
                <div className="relative w-full max-w-md flex space-x-2">
                    <UIInput
                        placeholder="Search by protein name (e.g., hemoglobin)..."
                        className="flex-grow"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <UIButton onClick={handleSearch} disabled={isLoading}>
                        {isLoading ? '...' : <Search className="w-5 h-5"/>}
                    </UIButton>
                </div>
                
                <div className="w-full h-64 mt-2 bg-slate-900/50 rounded-lg flex flex-col p-2 overflow-y-auto">
                    {isLoading && <p className="text-slate-400 m-auto">Searching...</p>}
                    {error && <p className="text-red-400 m-auto">{error}</p>}
                    {!isLoading && !error && searchResults.length > 0 && (
                        <ul className="space-y-2">
                            {searchResults.map((entry) => (
                                <li key={entry.identifier} className="flex justify-between items-center p-2 rounded-md bg-slate-800 hover:bg-sky-900/50 transition-colors">
                                    <div className="flex-grow mr-4 overflow-hidden">
                                        <p className="font-semibold text-white truncate" title={entry.title}>{entry.title}</p>
                                        {entry.organism && (
                                            <p className="text-sm text-slate-400 truncate">{entry.organism} ({entry.identifier})</p>
                                        )}
                                        {!entry.organism && (
                                            <p className="text-sm text-slate-400 truncate">PDB ID: {entry.identifier}</p>
                                        )}
                                    </div>
                                    <UIButton onClick={() => handleLoadProtein(entry)} size="sm">
                                        Load
                                    </UIButton>
                                </li>
                            ))}
                        </ul>
                    )}
                    {!isLoading && !error && searchResults.length === 0 && (
                         <p className="text-slate-500 m-auto">Search results will appear here.</p>
                    )}
                </div>

                <div className="flex items-center space-x-2 w-full max-w-md pt-2">
                    <hr className="w-full border-slate-600" />
                    <span className="text-slate-400">OR</span>
                    <hr className="w-full border-slate-600" />
                </div>
                
                <div className="flex items-center space-x-4">
                    <UIInput 
                        placeholder="Enter PDB ID (e.g., 1AKE)" 
                        value={directPdbId}
                        onChange={(e) => setDirectPdbId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadDirectPdb()}
                    />
                    <UIButton onClick={handleLoadDirectPdb}>Load</UIButton>
                </div>
             </div>
        </PageContainer>
    );
};
