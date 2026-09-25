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
          fax: trap.current?.value ?? '',
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

  const honeypot = (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}
    >
      <label>
        Fax
        <input ref={trap} type="text" name="fax" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  )

  return { send, status, setStatus, honeypot }
}
