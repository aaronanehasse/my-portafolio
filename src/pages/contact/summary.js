import { kindByValue } from './options.js'

/*
 * The answers as titled sections of label/value rows, empty ones left out.
 * The review step shows exactly this, and it's what gets emailed, so what the
 * visitor checks is what you receive.
 */

const list = (v) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : v)
const links = (v) => v.map((l) => l.trim()).filter(Boolean).join('\n')
// A list plus its free-text "something else"
const withOther = (v, other) => list([...v, other.trim()])

function rows(pairs) {
  return pairs.filter(([, value]) => value).map(([label, value]) => ({ label, value }))
}

function websiteRows(w) {
  return [
    ['Business', w.business],
    ['Current website', w.current],
    ['Free preview', w.preview ? 'Yes, a preview of a few sections before a price' : 'No, straight to a quote'],
    ['Theme', w.theme],
    ['Pages', w.pages.length > 0 && list(['Home', ...w.pages])],
    ['Features', list(w.features)],
    ['Primary colour', w.colors.primary],
    ['Secondary colour', w.colors.secondary],
    ['Accent colour', w.colors.accent],
    ['Style', w.style],
    ['Logo', w.logo],
    ['Text', w.text],
    ['Photos', w.photos],
    ['Sites they like', links(w.references)],
    ['Domain & hosting', list(w.care)],
  ]
}

function componentRows(c) {
  return [
    ['Component types', withOther(c.types, c.typesOther)],
    ['Stack', withOther(c.stacks, c.stackOther)],
    ['Styling', c.styling],
    ['Language', c.language],
    ['Design', c.design],
    ['Scope', c.scope],
    ['Designs or examples', links(c.references)],
  ]
}

function mobileRows(m) {
  return [
    ['Platforms', m.platform],
    ['Stage', m.stage],
    ['Features', list(m.features)],
    ['Design', m.design],
    ['Backend', m.backend],
    ['Also needs', list(m.extras)],
  ]
}

const detailRows = {
  website: (s) => websiteRows(s.website),
  components: (s) => componentRows(s.components),
  mobile: (s) => mobileRows(s.mobile),
  other: (s) => [['Links', links(s.other.links)]],
}

/** `step` on each section is the step index its Edit button returns to. */
export function summarize(s) {
  return [
    {
      step: 1,
      title: 'Project',
      rows: rows([
        ['Type', kindByValue[s.kind]?.title],
        ['Title', s.title],
        ['Description', s.description],
      ]),
    },
    {
      step: 2,
      title: 'Details',
      rows: rows([...(detailRows[s.kind]?.(s) ?? []), ['Timeline', s.timeline], ['Budget', s.budget]]),
    },
    {
      step: 3,
      title: 'You',
      rows: rows([
        ['Name', s.name],
        ['Email', s.email],
        ['Company', s.company],
      ]),
    },
  ].filter((section) => section.rows.length)
}
