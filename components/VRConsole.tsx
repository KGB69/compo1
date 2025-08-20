// @ts-nocheck - Disable TypeScript checking for React Three Fiber JSX elements
import React, { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
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
    clear: () => vrConsole.clear()
  };
};

// VR Console Component
export const VRConsole: React.FC<VRConsoleProps> = ({ maxLines = 20 }) => {
  const { scene } = useThree();
  const { isPresenting } = useXR();
  const [logs, setLogs] = useState<string[]>([]);
  const consoleRef = useRef<THREE.Mesh>();

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
        opacity: 0.9
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
      
      // Subscribe to log updates
      const removeListener = vrConsole.addListener(newLogs => {
        setLogs(newLogs);
        updateConsoleTexture(newLogs);
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
      context.fillStyle = '#000000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add border
      context.strokeStyle = '#ffffff';
      context.lineWidth = 4;
      context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      
      // Add title
      context.fillStyle = '#00ff00';
      context.font = '24px monospace';
      context.fillText('VR Debug Console', 20, 30);
      
      // Add separator
      context.strokeStyle = '#444444';
      context.beginPath();
      context.moveTo(10, 40);
      context.lineTo(canvas.width - 10, 40);
      context.stroke();
      
      // Add logs
      context.fillStyle = '#ffffff';
      context.font = '18px monospace';
      logs.forEach((log, i) => {
        context.fillText(log, 20, 70 + i * 22);
      });
      
      texture.needsUpdate = true;
    }
  };
  
  return null;
};

// Export a helper to monitor controller events
export const useControllerMonitor = () => {
  const { controllers } = useXR();
  
  useEffect(() => {
    if (controllers.length > 0) {
      vrConsole.log(`Found ${controllers.length} controllers`);
      
      controllers.forEach((controller, index) => {
        // @ts-ignore - XR controller handedness property
        const hand = controller.handedness || 'unknown';
        vrConsole.log(`Controller ${index}: ${hand} hand`);
        
        // Monitor select events
        controller.addEventListener('selectstart', () => {
          vrConsole.log(`${hand} controller: select start`);
        });
        
        controller.addEventListener('selectend', () => {
          vrConsole.log(`${hand} controller: select end`);
        });
        
        // Monitor squeeze events
        controller.addEventListener('squeezestart', () => {
          vrConsole.log(`${hand} controller: squeeze start`);
        });
        
        controller.addEventListener('squeezeend', () => {
          vrConsole.log(`${hand} controller: squeeze end`);
        });
      });
    }
    
    return () => {
      // Cleanup event listeners if needed
    };
  }, [controllers]);
  
  return null;
};
