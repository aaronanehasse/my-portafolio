import { useRef, useState } from 'react'
import { Button } from '../../components'
import AiLogo from '../../components/AiLogo/AiLogo.jsx'
import useInView from '../../hooks/useInView.js'
import { useT } from '../../i18n/index.jsx'
import styles from './EchoPlayground.module.css'

// The buttons' words are in the language files (echo.states)
const states = ['greeting', 'thinking', 'typing', 'finished', 'sleeping', 'idle']

/** The live Echo logo, with buttons to put it through its states. */
export default function EchoPlayground({ size = 150 }) {
  const { t } = useT()
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
          title={t('echo.logo')}
          // Wave and Finish are one-shots; settle back to idle when they end
          onFinished={() => setState('idle')}
          />
        ) : (
          <div style={{ width: size, height: size }} />
        )}
      </div>
      <div className={styles.controls} role="group" aria-label={t('echo.controls')}>
        {states.map((id) => (
          <Button
            key={id}
            size="s"
            variant={state === id ? 'secondary' : 'ghost'}
            aria-pressed={state === id}
            onClick={() => setState(id)}
          >
            {t(`echo.states.${id}`)}
          </Button>
        ))}
      </div>
    </div>
  )
}
