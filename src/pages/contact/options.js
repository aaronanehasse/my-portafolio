import {
  AppWindow,
  AtSign,
  Bell,
  Blocks,
  CalendarCheck,
  Camera,
  ChartLine,
  Copy,
  CreditCard,
  Globe,
  KeyRound,
  Languages,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  Mail,
  MailPlus,
  MapPin,
  Menu,
  MessageCircle,
  MousePointerClick,
  Newspaper,
  Palette,
  PenTool,
  RefreshCw,
  Server,
  Shapes,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Table,
  TextCursorInput,
  UserRound,
  WifiOff,
  Wrench,
} from 'lucide-react'

/*
 * What the project setup offers to pick from: ids (and icons) only. Answers
 * are stored as these ids, so a draft and the email don't depend on the
 * language. Each id's words live in the language files, under
 * contact.o.<group>.<id> (see src/i18n/locales/en.jsx); `localize` joins the two.
 */

/** A list of { id, Icon } as options for the controls, labelled in the current language. */
export function localize(t, group, list) {
  return list.map((item) => {
    const { id, Icon, ...rest } = typeof item === 'string' ? { id: item } : item
    const words = t(`contact.o.${group}.${id}`)
    const { label, text } = typeof words === 'string' ? { label: words } : words
    return { value: id, label, text, Icon, ...rest }
  })
}

/** The words for one stored id, for the review and the email. */
export const labelOf = (t, group, id) => {
  const words = t(`contact.o.${group}.${id}`)
  return typeof words === 'string' ? words : words.label
}

export const kinds = [
  { id: 'website', Icon: Globe },
  { id: 'components', Icon: Blocks },
  { id: 'mobile', Icon: Smartphone },
  { id: 'other', Icon: Sparkles },
]
export const kindIds = kinds.map((k) => k.id)

/* ---- Website ---- */

// The page builder's tabs, in order
export const websiteTabs = ['pages', 'features', 'look', 'content', 'hosting']

export const websiteFeatures = [
  { id: 'store', Icon: ShoppingBag },
  { id: 'booking', Icon: CalendarCheck },
  { id: 'blog', Icon: Newspaper },
  { id: 'contactForm', Icon: Mail },
  { id: 'newsletter', Icon: MailPlus },
  { id: 'languages', Icon: Languages },
  { id: 'accounts', Icon: UserRound },
  { id: 'maps', Icon: MapPin },
]

// Each style is shown as a type specimen in its own face
export const styles = [
  { id: 'minimal', font: 'system-ui, sans-serif', weight: 300 },
  { id: 'bold', font: 'system-ui, sans-serif', weight: 850 },
  { id: 'elegant', font: 'Georgia, "Times New Roman", serif', weight: 400, italic: true },
  { id: 'playful', font: '"Trebuchet MS", ui-rounded, sans-serif', weight: 700 },
  { id: 'warm', font: '"Palatino Linotype", Palatino, Georgia, serif', weight: 600 },
  { id: 'techy', font: 'ui-monospace, "Cascadia Code", Consolas, monospace', weight: 500 },
]
export const styleById = Object.fromEntries(styles.map((s) => [s.id, s]))

export const logoOptions = ['have', 'need', 'unsure']
export const textOptions = ['have', 'help']
export const photoOptions = ['have', 'need']

export const careOptions = [
  { id: 'domain', Icon: Globe },
  { id: 'hosting', Icon: Server },
  { id: 'maintenance', Icon: Wrench },
  { id: 'email', Icon: AtSign },
]

export const themes = ['dark', 'light']

/* ---- Components ---- */

export const componentTypes = [
  { id: 'buttons', Icon: MousePointerClick },
  { id: 'forms', Icon: TextCursorInput },
  { id: 'navigation', Icon: Menu },
  { id: 'modals', Icon: AppWindow },
  { id: 'tables', Icon: Table },
  { id: 'charts', Icon: ChartLine },
  { id: 'cards', Icon: LayoutGrid },
  { id: 'sections', Icon: LayoutTemplate },
  { id: 'animations', Icon: Sparkles },
  { id: 'animatedIcons', Icon: Shapes },
  { id: 'designSystem', Icon: Layers },
]

// Framework names are the same in every language, so they're their own labels
export const stacks = ['React', 'Next.js', 'Vue', 'Nuxt', 'Svelte', 'Angular', 'React Native', 'Web Components']
export const stylingOptions = ['cssModules', 'tailwind', 'cssInJs', 'plainCss', 'matchCodebase']
export const codeLanguages = ['ts', 'js', 'either']
export const componentScope = ['one', 'few', 'library']

export const designOptions = [
  { id: 'have', Icon: PenTool },
  { id: 'forMe', Icon: Palette },
  { id: 'match', Icon: Copy },
]

/* ---- Mobile ---- */

export const platforms = ['both', 'ios', 'android']

export const appStage = [
  { id: 'new', Icon: Sparkles },
  { id: 'improve', Icon: Wrench },
  { id: 'rebuild', Icon: RefreshCw },
]

export const appFeatures = [
  { id: 'accounts', Icon: KeyRound },
  { id: 'payments', Icon: CreditCard },
  { id: 'push', Icon: Bell },
  { id: 'maps', Icon: MapPin },
  { id: 'chat', Icon: MessageCircle },
  { id: 'camera', Icon: Camera },
  { id: 'offline', Icon: WifiOff },
  { id: 'admin', Icon: LayoutDashboard },
]

export const appDesign = ['have', 'forMe']
export const appBackend = ['have', 'need', 'unsure']

export const appExtras = [
  { id: 'stores', Icon: Store },
  { id: 'maintenance', Icon: Wrench },
]

/* ---- Every kind ---- */

export const timelines = ['asap', 'month', 'quarter', 'flexible']

// The budget slider's stops, low to high. Websites start at €450, the lowest price for one.
const budgetStops = {
  website: ['450-1k', '1k-3k', '3k-7k', '7k-15k', '15k+'],
  default: ['under-1k', '1k-3k', '3k-7k', '7k-15k', '15k+'],
}
export const budgetsFor = (kind) => budgetStops[kind] ?? budgetStops.default
export const BUDGET_UNSURE = 'unsure'
