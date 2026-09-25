import { labelOf } from './options.js'

/*
 * The answers as titled sections of label/value rows, empty ones left out,
 * in the visitor's language (`t` from useT). The review step shows exactly
 * this, and it's what gets emailed, so what the visitor checks is what you
 * receive.
 */

const list = (v) => v.filter(Boolean).join(', ')
const links = (v) => v.map((l) => l.trim()).filter(Boolean).join('\n')

function rows(pairs) {
  return pairs.filter(([, value]) => value).map(([label, value]) => ({ label, value }))
}

export function summarize(s, t) {
  const L = (key) => t(`contact.summary.${key}`)
  // One stored id, or a list of them, in words
  const one = (group, id) => (id ? labelOf(t, group, id) : '')
  const many = (group, ids) => list(ids.map((id) => labelOf(t, group, id)))

  const detailRows = {
    website: () => {
      const w = s.website
      return [
        [L('business'), w.business],
        [L('current'), w.current],
        [L('preview'), w.preview ? L('previewYes') : L('previewNo')],
        [L('theme'), one('theme', w.theme)],
        [L('pages'), w.pages.length > 0 && list([t('contact.field.home'), ...w.pages])],
        [L('features'), many('features', w.features)],
        [L('primary'), w.colors.primary],
        [L('secondary'), w.colors.secondary],
        [L('accent'), w.colors.accent],
        [L('style'), one('styles', w.style)],
        [L('logo'), one('logo', w.logo)],
        [L('text'), one('text', w.text)],
        [L('photos'), one('photos', w.photos)],
        [L('references'), links(w.references)],
        [L('care'), many('care', w.care)],
      ]
    },
    components: () => {
      const c = s.components
      return [
        [L('types'), list([...c.types.map((id) => labelOf(t, 'componentTypes', id)), c.typesOther.trim()])],
        // Stacks are framework names: their own labels
        [L('stack'), list([...c.stacks, c.stackOther.trim()])],
        [L('styling'), one('styling', c.styling)],
        [L('language'), one('codeLanguage', c.language)],
        [L('design'), one('componentDesign', c.design)],
        [L('scope'), one('scope', c.scope)],
        [L('examples'), links(c.references)],
      ]
    },
    mobile: () => {
      const m = s.mobile
      return [
        [L('platforms'), one('platforms', m.platform)],
        [L('stage'), one('stage', m.stage)],
        [L('appFeatures'), many('appFeatures', m.features)],
        [L('design'), one('appDesign', m.design)],
        [L('backend'), one('backend', m.backend)],
        [L('extras'), many('extras', m.extras)],
      ]
    },
    other: () => [[L('links'), links(s.other.links)]],
  }

  return [
    {
      step: 1,
      title: L('project'),
      rows: rows([
        [L('type'), one('kinds', s.kind)],
        [L('title'), s.title],
        [L('description'), s.description],
      ]),
    },
    {
      step: 2,
      title: L('details'),
      rows: rows([...(detailRows[s.kind]?.() ?? []), [L('timeline'), one('timelines', s.timeline)], [L('budget'), one('budgets', s.budget)]]),
    },
    {
      step: 3,
      title: L('you'),
      rows: rows([
        [L('name'), s.name],
        [L('email'), s.email],
        [L('company'), s.company],
      ]),
    },
  ].filter((section) => section.rows.length)
}
