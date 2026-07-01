import { Howl } from 'howler'

type SoundCue = 'press' | 'tick' | 'win'

const SAMPLE_RATE = 22050
const soundCache: Partial<Record<SoundCue, Howl>> = {}
let lastTickAt = 0

function getNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now()
  return Date.now()
}

function writeString(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

function createToneDataUri(frequencies: number[], durationSeconds: number, volume: number): string {
  const sampleCount = Math.floor(SAMPLE_RATE * durationSeconds)
  const buffer = new ArrayBuffer(44 + sampleCount * 2)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + sampleCount * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, sampleCount * 2, true)

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / SAMPLE_RATE
    const envelope = Math.max(0, 1 - t / durationSeconds)
    const wave = frequencies.reduce((sum, frequency) => {
      return sum + Math.sin(2 * Math.PI * frequency * t)
    }, 0) / frequencies.length
    const sample = Math.max(-1, Math.min(1, wave * envelope * volume))
    view.setInt16(44 + i * 2, sample * 0x7fff, true)
  }

  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return `data:audio/wav;base64,${btoa(binary)}`
}

function getCue(cue: SoundCue): Howl {
  if (soundCache[cue]) return soundCache[cue]

  const srcByCue: Record<SoundCue, string> = {
    press: createToneDataUri([330, 520], 0.16, 0.18),
    tick: createToneDataUri([880], 0.045, 0.09),
    win: createToneDataUri([523, 659, 784], 0.42, 0.16),
  }

  const sound = new Howl({
    src: [srcByCue[cue]],
    volume: cue === 'tick' ? 0.28 : 0.42,
    preload: true,
    html5: false,
  })
  soundCache[cue] = sound
  return sound
}

export function playSpinSound(cue: SoundCue, enabled: boolean): void {
  if (!enabled) return
  if (cue === 'tick') {
    const now = getNow()
    if (now - lastTickAt < 65) return
    lastTickAt = now
  }

  try {
    getCue(cue).play()
  } catch {
    // Browser audio unlock failures should not block the spin.
  }
}

export function stopSpinSounds(): void {
  Object.values(soundCache).forEach((sound) => sound.stop())
}

export function unloadSpinSounds(): void {
  for (const cue of Object.keys(soundCache) as SoundCue[]) {
    soundCache[cue]?.unload()
    delete soundCache[cue]
  }
  lastTickAt = 0
}
