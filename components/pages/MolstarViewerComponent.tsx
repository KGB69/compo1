
import React, { useEffect, useRef, useState } from 'react';
import * as NGL from 'ngl';
import * as THREE from 'three';

// Define NGL component type to fix TypeScript errors
type NGLComponent = any;

// Extract PDB ID from URL
function extractPdbId(url: string): string | null {
    // Check if it's already using a protocol format
    if (url.startsWith('rcsb://') || url.startsWith('pdb://')) {
        return url.split('//')[1].toUpperCase();
    }
    
    // Try to extract PDB ID from URL
    const match = url.match(/\/(\w{4})\.(pdb|cif)$/i);
    if (match) {
        return match[1].toUpperCase();
    }
    return null;
}

interface MolstarViewerComponentProps {
    cifUrl: string;
}

export const MolstarViewerComponent: React.FC<MolstarViewerComponentProps> = ({ cifUrl }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [vrMode, setVrMode] = useState(false);

    // Check if we're in VR mode
    useEffect(() => {
        // Try to detect if we're in VR mode based on URL params or other indicators
        const isInVR = window.location.search.includes('vr=true') || 
                       document.querySelector('canvas[data-engine="three.js"]') !== null;
        setVrMode(isInVR);
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        setLoading(true);
        setError(null);

        // Create NGL Stage object with transparent background for VR integration
        const stage = new NGL.Stage(containerRef.current, { 
            backgroundColor: vrMode ? 'transparent' : 'white',
            quality: 'high',
            impostor: true // Use impostors for better performance in VR
        });
        stageRef.current = stage;

        // Handle window resizing
        const handleResize = () => {
            stage.handleResize();
        };
        window.addEventListener('resize', handleResize);

        // Load structure
        if (cifUrl) {
            console.log('Loading structure from URL:', cifUrl);
            
            // Extract PDB ID if possible
            const pdbId = extractPdbId(cifUrl);
            
            // Try to load using different approaches
            (async () => {
                try {
                    let component: NGLComponent;
                    
                    // First approach: Try using NGL's built-in loading with rcsb:// protocol
                    if (pdbId) {
                        try {
                            console.log(`Loading PDB ID ${pdbId} using rcsb:// protocol`);
                            component = await stage.loadFile(`rcsb://${pdbId}`, { defaultRepresentation: false });
                            
                            // Add representations optimized for VR
                            component.addRepresentation('cartoon', { 
                                colorScheme: 'chainname',
                                quality: vrMode ? 'high' : 'medium',
                                aspectRatio: 2.0, // Thicker cartoon for better visibility in VR
                                smoothSheet: true
                            });
                            
                            component.addRepresentation('ball+stick', { 
                                sele: 'hetero and not water',
                                multipleBond: 'symmetric',
                                quality: vrMode ? 'high' : 'medium'
                            });
                            
                            // Position for VR viewing
                            stage.autoView();
                            if (vrMode) {
                                // Adjust position for better VR viewing
                                stage.viewerControls.zoom(0.8); // Zoom out slightly for better VR view
                                // Use a default center point if structure center is not available
                                const center = component.structure ? component.structure.center : new THREE.Vector3(0, 0, 0);
                                stage.viewerControls.center(center);
                            }
                            
                            setLoading(false);
                            return;
                        } catch (error) {
                            console.warn('Failed to load with rcsb protocol:', error);
                            // Continue to next approach
                        }
                        
                        // Try with pdb:// protocol
                        try {
                            console.log(`Loading PDB ID ${pdbId} using pdb:// protocol`);
                            component = await stage.loadFile(`pdb://${pdbId}`, { defaultRepresentation: false });
                            
                            // Add representations optimized for VR
                            component.addRepresentation('cartoon', { 
                                colorScheme: 'chainname',
                                quality: vrMode ? 'high' : 'medium',
                                aspectRatio: 2.0
                            });
                            
                            component.addRepresentation('ball+stick', { 
                                sele: 'hetero and not water',
                                multipleBond: 'symmetric'
                            });
                            
                            stage.autoView();
                            if (vrMode) {
                                stage.viewerControls.zoom(0.8);
                                // Use a default center point if structure center is not available
                                const center = component.structure ? component.structure.center : new THREE.Vector3(0, 0, 0);
                                stage.viewerControls.center(center);
                            }
                            
                            setLoading(false);
                            return;
                        } catch (error) {
                            console.warn('Failed to load with pdb protocol:', error);
                        }
                    }
                    
                    // Try direct URL loading
                    try {
                        console.log('Loading structure directly from URL:', cifUrl);
                        component = await stage.loadFile(cifUrl, { defaultRepresentation: false });
                        
                        component.addRepresentation('cartoon', { 
                            colorScheme: 'chainname',
                            quality: vrMode ? 'high' : 'medium',
                            aspectRatio: 2.0
                        });
                        
                        component.addRepresentation('ball+stick', { 
                            sele: 'hetero and not water',
                            multipleBond: 'symmetric'
                        });
                        
                        stage.autoView();
                        if (vrMode) {
                            stage.viewerControls.zoom(0.8);
                            // Use a default center point if structure center is not available
                            const center = component.structure ? component.structure.center : new THREE.Vector3(0, 0, 0);
                            stage.viewerControls.center(center);
                        }
                        
                        setLoading(false);
                        return;
                    } catch (error) {
                        console.warn('Direct URL loading failed:', error);
                    }
                    
                    // Fallback to a known working example
                    console.log('Loading fallback example structure (1CRN)');
                    component = await stage.loadFile('rcsb://1CRN', { defaultRepresentation: false });
                    
                    component.addRepresentation('cartoon', { 
                        colorScheme: 'chainname',
                        quality: vrMode ? 'high' : 'medium',
                        aspectRatio: 2.0
                    });
                    
                    component.addRepresentation('ball+stick', { 
                        sele: 'hetero and not water',
                        multipleBond: 'symmetric'
                    });
                    
                    stage.autoView();
                    if (vrMode) {
                        stage.viewerControls.zoom(0.8);
                        // Use a default center point if structure center is not available
                        const center = component.structure ? component.structure.center : new THREE.Vector3(0, 0, 0);
                        stage.viewerControls.center(center);
                    }
                    
                    setLoading(false);
                    setError('Using example protein (1CRN) for demonstration. The requested protein could not be loaded.');
                } catch (error) {
                    console.error('All loading attempts failed:', error);
                    setError(`Failed to load any protein structure. Please check your network connection or try a different PDB ID.`);
                    setLoading(false);
                }
            })();
        }

        // Clean up function
        return () => {
            window.removeEventListener('resize', handleResize);
            if (stageRef.current) {
                stageRef.current.dispose();
                stageRef.current = null;
            }
        };
    }, [cifUrl, vrMode]);

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-sky-500/30">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mx-auto mb-4"></div>
                        <p>Loading protein structure...</p>
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
                    <div className="text-white text-center max-w-md p-4">
                        <div className="text-red-500 text-3xl mb-2">⚠️</div>
                        <h3 className="text-xl font-bold mb-2">Error</h3>
                        <p>{error}</p>
                        <p className="mt-4 text-sm text-gray-400">Try a different protein or check the URL format</p>
                    </div>
                </div>
            )}
            <div ref={containerRef} className="w-full h-full"></div>
        </div>
    );
};
