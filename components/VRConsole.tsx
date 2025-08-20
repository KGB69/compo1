// @ts-nocheck - Disable TypeScript checking for React Three Fiber JSX elements
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import * as THREE from 'three';

interface VRConsoleProps {
  maxLines?: number;
}

// Create a singleton pattern for the console log
class VRConsoleLogger {
  private static instance: VRConsoleLogger;
  private logs: string[] = [];
  private maxLogs: number = 20;
  private listeners: ((logs: string[]) => void)[] = [];
  private controllerInfo: {
    left: {
      connected: boolean;
      buttons: number[];
      axes: number[];
      lastUpdate: number;
      source: 'react-xr' | 'webxr' | 'both' | 'none';
    };
    right: {
      connected: boolean;
      buttons: number[];
      axes: number[];
      lastUpdate: number;
      source: 'react-xr' | 'webxr' | 'both' | 'none';
    };
  } = {
    left: { connected: false, buttons: [], axes: [], lastUpdate: 0, source: 'none' },
    right: { connected: false, buttons: [], axes: [], lastUpdate: 0, source: 'none' }
  };

  private constructor() {}

  public static getInstance(): VRConsoleLogger {
    if (!VRConsoleLogger.instance) {
      VRConsoleLogger.instance = new VRConsoleLogger();
    }
    return VRConsoleLogger.instance;
  }

  public log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.unshift(`${timestamp}: ${message}`);
    
    // Keep logs within max size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    // Notify all listeners
    this.listeners.forEach(listener => listener([...this.logs]));
    
    // Also log to browser console for desktop debugging
    console.log(`[VRConsole] ${message}`);
  }
  
  public updateControllerInfo(hand: 'left' | 'right', connected: boolean, buttons?: number[], axes?: number[], source?: 'react-xr' | 'webxr' | 'both'): void {
    this.controllerInfo[hand] = {
      connected,
      buttons: buttons || [],
      axes: axes || [],
      lastUpdate: Date.now(),
      source: source || (connected ? 'react-xr' : 'none')
    };
    
    // Notify listeners of controller update
    this.listeners.forEach(listener => listener([...this.logs]));
  }
  
  public getControllerInfo(): typeof this.controllerInfo {
    return {...this.controllerInfo};
  }

  public getLogs(): string[] {
    return [...this.logs];
  }

  public setMaxLogs(max: number): void {
    this.maxLogs = max;
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
      this.listeners.forEach(listener => listener([...this.logs]));
    }
  }

  public addListener(listener: (logs: string[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public clear(): void {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }
}

// Export the logger for use in other components
export const vrConsole = VRConsoleLogger.getInstance();

// Hook to use the VR console
export const useVRConsole = () => {
  return {
    log: (message: string) => vrConsole.log(message),
    clear: () => vrConsole.clear(),
    updateControllerInfo: (hand: 'left' | 'right', connected: boolean, buttons?: number[], axes?: number[], source?: 'react-xr' | 'webxr' | 'both') => 
      vrConsole.updateControllerInfo(hand, connected, buttons, axes, source),
    getControllerInfo: () => vrConsole.getControllerInfo()
  };
};

// VR Console Component
export const VRConsole: React.FC<VRConsoleProps> = ({ maxLines = 20 }) => {
  const { scene } = useThree();
  const { isPresenting, controllers } = useXR();
  const [logs, setLogs] = useState<string[]>([]);
  const consoleRef = useRef<THREE.Mesh>();
  const controllerInfoRef = useRef<THREE.Mesh>();

  // Create controller info panel
  useEffect(() => {
    if (isPresenting) {
      // Create controller info panel
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      const geometry = new THREE.PlaneGeometry(1, 1);
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position the controller info panel to the right
      mesh.position.set(1.5, 1.5, -1.5);
      mesh.rotation.y = -Math.PI / 8; // Angle slightly toward center
      scene.add(mesh);
      controllerInfoRef.current = mesh;
      
      // Update controller info initially
      updateControllerInfoTexture();
      
      return () => {
        scene.remove(mesh);
      };
    }
  }, [isPresenting, scene]);
  
  // Create main console panel
  useEffect(() => {
    if (isPresenting) {
      // Set max logs
      vrConsole.setMaxLogs(maxLines);
      
      // Create console panel
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      const geometry = new THREE.PlaneGeometry(2, 1);
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position the console panel
      mesh.position.set(0, 2, -2); // Above the player's view
      scene.add(mesh);
      consoleRef.current = mesh;
      
      // Add initial message
      vrConsole.log("VR Console initialized");
      vrConsole.log("Move with left thumbstick");
      vrConsole.log("Press buttons to see events");
      vrConsole.log("Look down to move forward (fallback)");
      
      // Subscribe to log updates
      const removeListener = vrConsole.addListener(newLogs => {
        setLogs(newLogs);
        updateConsoleTexture(newLogs);
        updateControllerInfoTexture(); // Also update controller info
      });
      
      return () => {
        removeListener();
        scene.remove(mesh);
      };
    }
  }, [isPresenting, maxLines, scene]);
  
  // Update the console texture with new logs
  const updateConsoleTexture = (logs: string[]) => {
    if (!consoleRef.current) return;
    
    const material = consoleRef.current.material as THREE.MeshBasicMaterial;
    const texture = material.map as THREE.CanvasTexture;
    const canvas = texture.image;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Clear canvas
      context.fillStyle = 'rgba(0, 0, 0, 0.8)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add border
      context.strokeStyle = '#ffffff';
      context.lineWidth = 4;
      context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      
      // Add title
      context.fillStyle = '#00ff00';
      context.font = 'bold 28px monospace';
      context.fillText('VR Debug Console', 20, 35);
      
      // Add separator
      context.strokeStyle = '#444444';
      context.beginPath();
      context.moveTo(10, 45);
      context.lineTo(canvas.width - 10, 45);
      context.stroke();
      
      // Add logs
      context.fillStyle = '#ffffff';
      context.font = '20px monospace';
      logs.forEach((log, i) => {
        // Highlight important messages
        if (log.includes('controller') || log.includes('Controller')) {
          context.fillStyle = '#ffff00';
        } else if (log.includes('error') || log.includes('Error')) {
          context.fillStyle = '#ff6666';
        } else if (log.includes('connected') || log.includes('Connected')) {
          context.fillStyle = '#66ff66';
        } else if (log.includes('movement') || log.includes('Moving')) {
          context.fillStyle = '#66ffff';
        } else {
          context.fillStyle = '#ffffff';
        }
        
        context.fillText(log, 20, 75 + i * 24);
      });
      
      texture.needsUpdate = true;
    }
  };
  
  // Update controller info panel
  const updateControllerInfoTexture = () => {
    if (!controllerInfoRef.current) return;
    
    const material = controllerInfoRef.current.material as THREE.MeshBasicMaterial;
    const texture = material.map as THREE.CanvasTexture;
    const canvas = texture.image;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Clear canvas
      context.fillStyle = 'rgba(0, 0, 0, 0.8)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add border
      context.strokeStyle = '#ffffff';
      context.lineWidth = 4;
      context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      
      // Add title
      context.fillStyle = '#00ffff';
      context.font = 'bold 24px monospace';
      context.fillText('Controller Status', 20, 35);
      
      // Add separator
      context.strokeStyle = '#444444';
      context.beginPath();
      context.moveTo(10, 45);
      context.lineTo(canvas.width - 10, 45);
      context.stroke();
      
      // Get controller info
      const controllerInfo = vrConsole.getControllerInfo();
      
      // Left controller status
      context.fillStyle = '#ff6666'; // Red for left controller
      context.font = 'bold 20px monospace';
      context.fillText('Left Controller:', 20, 80);
      
      context.font = '18px monospace';
      context.fillStyle = controllerInfo.left.connected ? '#66ff66' : '#ff6666';
      context.fillText(`Status: ${controllerInfo.left.connected ? 'CONNECTED' : 'DISCONNECTED'}`, 40, 110);
      
      // Show source of controller detection
      if (controllerInfo.left.connected) {
        let sourceColor = '#ffffff';
        if (controllerInfo.left.source === 'webxr') sourceColor = '#ffaa00';
        if (controllerInfo.left.source === 'react-xr') sourceColor = '#00aaff';
        if (controllerInfo.left.source === 'both') sourceColor = '#aaffaa';
        
        context.fillStyle = sourceColor;
        context.fillText(`Source: ${controllerInfo.left.source.toUpperCase()}`, 200, 110);
      }
      
      if (controllerInfo.left.connected) {
        context.fillStyle = '#ffffff';
        context.fillText(`Buttons: ${controllerInfo.left.buttons.length}`, 40, 140);
        context.fillText(`Axes: ${controllerInfo.left.axes.length}`, 40, 170);
        
        // Show pressed buttons
        const pressedButtons = controllerInfo.left.buttons
          .map((value, index) => value > 0.5 ? index : -1)
          .filter(index => index !== -1);
        
        context.fillStyle = pressedButtons.length > 0 ? '#ffff00' : '#aaaaaa';
        context.fillText(`Pressed: ${pressedButtons.length > 0 ? pressedButtons.join(', ') : 'None'}`, 40, 200);
        
        // Show active axes
        const activeAxes = controllerInfo.left.axes
          .map((value, index) => Math.abs(value) > 0.1 ? `${index}:${value.toFixed(2)}` : null)
          .filter(Boolean);
        
        context.fillStyle = activeAxes.length > 0 ? '#ffff00' : '#aaaaaa';
        context.fillText(`Active axes: ${activeAxes.length > 0 ? activeAxes.join(', ') : 'None'}`, 40, 230);
      }
      
      // Right controller status
      context.fillStyle = '#6666ff'; // Blue for right controller
      context.font = 'bold 20px monospace';
      context.fillText('Right Controller:', 20, 270);
      
      context.font = '18px monospace';
      context.fillStyle = controllerInfo.right.connected ? '#66ff66' : '#ff6666';
      context.fillText(`Status: ${controllerInfo.right.connected ? 'CONNECTED' : 'DISCONNECTED'}`, 40, 300);
      
      // Show source of controller detection
      if (controllerInfo.right.connected) {
        let sourceColor = '#ffffff';
        if (controllerInfo.right.source === 'webxr') sourceColor = '#ffaa00';
        if (controllerInfo.right.source === 'react-xr') sourceColor = '#00aaff';
        if (controllerInfo.right.source === 'both') sourceColor = '#aaffaa';
        
        context.fillStyle = sourceColor;
        context.fillText(`Source: ${controllerInfo.right.source.toUpperCase()}`, 200, 300);
      }
      
      if (controllerInfo.right.connected) {
        context.fillStyle = '#ffffff';
        context.fillText(`Buttons: ${controllerInfo.right.buttons.length}`, 40, 330);
        context.fillText(`Axes: ${controllerInfo.right.axes.length}`, 40, 360);
        
        // Show pressed buttons
        const pressedButtons = controllerInfo.right.buttons
          .map((value, index) => value > 0.5 ? index : -1)
          .filter(index => index !== -1);
        
        context.fillStyle = pressedButtons.length > 0 ? '#ffff00' : '#aaaaaa';
        context.fillText(`Pressed: ${pressedButtons.length > 0 ? pressedButtons.join(', ') : 'None'}`, 40, 390);
        
        // Show active axes
        const activeAxes = controllerInfo.right.axes
          .map((value, index) => Math.abs(value) > 0.1 ? `${index}:${value.toFixed(2)}` : null)
          .filter(Boolean);
        
        context.fillStyle = activeAxes.length > 0 ? '#ffff00' : '#aaaaaa';
        context.fillText(`Active axes: ${activeAxes.length > 0 ? activeAxes.join(', ') : 'None'}`, 40, 420);
      }
      
      // Add help text
      context.fillStyle = '#aaaaaa';
      context.font = '16px monospace';
      context.fillText('Press any button to test controllers', 20, 450);
      context.fillText('Updates every frame when connected', 20, 470);
      
      // Add source legend
      context.fillStyle = '#00aaff';
      context.fillText('REACT-XR: Using react-three/xr API', 20, 490);
      context.fillStyle = '#ffaa00';
      context.fillText('WEBXR: Using direct WebXR API', 260, 490);
      context.fillStyle = '#aaffaa';
      context.fillText('BOTH: Detected by both APIs', 20, 510);
      
      texture.needsUpdate = true;
    }
  };
  
  return null;
};

// Export a helper to monitor controller events
export const useControllerMonitor = () => {
  const { controllers, player } = useXR();
  const xrInputSources = useRef<any[]>([]);
  
  // Set up event listeners for controllers
  useEffect(() => {
    if (controllers.length > 0) {
      vrConsole.log(`Found ${controllers.length} controllers`);
      
      controllers.forEach((controller, index) => {
        // @ts-ignore - XR controller handedness property
        const hand = controller.handedness || 'unknown';
        vrConsole.log(`Controller ${index}: ${hand} hand`);
        
        // Update controller connection status
        if (hand === 'left' || hand === 'right') {
          vrConsole.updateControllerInfo(hand, true);
        }
        
        // Monitor select events
        const onSelectStart = () => {
          vrConsole.log(`${hand} controller: select start`);
        };
        
        const onSelectEnd = () => {
          vrConsole.log(`${hand} controller: select end`);
        };
        
        // Monitor squeeze events
        const onSqueezeStart = () => {
          vrConsole.log(`${hand} controller: squeeze start`);
        };
        
        const onSqueezeEnd = () => {
          vrConsole.log(`${hand} controller: squeeze end`);
        };
        
        // Remove existing listeners if any (to prevent duplicates)
        controller.removeEventListener('selectstart', onSelectStart);
        controller.removeEventListener('selectend', onSelectEnd);
        controller.removeEventListener('squeezestart', onSqueezeStart);
        controller.removeEventListener('squeezeend', onSqueezeEnd);
        
        // Add listeners
        controller.addEventListener('selectstart', onSelectStart);
        controller.addEventListener('selectend', onSelectEnd);
        controller.addEventListener('squeezestart', onSqueezeStart);
        controller.addEventListener('squeezeend', onSqueezeEnd);
        
        // Store listeners for cleanup
        controller._eventListeners = controller._eventListeners || {};
        controller._eventListeners.selectstart = onSelectStart;
        controller._eventListeners.selectend = onSelectEnd;
        controller._eventListeners.squeezestart = onSqueezeStart;
        controller._eventListeners.squeezeend = onSqueezeEnd;
      });
    }
    
    return () => {
      // Cleanup event listeners
      controllers.forEach(controller => {
        if (controller && controller._eventListeners) {
          controller.removeEventListener('selectstart', controller._eventListeners.selectstart);
          controller.removeEventListener('selectend', controller._eventListeners.selectend);
          controller.removeEventListener('squeezestart', controller._eventListeners.squeezestart);
          controller.removeEventListener('squeezeend', controller._eventListeners.squeezeend);
        }
      });
    };
  }, [controllers]);
  
  // Update controller info every frame
  useFrame(() => {
    // First check direct WebXR input sources
    if (player?.session) {
      const sources = player.session.inputSources;
      xrInputSources.current = Array.from(sources || []);
      
      // Process WebXR input sources
      xrInputSources.current.forEach(source => {
        const hand = source.handedness;
        if (hand === 'left' || hand === 'right') {
          if (source.gamepad) {
            const gamepad = source.gamepad;
            const buttons = gamepad.buttons.map(b => b?.value || 0);
            const axes = gamepad.axes || [];
            
            // Check if this controller is also detected by react-three/xr
            const isAlsoInReactXR = controllers.some(c => c.handedness === hand);
            const source = isAlsoInReactXR ? 'both' : 'webxr';
            
            // Update controller info
            vrConsole.updateControllerInfo(hand, true, buttons, axes, source);
          } else {
            // WebXR controller without gamepad
            const isAlsoInReactXR = controllers.some(c => c.handedness === hand);
            const source = isAlsoInReactXR ? 'both' : 'webxr';
            vrConsole.updateControllerInfo(hand, true, [], [], source);
          }
        }
      });
    }
    
    // Then check react-three/xr controllers
    controllers.forEach(controller => {
      // @ts-ignore - XR controller handedness property
      const hand = controller.handedness;
      
      if (hand === 'left' || hand === 'right') {
        // Check if this controller is already detected by WebXR
        const isAlsoInWebXR = xrInputSources.current.some(source => source.handedness === hand);
        
        // Only update if not already detected by WebXR to avoid overwriting
        if (!isAlsoInWebXR) {
          if (controller.inputSource?.gamepad) {
            const gamepad = controller.inputSource.gamepad;
            const buttons = gamepad.buttons.map(b => b?.value || 0);
            const axes = gamepad.axes || [];
            
            // Update controller info
            vrConsole.updateControllerInfo(hand, true, buttons, axes, 'react-xr');
          } else {
            // Controller connected but no gamepad
            vrConsole.updateControllerInfo(hand, true, [], [], 'react-xr');
          }
        }
      }
    });
    
    // Check for disconnected controllers
    ['left', 'right'].forEach(hand => {
      const controllerInfo = vrConsole.getControllerInfo();
      const isConnectedInWebXR = xrInputSources.current.some(source => source.handedness === hand);
      const isConnectedInReactXR = controllers.some(c => c.handedness === hand);
      
      // If controller was connected but now isn't connected in either source
      if (controllerInfo[hand].connected && !isConnectedInWebXR && !isConnectedInReactXR) {
        vrConsole.updateControllerInfo(hand as 'left' | 'right', false, [], [], 'none');
        vrConsole.log(`${hand} controller disconnected`);
      }
    });
  });
  
  return null;
};
