"use client"

import { useEffect, useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { BufferGeometry, Float32BufferAttribute, DoubleSide } from "three"
import { outline, type GemCut, type GemStage } from "./gem-shape"

function geometryFor(cut: GemCut, stage: GemStage) {
  const contour = outline(cut, stage)
  const sides = contour.length
  const positions = contour.flatMap(([x, z], index) => [x, stage === 0 ? Math.sin(index * 2.2) * .2 : 0, z])
  contour.forEach(([x,z], index) => {
    const table = stage === 0 ? .72 : .57
    positions.push(x * table, stage === 0 ? .38 + Math.sin(index * 2.15) * .21 : .33, z * table)
  })
  positions.push(0, .33, 0, stage === 0 ? -.19 : 0, stage === 0 ? -.58 : -.78, 0)
  const triangles: number[] = []
  for (let i = 0; i < sides; i++) {
    const next = (i + 1) % sides
    triangles.push(i, i + sides, next, next, i + sides, next + sides)
    triangles.push(2 * sides, next + sides, i + sides, 2 * sides + 1, i, next)
  }
  const indexed = new BufferGeometry()
  indexed.setAttribute("position", new Float32BufferAttribute(positions, 3))
  indexed.setIndex(triangles)
  const facets = indexed.toNonIndexed()
  indexed.dispose()
  facets.computeVertexNormals()
  return facets
}

function Stone({ cut, tint, stage }: { cut: GemCut; tint: string; stage: GemStage }) {
  const geometry = useMemo(() => geometryFor(cut, stage), [cut, stage])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} rotation={[.34, .2, -.1]}>
    <meshPhysicalMaterial color={tint} flatShading side={DoubleSide} roughness={stage === 0 ? .9 : stage === 1 ? .4 : .17}
      metalness={stage === 2 ? .28 : .02} clearcoat={stage === 2 ? 1 : 0} clearcoatRoughness={.08} />
  </mesh>
}

export default function GemCanvas({ cut, tint, stage, interactive, angle, fallback }: {
  cut: GemCut
  tint: string
  stage: GemStage
  interactive: boolean
  angle: number
  fallback: React.ReactNode
}) {
  return <Canvas dpr={[1, 2]} frameloop="demand" fallback={fallback} camera={{ position: [0, 2.65, 3.5], fov: 40 }}>
    <ambientLight intensity={.95} />
    <directionalLight position={[3, 4, 2]} intensity={3.2} color="#fff4db" />
    <directionalLight position={[-3, .75, -2]} intensity={2.5} color="#d9fff3" />
    <pointLight position={[0, -2, 3]} intensity={20} />
    <group rotation={[0, angle, 0]}><Stone cut={cut} tint={tint} stage={stage} /></group>
    {interactive && <OrbitControls enablePan={false} enableZoom={false} />}
  </Canvas>
}
