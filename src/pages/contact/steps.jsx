import { Eye, Pencil, Plus } from 'lucide-react'
import { Input } from '../../components'
import { useT } from '../../i18n/index.jsx'
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
 * current step's `errors`. Answers are stored as option ids (options.js);
 * the words come from the language files.
 */

/* ---- 1. Type ---- */

export function TypeStep({ s, set }) {
  const { t } = useT()
  const choose = (kind) => {
    // A budget picked for another type may not be one of this type's ranges: clear it rather than send it
    const keep = !s.budget || s.budget === o.BUDGET_UNSURE || o.budgetsFor(kind).includes(s.budget)
    set(keep ? { kind } : { kind, budget: '' })
  }
  return (
    <ChoiceCards
      name="kind"
      label={t('contact.typeLabel')}
      options={o.localize(t, 'kinds', o.kinds)}
      value={s.kind}
      onChange={choose}
    />
  )
}

/* ---- 2. Project ---- */

export function ProjectStep({ s, set, errors }) {
  const { t } = useT()
  const copy = t(`contact.placeholders.${o.kindIds.includes(s.kind) ? s.kind : 'other'}`)
  return (
    <div className={styles.fields}>
      <Input
        label={t('contact.titleLabel')}
        placeholder={copy.title}
        value={s.title}
        onChange={(e) => set({ title: e.target.value })}
        error={errors.title}
        maxLength={120}
      />
      <Input
        label={t('contact.descriptionLabel')}
        multiline
        rows={7}
        placeholder={copy.description}
        value={s.description}
        onChange={(e) => set({ description: e.target.value })}
        error={errors.description}
        hint={t('contact.descriptionHint')}
        maxLength={5000}
      />
    </div>
  )
}

/* ---- 3. Details ---- */

export function DetailsStep(props) {
  const { s, set } = props
  const { t } = useT()
  const Kind = { website: WebsiteDetails, components: ComponentDetails, mobile: MobileDetails, other: OtherDetails }[s.kind]

  return (
    <div className={styles.fields}>
      {Kind && <Kind {...props} />}
      <div className={styles.divider} />
      <Segmented
        legend={t('contact.timeline')}
        options={o.localize(t, 'timelines', o.timelines)}
        value={s.timeline}
        onChange={(timeline) => set({ timeline })}
      />
      <BudgetSlider
        legend={t('contact.budget')}
        hint={s.kind === 'website' && s.website.preview ? t('contact.budgetHintPreview') : t('contact.budgetHint')}
        stops={o.localize(t, 'budgets', o.budgetsFor(s.kind))}
        unsure={o.localize(t, 'budgets', [o.BUDGET_UNSURE])[0]}
        value={s.budget}
        onChange={(budget) => set({ budget })}
      />
    </div>
  )
}

function WebsiteDetails({ s, setIn, errors }) {
  const { t } = useT()
  const w = s.website
  const set = (patch) => setIn('website', patch)
  const setColor = (key) => (value) => set({ colors: { ...w.colors, [key]: value } })
  const clearColor = (key) => (w.colors[key] ? () => setColor(key)('') : undefined)
  const tw = (key) => t(`contact.website.${key}`)

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
        legend={t('contact.o.tabs.pages')}
        hint={tw('pagesHint')}
        value={w.pages}
        onChange={(pages) => set({ pages })}
        suggestions={t('contact.o.suggestedPages')}
      />
    ),
    features: (
      <SwitchList
        legend={t('contact.o.tabs.features')}
        hint={tw('featuresHint')}
        options={o.localize(t, 'features', o.websiteFeatures)}
        value={w.features}
        onChange={(features) => set({ features })}
      />
    ),
    look: (
      <div className={styles.fields}>
        <fieldset className={styles.plainFieldset}>
          <legend className={styles.blockLegend}>{tw('colors')}</legend>
          <div className={styles.colors}>
            <ColorField label={tw('primary')} value={w.colors.primary} onChange={setColor('primary')} onRemove={clearColor('primary')} />
            <ColorField label={tw('secondary')} value={w.colors.secondary} onChange={setColor('secondary')} onRemove={clearColor('secondary')} />
            {w.colors.accent ? (
              <ColorField label={tw('accent')} value={w.colors.accent} onChange={setColor('accent')} onRemove={clearColor('accent')} />
            ) : (
              <button type="button" className={styles.addColor} onClick={() => setColor('accent')('#ff7a59')}>
                <Plus size={16} aria-hidden="true" /> {tw('addAccent')}
              </button>
            )}
          </div>
        </fieldset>
        <StylePicker
          legend={tw('style')}
          hint={tw('styleHint')}
          options={o.localize(t, 'styles', o.styles)}
          value={w.style}
          onChange={(style) => set({ style })}
        />
      </div>
    ),
    content: (
      <div className={styles.fields}>
        <Segmented legend={tw('logo')} options={o.localize(t, 'logo', o.logoOptions)} value={w.logo} onChange={(logo) => set({ logo })} />
        <div className={styles.row}>
          <Segmented legend={tw('text')} options={o.localize(t, 'text', o.textOptions)} value={w.text} onChange={(text) => set({ text })} />
          <Segmented legend={tw('photos')} options={o.localize(t, 'photos', o.photoOptions)} value={w.photos} onChange={(photos) => set({ photos })} />
        </div>
        <LinkList
          label={tw('references')}
          hint={tw('referencesHint')}
          value={w.references}
          onChange={(references) => set({ references })}
        />
      </div>
    ),
    hosting: (
      <SwitchList
        legend={tw('care')}
        hint={tw('careHint')}
        options={o.localize(t, 'care', o.careOptions)}
        value={w.care}
        onChange={(care) => set({ care })}
      />
    ),
  }

  return (
    <>
      <div className={styles.row}>
        <Input
          label={tw('business')}
          placeholder={tw('businessPlaceholder')}
          value={w.business}
          onChange={(e) => set({ business: e.target.value })}
          error={errors.business}
          maxLength={150}
        />
        <Input
          label={tw('current')}
          placeholder="https://"
          inputMode="url"
          value={w.current}
          onChange={(e) => set({ current: e.target.value })}
          maxLength={300}
        />
      </div>

      <CheckCard Icon={Eye} checked={w.preview} onChange={(preview) => set({ preview })} title={tw('previewTitle')} text={tw('previewText')} />

      <section className={styles.builder} aria-labelledby="builder-title">
        <div className={styles.builderHead}>
          <h3 id="builder-title" className={styles.blocksTitle}>
            {tw('builderTitle')}
          </h3>
          <p className={styles.muted}>{tw('builderIntro')}</p>
        </div>
        <SitePreview {...sketchProps(w)} onTheme={(theme) => set({ theme })} />
        <Tabs
          label={tw('tabsLabel')}
          tabs={o.websiteTabs.map((id) => ({ id, title: t(`contact.o.tabs.${id}`) }))}
          filled={filled}
          panels={panels}
        />
      </section>
    </>
  )
}

/** What the sketch needs from the website answers. */
function sketchProps(w) {
  return { business: w.business, pages: w.pages, colors: w.colors, style: w.style, features: w.features, theme: w.theme }
}

function ComponentDetails({ s, setIn, errors }) {
  const { t } = useT()
  const c = s.components
  const set = (patch) => setIn('components', patch)
  const tc = (key) => t(`contact.components.${key}`)
  return (
    <>
      <OptionCards
        legend={tc('types')}
        hint={tc('typesHint')}
        options={o.localize(t, 'componentTypes', o.componentTypes)}
        value={c.types}
        onChange={(types) => set({ types })}
        multiple
        compact
        other={{ value: c.typesOther, onChange: (typesOther) => set({ typesOther }) }}
        error={errors.types}
      />
      <OptionCards
        legend={tc('stack')}
        options={o.stacks}
        value={c.stacks}
        onChange={(stacks) => set({ stacks })}
        multiple
        compact
        other={{ value: c.stackOther, onChange: (stackOther) => set({ stackOther }), placeholder: tc('stackOther') }}
        error={errors.stacks}
      />
      <div className={styles.row}>
        <Select label={tc('styling')} options={o.localize(t, 'styling', o.stylingOptions)} value={c.styling} onChange={(styling) => set({ styling })} />
        <Segmented
          legend={tc('language')}
          options={o.localize(t, 'codeLanguage', o.codeLanguages)}
          value={c.language}
          onChange={(language) => set({ language })}
        />
      </div>
      <OptionCards
        legend={tc('design')}
        options={o.localize(t, 'componentDesign', o.designOptions)}
        value={c.design}
        onChange={(design) => set({ design })}
      />
      <Segmented legend={tc('scope')} options={o.localize(t, 'scope', o.componentScope)} value={c.scope} onChange={(scope) => set({ scope })} />
      <LinkList label={tc('references')} hint={tc('referencesHint')} value={c.references} onChange={(references) => set({ references })} />
    </>
  )
}

function MobileDetails({ s, setIn, errors }) {
  const { t } = useT()
  const m = s.mobile
  const set = (patch) => setIn('mobile', patch)
  const tm = (key) => t(`contact.mobile.${key}`)
  return (
    <>
      <Segmented
        legend={tm('platforms')}
        options={o.localize(t, 'platforms', o.platforms)}
        value={m.platform}
        onChange={(platform) => set({ platform })}
        error={errors.platform}
      />
      <OptionCards legend={tm('stage')} options={o.localize(t, 'stage', o.appStage)} value={m.stage} onChange={(stage) => set({ stage })} />
      <SwitchList
        legend={tm('features')}
        options={o.localize(t, 'appFeatures', o.appFeatures)}
        value={m.features}
        onChange={(features) => set({ features })}
      />
      <div className={styles.row}>
        <Segmented legend={tm('design')} options={o.localize(t, 'appDesign', o.appDesign)} value={m.design} onChange={(design) => set({ design })} />
        <Segmented legend={tm('backend')} options={o.localize(t, 'backend', o.appBackend)} value={m.backend} onChange={(backend) => set({ backend })} />
      </div>
      <SwitchList legend={tm('extras')} options={o.localize(t, 'extras', o.appExtras)} value={m.extras} onChange={(extras) => set({ extras })} />
    </>
  )
}

function OtherDetails({ s, setIn }) {
  const { t } = useT()
  return (
    <LinkList
      label={t('contact.other.links')}
      hint={t('contact.other.linksHint')}
      value={s.other.links}
      onChange={(links) => setIn('other', { links })}
    />
  )
}

/* ---- 4. You ---- */

export function YouStep({ s, set, errors }) {
  const { t } = useT()
  const ty = (key) => t(`contact.you.${key}`)
  return (
    <div className={styles.fields}>
      <div className={styles.row}>
        <Input
          label={ty('name')}
          placeholder={ty('namePlaceholder')}
          autoComplete="name"
          value={s.name}
          onChange={(e) => set({ name: e.target.value })}
          error={errors.name}
          maxLength={100}
        />
        <Input
          label={ty('email')}
          type="email"
          placeholder={ty('emailPlaceholder')}
          autoComplete="email"
          value={s.email}
          onChange={(e) => set({ email: e.target.value })}
          error={errors.email}
          maxLength={200}
        />
      </div>
      <Input
        label={ty('company')}
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
  const { t } = useT()
  return (
    <div className={styles.review}>
      {s.kind === 'website' && <SitePreview {...sketchProps(s.website)} />}
      {summarize(s, t).map((section) => (
        <section key={section.title} className={styles.reviewSection} aria-label={section.title}>
          <div className={styles.reviewHead}>
            <h3 className={styles.reviewTitle}>{section.title}</h3>
            <button type="button" className={styles.edit} onClick={() => goTo(section.step)}>
              <Pencil size={14} aria-hidden="true" /> {t('contact.edit')}
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
