import { useEffect, useRef, useState } from 'react'

/**
 * Sends a form to /api/contact (see api/contact.js).
 * `status` is 'idle' | 'sending' | 'sent' | 'error'. Render `honeypot` inside
 * the form: hidden from people, but bots fill it in and get silently dropped.
 */
export default function useFormSender(type) {
  const [status, setStatus] = useState('idle')
  const openedAt = useRef(0)
  const trap = useRef(null)

  // When the form appeared, so the server can drop submissions no person could type that fast
  useEffect(() => {
    openedAt.current = Date.now()
  }, [])

  const send = async (data) => {
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type,
          trap: trap.current?.value ?? '',
          elapsed: Date.now() - openedAt.current,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('sent')
      return true
    } catch {
      setStatus('error')
      return false
    }
  }

  // Not rendered at all (display: none), with a name and no label that browser
  // autofill can't place: an off-screen field called "fax" was being filled in
  // by autofill, which silently dropped real people's requests as spam.
  // Bots that fill every input in the markup still fall for it.
  const honeypot = (
    <div aria-hidden="true" style={{ display: 'none' }}>
      <input ref={trap} type="text" name="hp_ref_x7" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  )

  return { send, status, setStatus, honeypot }
}
