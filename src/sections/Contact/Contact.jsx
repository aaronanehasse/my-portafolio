import { useState } from 'react'
import { Button, Card, Input } from '../../components'
import styles from './Contact.module.css'

const empty = { name: '', email: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setErrors({ ...errors, [field]: undefined })
    setSent(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Please enter a valid email.'
    if (!form.message.trim()) next.message = 'Please write a message.'
    setErrors(next)
    if (Object.keys(next).length === 0) {
      setSent(true)
      setForm(empty)
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Contact</h2>
      <Card>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <Input
              label="Name"
              placeholder="Jane Doe"
              value={form.name}
              onChange={update('name')}
              error={errors.name}
            />
            <Input
              label="Email"
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={update('email')}
              error={errors.email}
            />
          </div>
          <Input
            label="Message"
            multiline
            placeholder="Tell me about your project…"
            value={form.message}
            onChange={update('message')}
            error={errors.message}
            hint="I usually reply within a couple of days."
          />
          <div className={styles.formActions}>
            <Button type="submit">Send message</Button>
            <Button
              variant="danger"
              onClick={() => {
                setForm(empty)
                setErrors({})
                setSent(false)
              }}
            >
              Clear
            </Button>
            {sent && (
              <p className={styles.sent} role="status">
                Thanks! Your message is ready to send.
              </p>
            )}
          </div>
        </form>
      </Card>
    </section>
  )
}
