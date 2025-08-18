import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ProteinInWorldProps {
  pdbId: string;
  position?: [number, number, number];
  scale?: number;
  viewMode?: 'ball-and-stick' | 'ribbon' | 'cartoon' | 'surface';
  heightOffset?: number;
}

export default function ProteinInWorld({ 
  pdbId, 
  position = [0, 0, 0], 
  scale = 0.2,
  viewMode = 'cartoon',
  heightOffset = 1.5
}: ProteinInWorldProps) {
  const proteinRef = useRef<THREE.Group>(null);
  const [error, setError] = useState<string | null>(null);
  const [proteinStructure, setProteinStructure] = useState<THREE.Group | null>(null);
  const [currentHeight, setCurrentHeight] = useState(heightOffset);
  const [targetHeight, setTargetHeight] = useState(heightOffset);

  useEffect(() => {
    if (!pdbId) return;

    setError(null);

    const loadProteinStructure = async () => {
      try {
        const response = await fetch(`https://files.rcsb.org/download/${pdbId.toUpperCase()}.pdb`);
        if (!response.ok) throw new Error('Protein not found');
        
        const pdbData = await response.text();
        const structure = createProteinFromPDB(pdbData, viewMode, scale);
        setProteinStructure(structure);
      } catch (err) {
        setError('Failed to load protein structure');
      }
    };

    loadProteinStructure();
  }, [pdbId, viewMode, scale]);

  const createProteinFromPDB = (pdbData: string, mode: string, scaleFactor: number): THREE.Group => {
    const proteinGroup = new THREE.Group();
    const lines = pdbData.split('\n');
    const atoms: { x: number; y: number; z: number; element: string }[] = [];
    const residues: { x: number; y: number; z: number }[] = [];
    
    lines.forEach(line => {
      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        const x = parseFloat(line.substring(30, 38));
        const y = parseFloat(line.substring(38, 46));
        const z = parseFloat(line.substring(46, 54));
        const element = line.substring(76, 78).trim();
        
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          atoms.push({ x, y, z, element });
        }
      }
    });

    if (atoms.length === 0) {
      return createStylizedProtein();
    }

    switch (mode) {
      case 'ball-and-stick':
        return createBallAndStickModel(atoms, scaleFactor);
      case 'ribbon':
        return createRibbonModel(residues, scaleFactor);
      case 'cartoon':
        return createCartoonModel(residues, scaleFactor);
      case 'surface':
        return createSurfaceModel(atoms, scaleFactor);
      default:
        return createCartoonModel(residues, scaleFactor);
    }
  };

  const createBallAndStickModel = (atoms: any[], scaleFactor: number) => {
    const group = new THREE.Group();
    
    atoms.forEach((atom) => {
      const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color: getElementColor(atom.element),
        transparent: true,
        opacity: 0.9
      });
      
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(
        atom.x * scaleFactor,
        atom.y * scaleFactor,
        atom.z * scaleFactor
      );
      group.add(sphere);
    });

    return group;
  };

  const createRibbonModel = (residues: any[], scaleFactor: number) => {
    const group = new THREE.Group();
    
    if (residues.length < 2) return createStylizedProtein();
    
    const points = residues.map(res => new THREE.Vector3(
      res.x * scaleFactor,
      res.y * scaleFactor,
      res.z * scaleFactor
    ));
    
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.4, 8, false);
    const tubeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x4ecdc4,
      transparent: true,
      opacity: 0.8
    });
    
    const ribbon = new THREE.Mesh(tubeGeometry, tubeMaterial);
    group.add(ribbon);
    
    return group;
  };

  const createCartoonModel = (residues: any[], scaleFactor: number) => {
    const group = new THREE.Group();
    
    if (residues.length < 2) return createStylizedProtein();
    
    residues.forEach((residue, index) => {
      if (index > 0) {
        const prev = residues[index - 1];
        const start = new THREE.Vector3(
          prev.x * scaleFactor,
          prev.y * scaleFactor,
          prev.z * scaleFactor
        );
        const end = new THREE.Vector3(
          residue.x * scaleFactor,
          residue.y * scaleFactor,
          residue.z * scaleFactor
        );

        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        const cylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, length, 8);
        const cylinderMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xff6b6b,
          transparent: true,
          opacity: 0.8
        });
        
        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        cylinder.position.copy(start).add(direction.multiplyScalar(0.5));
        cylinder.lookAt(end);
        cylinder.rotateX(Math.PI / 2);
        
        group.add(cylinder);
      }
    });
    
    return group;
  };

  const createSurfaceModel = (atoms: any[], scaleFactor: number) => {
    const group = new THREE.Group();
    
    atoms.forEach((atom) => {
      const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color: getElementColor(atom.element),
        transparent: true,
        opacity: 0.6
      });
      
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(
        atom.x * scaleFactor,
        atom.y * scaleFactor,
        atom.z * scaleFactor
      );
      group.add(sphere);
    });
    
    return group;
  };

  const getElementColor = (element: string) => {
    switch (element) {
      case 'C': return 0x404040;
      case 'N': return 0x0000ff;
      case 'O': return 0xff0000;
      case 'S': return 0xffff00;
      default: return 0x00ff00;
    }
  };

  const createStylizedProtein = () => {
    const group = new THREE.Group();
    
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    
    // Main protein chain
    const chainGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-4, 0, 0),
        new THREE.Vector3(-2, 2, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(2, -2, 0),
        new THREE.Vector3(4, 0, 0)
      ]),
      20,
      0.8,
      8,
      false
    );
    
    const chainMaterial = new THREE.MeshPhongMaterial({ 
      color: colors[0],
      shininess: 100
    });
    const chain = new THREE.Mesh(chainGeometry, chainMaterial);
    group.add(chain);

    // Side chains
    for (let i = 0; i < 8; i++) {
      const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
      const sphereMaterial = new THREE.MeshPhongMaterial({ 
        color: colors[i % colors.length]
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      
      const t = i / 7;
      const pos = new THREE.Vector3();
      chainGeometry.parameters.path.getPoint(t, pos);
      sphere.position.copy(pos);
      sphere.position.y += 1.5;
      sphere.position.x += (Math.random() - 0.5) * 2;
      sphere.position.z += (Math.random() - 0.5) * 2;
      
      group.add(sphere);
    }

    return group;
  };

  useEffect(() => {
    if (proteinStructure && proteinRef.current) {
      // Clear existing children
      while (proteinRef.current.children.length > 0) {
        proteinRef.current.remove(proteinRef.current.children[0]);
      }
      
      // Add the actual protein structure
      proteinRef.current.add(proteinStructure);
    }
  }, [proteinStructure]);

  // Smooth height animation
  useFrame(() => {
    if (proteinRef.current) {
      // Gentle rotation
      proteinRef.current.rotation.y += 0.005;
      
      // Smooth height transition
      if (Math.abs(currentHeight - targetHeight) > 0.01) {
        const newHeight = currentHeight + (targetHeight - currentHeight) * 0.1;
        setCurrentHeight(newHeight);
        proteinRef.current.position.y = newHeight;
      }
    }
  });

  // Update target height when prop changes
  useEffect(() => {
    setTargetHeight(heightOffset);
  }, [heightOffset]);

  if (error) {
    return (
      <group position={position}>
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      </group>
    );
  }

  return (
    <group 
      ref={proteinRef} 
      position={[position[0], currentHeight, position[2]]}
      scale={[scale, scale, scale]}
    >
      {proteinStructure ? (
        <primitive object={proteinStructure} />
      ) : (
        <primitive object={createStylizedProtein()} />
      )}
    </group>
  );
}
