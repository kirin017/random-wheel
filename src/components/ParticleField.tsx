import { useCallback, useEffect, useMemo, useState } from 'react'
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

export default function ParticleField({ id, active, colors, density = 24 }: ParticleFieldProps) {
  const [particlesReady, setParticlesReady] = useState(true)
  const colorKey = colors.join('|')

  useEffect(() => {
    if (active) setParticlesReady(true)
  }, [active, id])

  const handleParticlesInit = useCallback(async (engine: Engine): Promise<void> => {
    try {
      await loadSlim(engine)
    } catch {
      setParticlesReady(false)
    }
  }, [])

  const options = useMemo<ISourceOptions>(() => {
    const particleColors = colorKey.length > 0 ? colorKey.split('|') : []

    return {
      fullScreen: { enable: false },
      fpsLimit: 60,
      detectRetina: true,
      particles: {
        color: { value: particleColors },
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
    }
  }, [colorKey, density])

  if (!active || !particlesReady) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      <ParticlesProvider init={handleParticlesInit}>
        <Particles id={id} className="h-full w-full" options={options} />
      </ParticlesProvider>
    </div>
  )
}
