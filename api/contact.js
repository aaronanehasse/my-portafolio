/**
 * POST /api/contact — Vercel serverless function behind /contact.
 *
 * Takes a project request, checks it again (anyone can call this directly),
 * emails it to you through Resend with Reply-To set to the visitor, then sends
 * the visitor a copy as an auto-reply. Plain-text emails only, so nothing a
 * visitor types can turn into HTML.
 *
 * The request carries its answers as `sections` — titled lists of label/value
 * rows, built by src/pages/contact/summary.js — so the email matches the review
 * step exactly. This checks their shape and size rather than each field.
 *
 * Environment (Vercel → Project → Settings → Environment Variables):
 *   RESEND_API_KEY  required — from resend.com
 *   CONTACT_TO      required — the inbox requests go to
 *   CONTACT_FROM    optional — sender, default 'Aaron Anehasse <hello@aaronanehasse.space>'.
 *                   Must be on a domain verified in Resend; before that, use
 *                   'onboarding@resend.dev' (which can only send to your own
 *                   address, so the auto-reply is skipped).
 *   AUTO_REPLY      optional — set to 'off' to stop replying to visitors
 *
 * Runs on Vercel or under `vercel dev`; plain `npm run dev` doesn't serve /api.
 *
 * The visitor's answers arrive already in their language (`lang`); the
 * auto-reply is written in it too, from REPLIES below. A language the site
 * gains later gets English replies until it's added here.
 */

const DEFAULT_FROM = 'Aaron Anehasse <hello@aaronanehasse.space>'
const MIN_FILL_MS = 3000 // faster than a person can fill the form in: a bot

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const KINDS = { website: 'Website', components: 'Components', mobile: 'Mobile app', other: 'Other' }

// Limits on the free-form answers
const MAX_SECTIONS = 6
const MAX_ROWS = 40
const MAX_TOTAL = 30000 // characters across every value

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const oneLine = (v, max) => str(v, max).replace(/[\r\n]+/g, ' ')
const firstName = (name) => name.split(/\s+/)[0]

// The auto-reply, per language. `preview` / `quote` is what happens next.
const REPLIES = {
  en: {
    subject: (title) => `Got your request: ${title}`,
    hi: (name) => `Hi ${name},`,
    thanks: (title) => `Thanks for reaching out about “${title}”.`,
    preview:
      'I’ll look over your request, and once I accept it you’ll get a free preview of a few sections, usually within a few hours. No commitment: if it’s not for you, you don’t pay anything.',
    quote: 'I’ll look over your request and reply with next steps and a quote, usually within a couple of days.',
    copy: '— What you sent —',
  },
  nl: {
    subject: (title) => `Je aanvraag is binnen: ${title}`,
    hi: (name) => `Hoi ${name},`,
    thanks: (title) => `Bedankt voor je bericht over “${title}”.`,
    preview:
      'Ik bekijk je aanvraag, en zodra ik hem accepteer krijg je een gratis preview van een paar secties, meestal binnen een paar uur. Geen verplichtingen: is het niets voor jou, dan betaal je niets.',
    quote: 'Ik bekijk je aanvraag en reageer met de volgende stappen en een offerte, meestal binnen een paar dagen.',
    copy: '— Wat je hebt gestuurd —',
  },
}

/** The request, cleaned, or a reason to refuse it. */
function parse(body) {
  const kind = KINDS[body.kind] ? body.kind : null
  const title = oneLine(body.title, 120)
  const name = oneLine(body.name, 100)
  const email = oneLine(body.email, 200)
  if (!kind || !title || !name || !EMAIL.test(email)) return { error: 'Missing or invalid fields.' }

  if (!Array.isArray(body.sections) || !body.sections.length || body.sections.length > MAX_SECTIONS) {
    return { error: 'Invalid answers.' }
  }
  let total = 0
  const sections = []
  for (const section of body.sections) {
    if (!section || !Array.isArray(section.rows) || section.rows.length > MAX_ROWS) return { error: 'Invalid answers.' }
    const rows = []
    for (const row of section.rows) {
      const label = oneLine(row?.label, 60)
      const value = str(row?.value, 5000)
      if (!label || !value) continue
      total += value.length
      rows.push({ label, value })
    }
    if (rows.length) sections.push({ title: oneLine(section.title, 40) || 'Details', rows })
  }
  if (!sections.length || total > MAX_TOTAL) return { error: 'Invalid answers.' }

  const lang = REPLIES[body.lang] ? body.lang : 'en'
  return { kind, title, name, email, lang, preview: body.preview === true && kind === 'website', sections }
}

/** Sections as plain text: a heading each, then "Label: value" (multi-line values below their label). */
function render(sections) {
  return sections
    .map(({ title, rows }) => {
      const lines = rows.map(({ label, value }) => (value.includes('\n') ? `${label}:\n${value}` : `${label}: ${value}`))
      return `${title.toUpperCase()}\n${lines.join('\n')}`
    })
    .join('\n\n')
}

async function sendEmail(message) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })
  if (!res.ok) {
    const body = await res.text()
    const err = new Error(`Resend ${res.status}: ${body}`)
    // Resend's own one-line reason ("The domain is not verified…"), safe to show:
    // it describes the setup, never the key
    try {
      err.reason = `${res.status}: ${JSON.parse(body).message}`
    } catch {
      err.reason = `${res.status}`
    }
    throw err
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const { RESEND_API_KEY, CONTACT_TO } = process.env
  if (!RESEND_API_KEY || !CONTACT_TO) {
    console.error('contact: RESEND_API_KEY or CONTACT_TO is not set')
    return res.status(500).json({ error: 'The form isn’t set up yet.' })
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {}
  if (body.type !== 'project') return res.status(400).json({ error: 'Unknown form.' })

  // Spam: the hidden field is filled, or it came back too fast. Answer as if it
  // worked, so the bot has nothing to learn from.
  // Logged, so a real person caught by mistake shows up in the Vercel logs
  // instead of vanishing.
  const trapped = Boolean(body.trap || body.fax)
  const tooFast = Number(body.elapsed) < MIN_FILL_MS
  if (trapped || tooFast) {
    console.warn('contact: dropped as spam', { trapped, elapsed: body.elapsed })
    return res.status(200).json({ ok: true })
  }

  const request = parse(body)
  if (request.error) return res.status(400).json({ error: request.error })
  const { kind, title, name, email, lang, preview, sections } = request

  const from = process.env.CONTACT_FROM || DEFAULT_FROM
  const answers = render(sections)

  try {
    await sendEmail({
      from,
      to: CONTACT_TO,
      reply_to: email,
      subject: `${preview ? 'Free preview' : `New ${KINDS[kind].toLowerCase()} request`}: ${title}`,
      text: `${name} <${email}> started a ${KINDS[kind].toLowerCase()} project${preview ? ' and wants a free preview first' : ''}. Written in ${lang.toUpperCase()}.\n\n${answers}`,
    })
  } catch (err) {
    console.error('contact: sending to you failed', err)
    return res.status(502).json({ error: 'Couldn’t send right now.', reason: err.reason })
  }

  // The auto-reply is a courtesy: if it fails, the request still arrived.
  // Resend's test sender can only mail your own address, so skip it there.
  if (process.env.AUTO_REPLY !== 'off' && !from.includes('@resend.dev')) {
    const r = REPLIES[lang]
    try {
      await sendEmail({
        from,
        to: email,
        reply_to: CONTACT_TO,
        subject: r.subject(title),
        text: [r.hi(firstName(name)), '', `${r.thanks(title)} ${preview ? r.preview : r.quote}`, '', 'Aaron', '', r.copy, '', answers].join('\n'),
      })
    } catch (err) {
      console.error('contact: auto-reply failed', err)
    }
  }

  return res.status(200).json({ ok: true })
}
