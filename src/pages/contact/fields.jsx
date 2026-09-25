import { useId, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, FileText, House, Plus, X } from 'lucide-react'
import { styles as styleOptions } from './options.js'
import css from './fields.module.css'

/*
 * The project setup's controls, one per kind of question:
 *
 *   ChoiceCards   the project type: big cards
 *   Segmented     2–4 short, exclusive answers
 *   OptionCards   answers that need an icon and a line of explanation;
 *                 `compact` for many short ones (tiles). Single or multiple.
 *   SwitchList    on/off features, like a settings screen
 *   Select        a longer list with one answer
 *   BudgetSlider  ordered ranges, with "not sure"
 *   StylePicker   type specimens, each in its own face
 *   PageList      a sitemap you build
 *   ColorField, LinkList, CheckCard
 *   Tabs          groups of the above, one on show at a time
 *
 * Every choice is a real radio, checkbox or select, so keyboard and screen
 * readers get native behaviour. Options are strings or { value, Icon, text }.
 */

const cx = (...c) => c.filter(Boolean).join(' ')
const norm = (o) => (typeof o === 'string' ? { value: o } : o)

function Group({ legend, hint, error, children, className }) {
  return (
    <fieldset className={cx(css.fieldset, className)}>
      <legend className={css.legend}>{legend}</legend>
      {hint && <p className={css.hint}>{hint}</p>}
      {children}
      {error && (
        <p className={css.error} data-error>
          {error}
        </p>
      )}
    </fieldset>
  )
}

/** Big single-choice cards, with an icon, title and one line each. */
export function ChoiceCards({ name, options, value, onChange, label }) {
  return (
    <div className={css.choiceGrid} role="radiogroup" aria-label={label}>
      {options.map(({ value: v, Icon, title, text }) => (
        <label key={v} className={cx(css.choice, value === v && css.choiceOn)}>
          <input className={css.hiddenInput} type="radio" name={name} checked={value === v} onChange={() => onChange(v)} />
          <span className={css.choiceIcon}>
            <Icon size={22} aria-hidden="true" />
          </span>
          <span className={css.choiceTitle}>{title}</span>
          <span className={css.choiceText}>{text}</span>
          <span className={css.choiceMark} aria-hidden="true">
            <Check size={14} strokeWidth={3} />
          </span>
        </label>
      ))}
    </div>
  )
}

/** A row of 2–4 exclusive answers, like a toggle switch with more positions. */
export function Segmented({ legend, hint, options, value, onChange, error }) {
  const name = useId()
  return (
    <Group legend={legend} hint={hint} error={error}>
      <div className={cx(css.segmented, options.length > 3 && css.segmentedFour)} style={{ '--count': options.length }}>
        {options.map((option) => (
          <label key={option} className={cx(css.segment, value === option && css.segmentOn)}>
            <input className={css.hiddenInput} type="radio" name={name} checked={value === option} onChange={() => onChange(option)} />
            {option}
          </label>
        ))}
      </div>
    </Group>
  )
}

/**
 * Cards with an icon and, unless `compact`, a line of explanation. `multiple`
 * picks any number (value is an array). `other` adds a free-text answer for
 * anything not listed: { value, onChange, placeholder }.
 */
export function OptionCards({ legend, hint, options, value, onChange, multiple = false, compact = false, other, error }) {
  const name = useId()
  const selected = multiple ? value : [value]
  const toggle = (v) => {
    if (!multiple) return onChange(v)
    const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]
    // Keep the listed order, not the order they were clicked
    onChange(options.map((o) => norm(o).value).filter((x) => next.includes(x)))
  }

  return (
    <Group legend={legend} hint={hint} error={error}>
      <div className={compact ? css.tiles : css.options}>
        {options.map(norm).map(({ value: v, Icon, text }) => {
          const on = selected.includes(v)
          return (
            <label key={v} className={cx(compact ? css.tile : css.option, on && css.optionOn)}>
              <input
                className={css.hiddenInput}
                type={multiple ? 'checkbox' : 'radio'}
                name={name}
                checked={on}
                onChange={() => toggle(v)}
              />
              {Icon && (
                <span className={css.optionIcon}>
                  <Icon size={compact ? 17 : 19} aria-hidden="true" />
                </span>
              )}
              <span className={css.optionBody}>
                <span className={css.optionTitle}>{v}</span>
                {!compact && text && <span className={css.optionText}>{text}</span>}
              </span>
              <span className={cx(css.optionMark, multiple && css.optionMarkSquare)} aria-hidden="true">
                {on && <Check size={12} strokeWidth={3.5} />}
              </span>
            </label>
          )
        })}
      </div>
      {other && (
        <input
          className={cx(css.textInput, css.otherInput)}
          value={other.value}
          placeholder={other.placeholder ?? 'Something else? Type it here'}
          aria-label={`${legend}: something else`}
          maxLength={200}
          onChange={(e) => other.onChange(e.target.value)}
        />
      )}
    </Group>
  )
}

/** On/off rows with an icon and a line each: for features and add-ons. */
export function SwitchList({ legend, hint, options, value, onChange }) {
  const toggle = (v) =>
    onChange(options.map((o) => o.value).filter((x) => (x === v ? !value.includes(v) : value.includes(x))))
  return (
    <Group legend={legend} hint={hint}>
      <div className={css.switches}>
        {options.map(({ value: v, Icon, text }) => {
          const on = value.includes(v)
          return (
            <label key={v} className={cx(css.switchRow, on && css.switchRowOn)}>
              <span className={css.switchIcon}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className={css.optionBody}>
                <span className={css.optionTitle}>{v}</span>
                <span className={css.optionText}>{text}</span>
              </span>
              <input className={css.hiddenInput} type="checkbox" role="switch" checked={on} onChange={() => toggle(v)} />
              <span className={css.switch} aria-hidden="true" />
            </label>
          )
        })}
      </div>
    </Group>
  )
}

/** A native select, styled like the other fields. */
export function Select({ label, hint, options, value, onChange, placeholder = 'Choose…' }) {
  const id = useId()
  return (
    <div className={css.fieldset}>
      <label htmlFor={id} className={css.legend}>
        {label}
      </label>
      {hint && <p className={css.hint}>{hint}</p>}
      <span className={css.selectWrap}>
        <select id={id} className={cx(css.textInput, css.select, !value && css.selectEmpty)} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown size={17} className={css.selectChevron} aria-hidden="true" />
      </span>
    </div>
  )
}

const NOT_SURE = 'Not sure yet'

/**
 * Ordered ranges on a stepped slider. Untouched, it holds no answer (it's
 * optional); "Not sure yet" is an answer of its own.
 */
export function BudgetSlider({ legend, hint, stops, value, onChange }) {
  const id = useId()
  const index = stops.indexOf(value)
  const set = index >= 0
  const unsure = value === NOT_SURE
  const shown = set ? index : Math.floor((stops.length - 1) / 2)

  return (
    <div className={css.fieldset}>
      <div className={css.budgetHead}>
        <label htmlFor={id} className={css.legend}>
          {legend}
        </label>
        <output htmlFor={id} className={cx(css.budgetValue, !set && css.budgetValueEmpty)}>
          {set ? value : unsure ? NOT_SURE : 'Drag to choose'}
        </output>
      </div>
      {hint && <p className={css.hint}>{hint}</p>}
      <input
        id={id}
        type="range"
        className={cx(css.range, !set && css.rangeUnset)}
        min={0}
        max={stops.length - 1}
        step={1}
        value={shown}
        disabled={unsure}
        aria-valuetext={set ? value : 'Not chosen'}
        style={{ '--fill': `${(shown / (stops.length - 1)) * 100}%` }}
        onChange={(e) => onChange(stops[Number(e.target.value)])}
        // A click on the thumb where it already rests still counts as choosing it
        onPointerUp={(e) => !set && onChange(stops[Number(e.currentTarget.value)])}
      />
      <div className={css.rangeLabels} aria-hidden="true">
        {stops.map((s, i) => (
          <span key={s} className={i === index ? css.rangeLabelOn : undefined}>
            {s}
          </span>
        ))}
      </div>
      <label className={css.inlineCheck}>
        <input type="checkbox" checked={unsure} onChange={(e) => onChange(e.target.checked ? NOT_SURE : '')} />
        Not sure yet
      </label>
    </div>
  )
}

/** Style as type specimens: each card set in the face it stands for. */
export function StylePicker({ legend, hint, value, onChange }) {
  const name = useId()
  return (
    <Group legend={legend} hint={hint}>
      <div className={css.specimens}>
        {styleOptions.map((s) => (
          <label key={s.value} className={cx(css.specimen, value === s.value && css.optionOn)}>
            <input
              className={css.hiddenInput}
              type="radio"
              name={name}
              checked={value === s.value}
              onChange={() => onChange(s.value)}
            />
            <span
              className={css.specimenSample}
              style={{ fontFamily: s.font, fontWeight: s.weight, fontStyle: s.italic ? 'italic' : undefined }}
              aria-hidden="true"
            >
              Aa
            </span>
            <span className={css.optionTitle}>{s.value}</span>
            <span className={css.optionText}>{s.text}</span>
          </label>
        ))}
      </div>
    </Group>
  )
}

/** The site's pages as a list you build: Home is always there, the rest added from suggestions or typed. */
export function PageList({ legend, hint, value, onChange, suggestions }) {
  const [draft, setDraft] = useState('')
  const has = (p) => value.some((v) => v.toLowerCase() === p.toLowerCase())
  const add = (p) => {
    const page = p.trim()
    if (page && !has(page) && page.toLowerCase() !== 'home') onChange([...value, page])
  }

  return (
    <Group legend={legend} hint={hint}>
      <ol className={css.pages}>
        <li className={css.page}>
          <House size={16} className={css.pageIcon} aria-hidden="true" />
          Home
          <span className={css.pageNote}>Always included</span>
        </li>
        {value.map((p) => (
          <li key={p} className={css.page}>
            <FileText size={16} className={css.pageIcon} aria-hidden="true" />
            {p}
            <button type="button" className={css.iconButton} onClick={() => onChange(value.filter((v) => v !== p))} aria-label={`Remove ${p}`}>
              <X size={15} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      <div className={css.pageAdd}>
        <input
          className={css.textInput}
          value={draft}
          placeholder="Add a page"
          aria-label="Add a page"
          maxLength={40}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(draft)
              setDraft('')
            }
          }}
        />
        <button
          type="button"
          className={css.addButton}
          disabled={!draft.trim()}
          onClick={() => {
            add(draft)
            setDraft('')
          }}
        >
          <Plus size={16} aria-hidden="true" /> Add
        </button>
      </div>
      {suggestions.some((s) => !has(s)) && (
        <div className={css.suggestions}>
          <span className={css.suggestionsLabel}>Common:</span>
          {suggestions
            .filter((s) => !has(s))
            .map((s) => (
              <button key={s} type="button" className={css.suggestion} onClick={() => add(s)}>
                <Plus size={13} aria-hidden="true" />
                {s}
              </button>
            ))}
        </div>
      )}
    </Group>
  )
}

const HEX = /^#[0-9a-f]{6}$/i

/** A colour swatch (the native picker) next to its hex code, which can be typed too. */
export function ColorField({ label, value, onChange, onRemove }) {
  const id = useId()
  const [text, setText] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  // Picking from the swatch updates the text box
  if (value !== lastValue) {
    setLastValue(value)
    setText(value)
  }

  return (
    <div className={css.color}>
      <label className={cx(css.swatch, !value && css.swatchEmpty)} style={{ background: value || undefined }}>
        {!value && <Plus size={16} aria-hidden="true" />}
        <input
          className={css.hiddenInput}
          type="color"
          // The picker needs a colour to open on; nothing is chosen until they pick
          value={value || '#8a8f98'}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} colour picker`}
        />
      </label>
      <div className={css.colorText}>
        <label htmlFor={id} className={css.colorLabel}>
          {label}
        </label>
        <input
          id={id}
          className={css.colorHex}
          value={text}
          placeholder="Choose"
          spellCheck={false}
          maxLength={7}
          onChange={(e) => {
            const raw = e.target.value
            const next = !raw || raw.startsWith('#') ? raw : `#${raw}`
            setText(next)
            if (HEX.test(next)) onChange(next.toLowerCase())
          }}
          onBlur={() => setText(value)}
        />
      </div>
      {onRemove && (
        <button type="button" className={css.iconButton} onClick={onRemove} aria-label={`Remove ${label}`}>
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/** A growing list of links, one input each. */
export function LinkList({ label, hint, value, onChange, placeholder = 'https://' }) {
  const rows = value.length ? value : ['']
  const set = (i, v) => onChange(rows.map((r, j) => (j === i ? v : r)))

  return (
    <Group legend={label} hint={hint}>
      <div className={css.links}>
        {rows.map((row, i) => (
          <div key={i} className={css.linkRow}>
            <input
              className={css.textInput}
              type="url"
              inputMode="url"
              value={row}
              placeholder={placeholder}
              aria-label={`${label} ${i + 1}`}
              onChange={(e) => set(i, e.target.value)}
            />
            {rows.length > 1 && (
              <button
                type="button"
                className={css.iconButton}
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
                aria-label={`Remove link ${i + 1}`}
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>
      {rows.length < 6 && (
        <button type="button" className={css.textButton} onClick={() => onChange([...rows, ''])}>
          <Plus size={15} aria-hidden="true" /> Add another link
        </button>
      )}
    </Group>
  )
}

/** One checkbox as a full-width card: for a choice that changes what happens next. */
export function CheckCard({ checked, onChange, title, text, Icon }) {
  return (
    <label className={cx(css.checkCard, checked && css.checkCardOn)}>
      <input className={css.hiddenInput} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={css.box} aria-hidden="true">
        {checked && <Check size={15} strokeWidth={3} />}
      </span>
      <span className={css.checkCardBody}>
        <span className={css.checkCardTitle}>
          {Icon && <Icon size={17} aria-hidden="true" />}
          {title}
        </span>
        <span className={css.checkCardText}>{text}</span>
      </span>
    </label>
  )
}

/**
 * Tabs over a set of panels, so a long group of questions shows one part at a
 * time. `filled[id]` puts a count (a number) or a check (true) on a tab once
 * something in it is answered. Arrow keys, Home and End move between tabs.
 */
export function Tabs({ label, tabs, filled = {}, panels }) {
  const base = useId()
  const [active, setActive] = useState(tabs[0].id)
  const tabRefs = useRef({})
  const index = tabs.findIndex((t) => t.id === active)
  const next = tabs[index + 1]

  const select = (id, focus = false) => {
    setActive(id)
    const tab = tabRefs.current[id]
    if (focus) tab?.focus({ preventScroll: true })
    // On a phone the tab bar scrolls sideways: bring the chosen tab into it, without moving the page
    const list = tab?.parentElement
    if (list && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' })
    }
  }

  const onKeyDown = (e) => {
    const to = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[e.key]
    if (to === undefined) return
    e.preventDefault()
    select(tabs[to].id, true)
  }

  return (
    <div className={css.tabs}>
      <div role="tablist" aria-label={label} className={css.tabList} onKeyDown={onKeyDown}>
        {tabs.map((t) => {
          const on = t.id === active
          const mark = filled[t.id]
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el
              }}
              type="button"
              role="tab"
              id={`${base}-${t.id}`}
              aria-selected={on}
              aria-controls={`${base}-panel`}
              tabIndex={on ? 0 : -1}
              className={cx(css.tab, on && css.tabOn)}
              onClick={() => select(t.id)}
            >
              {t.title}
              {mark ? (
                <span className={css.tabMark} aria-label={mark === true ? '(filled in)' : `(${mark})`}>
                  {mark === true ? <Check size={11} strokeWidth={3.5} aria-hidden="true" /> : mark}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <div key={active} role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-${active}`} className={css.tabPanel}>
        {panels[active]}
        {next && (
          <button type="button" className={css.nextTab} onClick={() => select(next.id, true)}>
            Next: {next.title} <ArrowRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
