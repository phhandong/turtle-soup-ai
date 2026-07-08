const UI_SOUND_GAIN_MULTIPLIER = 9

export type UiSound = 'send' | 'reply' | 'celebrate'

type AudioWindow = Window &
  typeof globalThis & {
    turtleSoupAudioContext?: AudioContext
    webkitAudioContext?: typeof AudioContext
  }

export function playUiSound(sound: UiSound, isEnabled: boolean) {
  if (!isEnabled || typeof window === 'undefined') {
    return
  }

  const audioWindow = window as AudioWindow
  const AudioContextCtor =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext

  if (!AudioContextCtor) {
    return
  }

  try {
    const context = getUiAudioContext(AudioContextCtor)
    const now = context.currentTime

    if (sound === 'send') {
      playTone(context, {
        frequency: 560,
        startTime: now,
        duration: 0.09,
        gain: 0.048,
        type: 'triangle',
      })
      playTone(context, {
        frequency: 840,
        startTime: now + 0.045,
        duration: 0.11,
        gain: 0.036,
        type: 'sine',
      })
      return
    }

    if (sound === 'reply') {
      playTone(context, {
        frequency: 740,
        startTime: now,
        duration: 0.12,
        gain: 0.039,
        type: 'sine',
      })
      playTone(context, {
        frequency: 990,
        startTime: now + 0.075,
        duration: 0.16,
        gain: 0.03,
        type: 'triangle',
      })
      return
    }

    playTone(context, {
      frequency: 740,
      startTime: now,
      duration: 0.14,
      gain: 0.051,
      type: 'sine',
    })
    playTone(context, {
      frequency: 980,
      startTime: now + 0.09,
      duration: 0.17,
      gain: 0.045,
      type: 'triangle',
    })
    playTone(context, {
      frequency: 1318,
      startTime: now + 0.19,
      duration: 0.22,
      gain: 0.039,
      type: 'triangle',
    })
  } catch {
    // Audio feedback is decorative; never block the game flow.
  }
}

function getUiAudioContext(
  AudioContextCtor: typeof AudioContext,
): AudioContext {
  const audioWindow = window as AudioWindow

  if (!audioWindow.turtleSoupAudioContext) {
    audioWindow.turtleSoupAudioContext = new AudioContextCtor()
  }

  const context = audioWindow.turtleSoupAudioContext

  if (context.state === 'suspended') {
    void context.resume()
  }

  return context
}

function playTone(
  context: AudioContext,
  {
    duration,
    frequency,
    gain,
    startTime,
    type,
  }: {
    duration: number
    frequency: number
    gain: number
    startTime: number
    type: OscillatorType
  },
) {
  const oscillator = context.createOscillator()
  const envelope = context.createGain()
  const filter = context.createBiquadFilter()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(
    frequency * 1.08,
    startTime + duration,
  )
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2400, startTime)
  envelope.gain.setValueAtTime(0.0001, startTime)
  envelope.gain.exponentialRampToValueAtTime(
    gain * UI_SOUND_GAIN_MULTIPLIER,
    startTime + 0.015,
  )
  envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscillator.connect(filter)
  filter.connect(envelope)
  envelope.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.03)
}

