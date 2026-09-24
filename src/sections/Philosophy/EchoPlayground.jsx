import { useRef, useState } from 'react'
import { Button } from '../../components'
import AiLogo from '../../components/AiLogo/AiLogo.jsx'
import useInView from '../../hooks/useInView.js'
import styles from './EchoPlayground.module.css'

const states = [
  { id: 'greeting', label: 'Wave' },
  { id: 'thinking', label: 'Think' },
  { id: 'typing', label: 'Type' },
  { id: 'finished', label: 'Finish' },
  { id: 'sleeping', label: 'Sleep' },
  { id: 'idle', label: 'Idle' },
]

/** The live Echo logo, with buttons to put it through its states. */
export default function EchoPlayground({ size = 150 }) {
  const [state, setState] = useState('greeting')
  const logoRef = useRef(null)
  // Mounting into `greeting` plays the wave, so hold off until it's really on screen
  const onScreen = useInView(logoRef, { threshold: 0.6 })

  return (
    <div className={styles.playground}>
      <div ref={logoRef} className={styles.logo}>
        {onScreen ? (
          <AiLogo
          state={state}
          size={size}
          followCursor
          title="Echo AI logo, animated"
          // Wave and Finish are one-shots; settle back to idle when they end
          onFinished={() => setState('idle')}
          />
        ) : (
          <div style={{ width: size, height: size }} />
        )}
      </div>
      <div className={styles.controls} role="group" aria-label="Echo animation">
        {states.map((s) => (
          <Button
            key={s.id}
            size="s"
            variant={state === s.id ? 'secondary' : 'ghost'}
            aria-pressed={state === s.id}
            onClick={() => setState(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
