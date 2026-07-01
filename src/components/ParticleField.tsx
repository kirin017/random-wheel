import { useMemo } from 'react'
import Particles, { ParticlesProvider } from '@tsparticles/react'
import type { Engine, ISourceOptions } from '@tsparticles/engine'
import { OutMode } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'

interface ParticleFieldProps {
  id: string
  active: boolean
  colors: string[]
  density?: number
}

const particlesInit = async (engine: Engine): Promise<void> => {
  await loadSlim(engine)
}

export default function ParticleField({ id, active, colors, density = 24 }: ParticleFieldProps) {
  const options = useMemo<ISourceOptions>(() => ({
    fullScreen: { enable: false },
    fpsLimit: 60,
    detectRetina: true,
    particles: {
      color: { value: colors },
      number: { value: density },
      opacity: {
        value: { min: 0.22, max: 0.62 },
        animation: { enable: true, speed: 0.8, minimumValue: 0.1 },
      },
      size: { value: { min: 2, max: 5 } },
      move: {
        enable: true,
        speed: { min: 0.45, max: 1.2 },
        random: true,
        outModes: { default: OutMode.out },
      },
      shape: { type: 'circle' },
    },
  }), [colors, density])

  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      <ParticlesProvider init={particlesInit}>
        <Particles id={id} options={options} />
      </ParticlesProvider>
    </div>
  )
}
