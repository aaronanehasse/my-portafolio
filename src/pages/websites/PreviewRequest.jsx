import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button, Card, Input } from '../../components'
import styles from './PreviewRequest.module.css'

/*
 * The free-preview request form.
 * NOTE: like the contact form, this only validates and confirms on screen —
 * it isn't connected to anything that sends the request yet.
 */

const empty = { name: '', email: '', business: '', goal: '', site: '' }

const promises = [
  'A real preview with 2–3 sections, made within a few hours of accepting',
  'No commitment: if it’s not for you, you don’t pay anything',
  'If you like it, we carry on and build the full site',
]

export default function PreviewRequest() {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setErrors({ ...errors, [field]: undefined })
  }

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Please enter a valid email.'
    if (!form.business.trim()) next.business = 'What’s the business called?'
    if (!form.goal.trim()) next.goal = 'A sentence or two is enough.'
    setErrors(next)
    if (Object.keys(next).length === 0) setSent(true)
  }

  return (
    <section className={styles.request} aria-labelledby="request-title">
      <div className={styles.side}>
        <h2 id="request-title" className={styles.title}>
          Request your free preview
        </h2>
        <p className={styles.intro}>
          Tell me a little about your business. Once I accept the request, I’ll make you a preview within a few
          hours.
        </p>
        <ul className={styles.promises}>
          {promises.map((p) => (
            <li key={p}>
              <Check className={styles.check} size={18} strokeWidth={2.5} aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <Card className={styles.card}>
        {sent ? (
          <div className={styles.done} role="status">
            <span className={styles.doneIcon}>
              <Check size={22} strokeWidth={3} />
            </span>
            <h3 className={styles.doneTitle}>Request received</h3>
            <p className={styles.intro}>
              Thanks, {form.name.split(' ')[0]}. I’ll look at it and get back to you at {form.email}.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setForm(empty)
                setSent(false)
              }}
            >
              Send another request
            </Button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit} noValidate>
            <div className={styles.row}>
              <Input label="Your name" placeholder="Jane Doe" value={form.name} onChange={update('name')} error={errors.name} />
              <Input
                label="Email"
                type="email"
                placeholder="jane@business.com"
                value={form.email}
                onChange={update('email')}
                error={errors.email}
              />
            </div>
            <Input
              label="Business"
              placeholder="Northfield Coffee"
              value={form.business}
              onChange={update('business')}
              error={errors.business}
            />
            <Input
              label="What should the website do?"
              multiline
              placeholder="Show our menu, take online orders, tell people where to find us…"
              value={form.goal}
              onChange={update('goal')}
              error={errors.goal}
            />
            <Input
              label="Current website (optional)"
              placeholder="https://"
              value={form.site}
              onChange={update('site')}
            />
            <div className={styles.actions}>
              <Button type="submit" size="l">
                Request free preview
              </Button>
              <span className={styles.fine}>Free. No card, no commitment.</span>
            </div>
          </form>
        )}
      </Card>
    </section>
  )
}
