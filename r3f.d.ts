import * as THREE from 'three'
import { Object3DNode } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      planeGeometry: Object3DNode<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>
      boxGeometry: Object3DNode<THREE.BoxGeometry, typeof THREE.BoxGeometry>
      sphereGeometry: Object3DNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>
      cylinderGeometry: Object3DNode<THREE.CylinderGeometry, typeof THREE.CylinderGeometry>
      torusGeometry: Object3DNode<THREE.TorusGeometry, typeof THREE.TorusGeometry>
      coneGeometry: Object3DNode<THREE.ConeGeometry, typeof THREE.ConeGeometry>
      circleGeometry: Object3DNode<THREE.CircleGeometry, typeof THREE.CircleGeometry>
      meshBasicMaterial: Object3DNode<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>
      meshStandardMaterial: Object3DNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>
      ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>
      directionalLight: Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>
      pointLight: Object3DNode<THREE.PointLight, typeof THREE.PointLight>
      spotLight: Object3DNode<THREE.SpotLight, typeof THREE.SpotLight>
      hemisphereLight: Object3DNode<THREE.HemisphereLight, typeof THREE.HemisphereLight>
      group: Object3DNode<THREE.Group, typeof THREE.Group>
      axesHelper: Object3DNode<THREE.AxesHelper, typeof THREE.AxesHelper>
      boxHelper: Object3DNode<THREE.BoxHelper, typeof THREE.BoxHelper>
      primitive: { object: any } & JSX.IntrinsicAttributes
    }
  }
}
