import { Eye, Pencil, Plus } from 'lucide-react'
import { Input } from '../../components'
import {
  BudgetSlider,
  CheckCard,
  ChoiceCards,
  ColorField,
  LinkList,
  OptionCards,
  PageList,
  Segmented,
  Select,
  StylePicker,
  SwitchList,
  Tabs,
} from './fields.jsx'
import * as o from './options.js'
import SitePreview from './SitePreview.jsx'
import { summarize } from './summary.js'
import styles from './ContactPage.module.css'

/*
 * The body of each step. Each gets the whole draft `s`, a `set(patch)` for
 * top-level fields and `setIn(group, patch)` for a kind's own group, plus the
 * current step's `errors`.
 */

/* ---- 1. Type ---- */

export function TypeStep({ s, set }) {
  const choose = (kind) => {
    // A budget picked for another type may not be one of this type's ranges: clear it rather than send it
    const keep = !s.budget || s.budget === 'Not sure yet' || o.budgetsFor(kind).includes(s.budget)
    set(keep ? { kind } : { kind, budget: '' })
  }
  return <ChoiceCards name="kind" label="Project type" options={o.kinds} value={s.kind} onChange={choose} />
}

/* ---- 2. Project ---- */

export function ProjectStep({ s, set, errors }) {
  const copy = o.projectCopy[s.kind] ?? o.projectCopy.other
  return (
    <div className={styles.fields}>
      <Input
        label="Title"
        placeholder={copy.title}
        value={s.title}
        onChange={(e) => set({ title: e.target.value })}
        error={errors.title}
        maxLength={120}
      />
      <Input
        label="Description"
        multiline
        rows={7}
        placeholder={copy.description}
        value={s.description}
        onChange={(e) => set({ description: e.target.value })}
        error={errors.description}
        hint="You’ll add specifics in the next step."
        maxLength={5000}
      />
    </div>
  )
}

/* ---- 3. Details ---- */

export function DetailsStep(props) {
  const { s, set } = props
  const Kind = { website: WebsiteDetails, components: ComponentDetails, mobile: MobileDetails, other: OtherDetails }[s.kind]

  return (
    <div className={styles.fields}>
      {Kind && <Kind {...props} />}
      <div className={styles.divider} />
      <Segmented legend="Timeline" options={o.timelines} value={s.timeline} onChange={(timeline) => set({ timeline })} />
      <BudgetSlider
        legend="Budget"
        hint={
          s.kind === 'website' && s.website.preview
            ? 'Optional. You’ll get an exact price after the free preview.'
            : 'Optional, but it helps me suggest the right scope.'
        }
        stops={o.budgetsFor(s.kind)}
        value={s.budget}
        onChange={(budget) => set({ budget })}
      />
    </div>
  )
}

function WebsiteDetails({ s, setIn, errors }) {
  const w = s.website
  const set = (patch) => setIn('website', patch)
  const setColor = (key) => (value) => set({ colors: { ...w.colors, [key]: value } })
  const clearColor = (key) => (w.colors[key] ? () => setColor(key)('') : undefined)

  // What each tab's label shows once something in it is answered: a count, or a check
  const filled = {
    pages: w.pages.length || null,
    features: w.features.length || null,
    look: Boolean(w.colors.primary || w.colors.secondary || w.style),
    content: Boolean(w.logo || w.text || w.photos || w.references.some((r) => r.trim())),
    hosting: w.care.length || null,
  }

  const panels = {
    pages: (
      <PageList
        legend="Pages"
        hint="What people should be able to find. You can change this later."
        value={w.pages}
        onChange={(pages) => set({ pages })}
        suggestions={o.suggestedPages}
      />
    ),
    features: (
      <SwitchList
        legend="Features"
        hint="What the site should be able to do."
        options={o.websiteFeatures}
        value={w.features}
        onChange={(features) => set({ features })}
      />
    ),
    look: (
      <div className={styles.fields}>
        <fieldset className={styles.plainFieldset}>
          <legend className={styles.blockLegend}>Brand colours</legend>
          <div className={styles.colors}>
            <ColorField label="Primary" value={w.colors.primary} onChange={setColor('primary')} onRemove={clearColor('primary')} />
            <ColorField label="Secondary" value={w.colors.secondary} onChange={setColor('secondary')} onRemove={clearColor('secondary')} />
            {w.colors.accent ? (
              <ColorField label="Accent" value={w.colors.accent} onChange={setColor('accent')} onRemove={clearColor('accent')} />
            ) : (
              <button type="button" className={styles.addColor} onClick={() => setColor('accent')('#ff7a59')}>
                <Plus size={16} aria-hidden="true" /> Accent colour
              </button>
            )}
          </div>
        </fieldset>
        <StylePicker legend="Style" hint="The overall feel. The sketch uses its typeface." value={w.style} onChange={(style) => set({ style })} />
      </div>
    ),
    content: (
      <div className={styles.fields}>
        <Segmented legend="Logo" options={o.logoOptions} value={w.logo} onChange={(logo) => set({ logo })} />
        <div className={styles.row}>
          <Segmented legend="Text for the site" options={o.textOptions} value={w.text} onChange={(text) => set({ text })} />
          <Segmented legend="Photos" options={o.photoOptions} value={w.photos} onChange={(photos) => set({ photos })} />
        </div>
        <LinkList
          label="Sites you like"
          hint="Any site whose look or feel you like, even in another industry."
          value={w.references}
          onChange={(references) => set({ references })}
        />
      </div>
    ),
    hosting: (
      <SwitchList
        legend="I’d like you to handle"
        hint="So you never have to think about it."
        options={o.careOptions}
        value={w.care}
        onChange={(care) => set({ care })}
      />
    ),
  }

  return (
    <>
      <div className={styles.row}>
        <Input
          label="Business name"
          placeholder="Northfield Coffee"
          value={w.business}
          onChange={(e) => set({ business: e.target.value })}
          error={errors.business}
          maxLength={150}
        />
        <Input
          label="Current website (optional)"
          placeholder="https://"
          inputMode="url"
          value={w.current}
          onChange={(e) => set({ current: e.target.value })}
          maxLength={300}
        />
      </div>

      <CheckCard
        Icon={Eye}
        checked={w.preview}
        onChange={(preview) => set({ preview })}
        title="Get a free preview first"
        text="I’ll build 2–3 sections of your site for free before giving you a price. If it’s not for you, you pay nothing."
      />

      <section className={styles.builder} aria-labelledby="builder-title">
        <div className={styles.builderHead}>
          <h3 id="builder-title" className={styles.blocksTitle}>
            Shape your site
          </h3>
          <p className={styles.muted}>Everything here is optional. Fill in what you already know.</p>
        </div>
        <SitePreview {...sketchProps(w)} onTheme={(theme) => set({ theme })} />
        <Tabs label="Site details" tabs={o.websiteTabs} filled={filled} panels={panels} />
      </section>
    </>
  )
}

/** What the sketch needs from the website answers. */
function sketchProps(w) {
  return { business: w.business, pages: w.pages, colors: w.colors, style: w.style, features: w.features, theme: w.theme }
}

function ComponentDetails({ s, setIn, errors }) {
  const c = s.components
  const set = (patch) => setIn('components', patch)
  return (
    <>
      <OptionCards
        legend="What kind of components?"
        hint="Pick all that apply."
        options={o.componentTypes}
        value={c.types}
        onChange={(types) => set({ types })}
        multiple
        compact
        other={{ value: c.typesOther, onChange: (typesOther) => set({ typesOther }) }}
        error={errors.types}
      />
      <OptionCards
        legend="Which stack?"
        options={o.stacks}
        value={c.stacks}
        onChange={(stacks) => set({ stacks })}
        multiple
        compact
        other={{ value: c.stackOther, onChange: (stackOther) => set({ stackOther }), placeholder: 'Another framework?' }}
        error={errors.stacks}
      />
      <div className={styles.row}>
        <Select label="Styling" options={o.stylingOptions} value={c.styling} onChange={(styling) => set({ styling })} />
        <Segmented legend="Language" options={o.languageOptions} value={c.language} onChange={(language) => set({ language })} />
      </div>
      <OptionCards legend="Design" options={o.designOptions} value={c.design} onChange={(design) => set({ design })} />
      <Segmented legend="How many?" options={o.componentScope} value={c.scope} onChange={(scope) => set({ scope })} />
      <LinkList
        label="Designs or examples (optional)"
        hint="Figma, CodePen, or a site with something similar."
        value={c.references}
        onChange={(references) => set({ references })}
      />
    </>
  )
}

function MobileDetails({ s, setIn, errors }) {
  const m = s.mobile
  const set = (patch) => setIn('mobile', patch)
  return (
    <>
      <Segmented legend="Platforms" options={o.platforms} value={m.platform} onChange={(platform) => set({ platform })} error={errors.platform} />
      <OptionCards legend="Where are you starting?" options={o.appStage} value={m.stage} onChange={(stage) => set({ stage })} />
      <SwitchList legend="Features" options={o.appFeatures} value={m.features} onChange={(features) => set({ features })} />
      <div className={styles.row}>
        <Segmented legend="Design" options={o.appDesign} value={m.design} onChange={(design) => set({ design })} />
        <Segmented legend="Backend" options={o.appBackend} value={m.backend} onChange={(backend) => set({ backend })} />
      </div>
      <SwitchList legend="Also needs" options={o.appExtras} value={m.extras} onChange={(extras) => set({ extras })} />
    </>
  )
}

function OtherDetails({ s, setIn }) {
  return (
    <LinkList
      label="Links (optional)"
      hint="Anything that helps explain it: examples, docs, designs."
      value={s.other.links}
      onChange={(links) => setIn('other', { links })}
    />
  )
}

/* ---- 4. You ---- */

export function YouStep({ s, set, errors }) {
  return (
    <div className={styles.fields}>
      <div className={styles.row}>
        <Input
          label="Your name"
          placeholder="Jane Doe"
          autoComplete="name"
          value={s.name}
          onChange={(e) => set({ name: e.target.value })}
          error={errors.name}
          maxLength={100}
        />
        <Input
          label="Email"
          type="email"
          placeholder="jane@business.com"
          autoComplete="email"
          value={s.email}
          onChange={(e) => set({ email: e.target.value })}
          error={errors.email}
          maxLength={200}
        />
      </div>
      <Input
        label="Company (optional)"
        autoComplete="organization"
        value={s.company}
        onChange={(e) => set({ company: e.target.value })}
        maxLength={150}
      />
    </div>
  )
}

/* ---- 5. Review ---- */

const HEX = /^#[0-9a-f]{6}$/i

export function ReviewStep({ s, goTo }) {
  return (
    <div className={styles.review}>
      {s.kind === 'website' && <SitePreview {...sketchProps(s.website)} />}
      {summarize(s).map((section) => (
        <section key={section.title} className={styles.reviewSection} aria-label={section.title}>
          <div className={styles.reviewHead}>
            <h3 className={styles.reviewTitle}>{section.title}</h3>
            <button type="button" className={styles.edit} onClick={() => goTo(section.step)}>
              <Pencil size={14} aria-hidden="true" /> Edit
            </button>
          </div>
          <dl className={styles.reviewRows}>
            {section.rows.map(({ label, value }) => (
              <div key={label} className={styles.reviewRow}>
                <dt>{label}</dt>
                <dd>
                  {HEX.test(value) && <span className={styles.reviewSwatch} style={{ background: value }} aria-hidden="true" />}
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
