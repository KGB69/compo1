
import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, VRButton } from '@react-three/xr';
import { Scene } from './components/Scene';
import { Player } from './components/Player';
import { RadialMenu } from './components/RadialMenu';
import { ImmersivePage } from './components/ImmersivePage';
import { GlobalVRInput } from './components/GlobalVRInput';
import { GameState, PageContent } from './types';
import { PAGES } from './constants';

export default function App(): React.ReactNode {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [activePage, setActivePage] = useState<PageContent | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [pageDistance, setPageDistance] = useState(4);
  const [pageYOffset, setPageYOffset] = useState(0);

  const handleStart = useCallback(() => {
    setGameState(GameState.EXPLORING);
  }, []);

  const handleOpenMenu = useCallback(() => {
    if (gameState === GameState.EXPLORING) {
      setGameState(GameState.MENU);
    } else if (gameState === GameState.MENU) {
      setGameState(GameState.EXPLORING);
    }
  }, [gameState]);

  const handleSelectPage = useCallback((page: PageContent) => {
    setActivePage(page);
    setGameState(GameState.PAGE_VIEW);
  }, []);

  const handleClosePage = useCallback(() => {
    setActivePage(null);
    setGameState(GameState.EXPLORING);
  }, []);

  const handlePointerLockChange = useCallback((isLocked: boolean) => {
    setIsPointerLocked(isLocked);
  }, []);
  
  const handleBack = useCallback(() => {
    if (gameState === GameState.PAGE_VIEW) {
      handleClosePage();
    } else if (gameState === GameState.MENU) {
      setGameState(GameState.EXPLORING);
    }
  }, [gameState, handleClosePage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') {
        handleOpenMenu();
      }
      if (e.key === 'Escape') {
        handleBack();
      }

      // UI Panel position controls
      const distanceStep = 0.1;
      const yOffsetStep = 0.1;
      const MAX_DISTANCE = 8;
      const MIN_DISTANCE = 2;
      const MAX_Y_OFFSET = 1.5;
      const MIN_Y_OFFSET = -1.5;

      switch (e.code) {
        case 'Numpad8':
          setPageYOffset(prev => Math.min(MAX_Y_OFFSET, prev + yOffsetStep));
          break;
        case 'Numpad2':
          setPageYOffset(prev => Math.max(MIN_Y_OFFSET, prev - yOffsetStep));
          break;
        case 'Numpad6':
          setPageDistance(prev => Math.min(MAX_DISTANCE, prev + distanceStep));
          break;
        case 'Numpad4':
          setPageDistance(prev => Math.max(MIN_DISTANCE, prev - distanceStep));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, handleBack, handleOpenMenu]);

  return (
    <div className="w-screen h-screen bg-black">
      {gameState === GameState.START && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white">
          <h1 className="text-5xl font-bold mb-4">Fold VR</h1>
          <p className="text-lg mb-8 text-center leading-relaxed">
            <span className="font-bold">Desktop:</span> Use WASD to move. Press 'M' to open the menu. Click to begin.
            <br/>
            <span className="font-bold">VR:</span> Use left stick to move. Press 'Y' button for menu.
          </p>
          <button
            onClick={handleStart}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-lg font-semibold transition-colors"
          >
            Start Exploring
          </button>
        </div>
      )}

      {gameState === GameState.EXPLORING && !isPointerLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white pointer-events-none">
            <h2 className="text-4xl font-bold animate-pulse">Click or Press 'T' to Look</h2>
            <p className="text-lg mt-2">Use WASD to move, 'M' for menu, 'Esc' to release control</p>
            <p className="text-sm mt-4 text-slate-300">(In VR, you can look around freely)</p>
        </div>
      )}
      {/* @ts-ignore The `store` prop is required by the current type definitions but is part of a deprecated API. The `style` prop is also not supported. */}
      <VRButton />
      <Canvas shadows camera={{ fov: 75, position: [0, 1.6, 5] }}>
          {/* @ts-ignore The `store` prop is required by the current type definitions but is part of a deprecated API. */}
          <XR>
            <GlobalVRInput onMenuToggle={handleOpenMenu} onBack={handleBack} />
            <Scene />
            <Player 
              gameState={gameState}
              isLocked={isPointerLocked}
              onPointerLockChange={handlePointerLockChange}
            />
            {gameState === GameState.MENU && <RadialMenu onSelectPage={handleSelectPage} pageYOffset={pageYOffset} />}
            {gameState === GameState.PAGE_VIEW && activePage && (
              <ImmersivePage
                content={activePage}
                onClose={handleClosePage}
                pageDistance={pageDistance}
                setPageDistance={setPageDistance}
                pageYOffset={pageYOffset}
                setPageYOffset={setPageYOffset}
              />
            )}
          </XR>
      </Canvas>
    </div>
  );
}