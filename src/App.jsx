import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, Sky, Stars } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'

const clamp = THREE.MathUtils.clamp

function Ground() {
  return (
    <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-0.02}>
      <planeGeometry args={[220, 220, 1, 1]} />
      <meshStandardMaterial color="#31372f" roughness={0.95} />
    </mesh>
  )
}

function Road() {
  const marks = Array.from({ length: 12 }, (_, i) => i * 12 - 66)
  return (
    <group position={[0, 0.012, -2]}>
      <mesh receiveShadow rotation-x={-Math.PI / 2}>
        <planeGeometry args={[7, 150]} />
        <meshStandardMaterial color="#1b1d1c" roughness={0.95} />
      </mesh>
      {marks.map((z) => (
        <mesh key={z} position={[0, 0.016, z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.12, 4.5]} />
          <meshBasicMaterial color="#a99e78" />
        </mesh>
      ))}
    </group>
  )
}

function Building({ position, size = [12, 8, 10], color = '#77776d', rotation = 0 }) {
  const [w, h, d] = size
  const windows = []
  for (let x = -w / 2 + 2; x < w / 2; x += 3.2) {
    for (let y = 2.2; y < h - 1; y += 3) windows.push([x, y])
  }
  return (
    <group position={position} rotation-y={rotation}>
      <mesh castShadow receiveShadow position-y={h / 2}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.82} />
      </mesh>
      {windows.map(([x, y], i) => (
        <mesh key={i} position={[x, y, d / 2 + 0.01]}>
          <planeGeometry args={[1.45, 1.15]} />
          <meshStandardMaterial
            color={i % 5 === 0 ? '#e1a24b' : '#1a2524'}
            emissive={i % 5 === 0 ? '#ff922e' : '#091313'}
            emissiveIntensity={i % 5 === 0 ? 0.7 : 0.12}
            roughness={0.25}
          />
        </mesh>
      ))}
      <mesh castShadow position={[0, h + 0.35, 0]}>
        <boxGeometry args={[w + 0.8, 0.7, d + 0.8]} />
        <meshStandardMaterial color="#4d4d48" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Shelter() {
  return (
    <group position={[18, 0, -25]}>
      <Building position={[0, 0, 0]} size={[18, 7, 12]} color="#68685f" />
      <mesh castShadow position={[0, 1.55, 6.1]}>
        <boxGeometry args={[3.2, 3.1, 0.18]} />
        <meshStandardMaterial color="#252724" roughness={0.8} />
      </mesh>
      <pointLight position={[0, 2.8, 7]} color="#ffb55b" intensity={8} distance={9} decay={2} />
    </group>
  )
}

function StreetLight({ position }) {
  return (
    <group position={position}>
      <mesh castShadow position-y={4}><cylinderGeometry args={[0.07, 0.11, 8]} /><meshStandardMaterial color="#262927" /></mesh>
      <mesh position={[0, 7.9, 0]}><sphereGeometry args={[0.23, 16, 16]} /><meshBasicMaterial color="#ffc36a" /></mesh>
      <pointLight position={[0, 7.7, 0]} color="#ffc36a" intensity={11} distance={14} decay={2} />
    </group>
  )
}

function Fence() {
  const posts = Array.from({ length: 18 }, (_, i) => i * 2 - 17)
  return (
    <group position={[29, 0, 18]}>
      {posts.map((x) => (
        <mesh key={x} castShadow position={[x, 0.65, 0]}><boxGeometry args={[0.09, 1.3, 0.09]} /><meshStandardMaterial color="#55584f" /></mesh>
      ))}
      <mesh position={[0, 0.45, 0]}><boxGeometry args={[34, 0.06, 0.06]} /><meshStandardMaterial color="#77766b" /></mesh>
      <mesh position={[0, 1.05, 0]}><boxGeometry args={[34, 0.06, 0.06]} /><meshStandardMaterial color="#77766b" /></mesh>
    </group>
  )
}

function NPC({ position, phase = 0, speed = 0.15, color = '#5b6a70', scale = 1 }) {
  const group = useRef()
  const parts = useRef([])
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    group.current.position.z = position[2] + Math.sin(t * speed + phase) * 5
    group.current.position.x = position[0] + Math.cos(t * speed * 0.6 + phase) * 1.2
    parts.current.forEach((p, i) => {
      if (p) p.rotation.x = Math.sin(t * 4.5 + phase) * (i < 2 ? 0.55 : -0.55)
    })
  })
  return (
    <group ref={group} position={position} scale={scale}>
      <mesh castShadow position-y={1.45}><capsuleGeometry args={[0.28, 0.8, 6, 10]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      <mesh castShadow position={[0, 2.32, 0]}><sphereGeometry args={[0.25, 16, 16]} /><meshStandardMaterial color="#9f8a72" roughness={1} /></mesh>
      {[[-0.14, 0.58], [0.14, 0.58]].map(([x, y], i) => (
        <mesh key={i} ref={(el) => (parts.current[i] = el)} castShadow position={[x, y, 0]}>
          <capsuleGeometry args={[0.09, 0.85, 5, 8]} /><meshStandardMaterial color="#303331" />
        </mesh>
      ))}
      {[-0.17, 0.17].map((x, i) => (
        <mesh key={x} ref={(el) => (parts.current[i + 2] = el)} castShadow position={[x, 1.62, 0]}>
          <capsuleGeometry args={[0.09, 0.75, 5, 8]} /><meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

function Player({ locked }) {
  const { camera } = useThree()
  const keys = useRef({})
  const velocity = useRef(new THREE.Vector3())

  useEffect(() => {
    const down = (e) => (keys.current[e.code] = true)
    const up = (e) => (keys.current[e.code] = false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    camera.position.set(-1, 1.72, 32)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [camera])

  useFrame((_, delta) => {
    if (!locked) return
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()
    const move = new THREE.Vector3()
    if (keys.current.KeyW) move.add(forward)
    if (keys.current.KeyS) move.sub(forward)
    if (keys.current.KeyD) move.add(right)
    if (keys.current.KeyA) move.sub(right)
    if (move.lengthSq()) {
      move.normalize()
      const sprint = keys.current.ShiftLeft || keys.current.ShiftRight
      velocity.current.lerp(move.multiplyScalar(sprint ? 7 : 4), 0.14)
    } else {
      velocity.current.multiplyScalar(0.82)
    }
    camera.position.addScaledVector(velocity.current, Math.min(delta, 0.05))
    camera.position.x = clamp(camera.position.x, -45, 45)
    camera.position.z = clamp(camera.position.z, -65, 48)
  })
  return null
}

function Trees() {
  const trees = useMemo(() => Array.from({ length: 34 }, (_, i) => ({
    x: i % 2 ? -24 - (i * 7) % 28 : 24 + (i * 9) % 32,
    z: -62 + (i * 13) % 112,
    s: 0.7 + (i % 4) * 0.18,
  })), [])
  return trees.map((t, i) => (
    <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
      <mesh castShadow position-y={2}><cylinderGeometry args={[0.16, 0.24, 4]} /><meshStandardMaterial color="#3a3428" /></mesh>
      <mesh castShadow position-y={5}><coneGeometry args={[2.1, 5, 7]} /><meshStandardMaterial color="#26372b" roughness={1} /></mesh>
    </group>
  ))
}

function Scene({ locked }) {
  return (
    <>
      <fog attach="fog" args={['#9ca39a', 25, 105]} />
      <Sky distance={450000} sunPosition={[35, 18, -20]} turbidity={8} rayleigh={0.7} mieCoefficient={0.006} />
      <Stars radius={80} depth={40} count={700} factor={2} saturation={0} fade speed={0.2} />
      <hemisphereLight args={['#9eb8be', '#31362e', 1.5]} />
      <directionalLight castShadow position={[30, 40, 15]} intensity={2.2} color="#d9d4b8" shadow-mapSize={[2048, 2048]} shadow-camera-far={120} shadow-camera-left={-55} shadow-camera-right={55} shadow-camera-top={55} shadow-camera-bottom={-55} />
      <Ground />
      <Road />
      <Trees />
      <Building position={[-24, 0, 12]} size={[14, 9, 11]} color="#6e746c" />
      <Building position={[32, 0, 7]} size={[16, 12, 13]} color="#777267" />
      <Building position={[-34, 0, -25]} size={[19, 11, 14]} color="#656c68" />
      <Shelter />
      <Fence />
      {[-52, -20, 12, 44].map((z) => <StreetLight key={z} position={[-4.8, 0, z]} />)}
      {[[-8, 0, 8, 0, 0.16], [7, 0, 22, 2, 0.13], [-12, 0, -14, 4, 0.18], [38, 0, -18, 1, 0.14], [14, 0, 38, 3, 0.12]].map((n, i) => (
        <NPC key={i} position={[n[0], n[1], n[2]]} phase={n[3]} speed={n[4]} color={i % 2 ? '#6d5f50' : '#52656b'} />
      ))}
      <Player locked={locked} />
    </>
  )
}

function Intro({ started, onStart }) {
  return (
    <div className={`intro ${started ? 'hidden' : ''}`}>
      <div className="grain" />
      <div className="title-block">
        <p className="overline">TRANSMISSION 041</p>
        <h1>LAST<br />SIGNAL</h1>
        <p className="subtitle">Find the source before the city goes dark.</p>
        <button onClick={onStart}>ENTER THE DISTRICT</button>
      </div>
    </div>
  )
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [locked, setLocked] = useState(false)

  const start = () => setStarted(true)
  return (
    <main>
      <Canvas shadows camera={{ position: [-1, 1.72, 32], fov: 75, near: 0.1, far: 220 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Scene locked={locked} />
        {started && (
          <PointerLockControls
            onLock={() => setLocked(true)}
            onUnlock={() => setLocked(false)}
          />
        )}
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.18} luminanceThreshold={0.78} luminanceSmoothing={0.3} />
          <Noise opacity={0.018} blendFunction={BlendFunction.SOFT_LIGHT} />
          <Vignette eskil={false} offset={0.25} darkness={0.58} />
        </EffectComposer>
      </Canvas>
      <Intro started={started} onStart={start} />
      {started && (
        <>
          <div className="hud">
            <div className="signal"><span /> SIGNAL</div>
            <div className="objective"><small>OBJECTIVE</small> Reach the emergency shelter</div>
          </div>
          {!locked && <div className="pause"><p>CLICK TO RESUME</p></div>}
          <div className="crosshair" />
        </>
      )}
    </main>
  )
}
