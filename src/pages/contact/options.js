import {
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
  AppWindow,
  Wrench,
} from 'lucide-react'

/*
 * Everything the project setup offers to pick from. Edit the lists here; the
 * steps, the review and the email all read from them. `value` is what's
 * stored and emailed; `text` is the one line of help under it.
 */

export const kinds = [
  { value: 'website', Icon: Globe, title: 'Website', text: 'A full website for your business, designed and built.' },
  { value: 'components', Icon: Blocks, title: 'Components', text: 'Components, animations or interactive sets for your stack.' },
  { value: 'mobile', Icon: Smartphone, title: 'Mobile app', text: 'An iOS and Android app from one codebase.' },
  { value: 'other', Icon: Sparkles, title: 'Something else', text: 'Not on the list? Explain exactly what you need.' },
]

export const kindByValue = Object.fromEntries(kinds.map((k) => [k.value, k]))

// Step 2 wording, per kind
export const projectCopy = {
  website: {
    title: 'Website for Northfield Coffee',
    description: 'What the business does, who the site is for, and what it should help people do…',
  },
  components: {
    title: 'Animated pricing table',
    description: 'What the components are for, where they’ll live, and how they should behave…',
  },
  mobile: {
    title: 'Booking app for our gym',
    description: 'What the app does, who uses it, and the main things they should be able to do…',
  },
  other: {
    title: 'Give it a short name',
    description: 'Explain exactly what you need. The more detail, the better the reply…',
  },
}

/* ---- Website ---- */

// The page builder's tabs, in order
export const websiteTabs = [
  { id: 'pages', title: 'Pages' },
  { id: 'features', title: 'Features' },
  { id: 'look', title: 'Look' },
  { id: 'content', title: 'Content' },
  { id: 'hosting', title: 'Hosting' },
]

export const suggestedPages = ['About', 'Services', 'Pricing', 'Menu', 'Gallery', 'Blog', 'Contact', 'Shop', 'Booking', 'FAQ']

export const websiteFeatures = [
  { value: 'Online store', Icon: ShoppingBag, text: 'Sell products with checkout and payments' },
  { value: 'Bookings & appointments', Icon: CalendarCheck, text: 'Let customers book a time online' },
  { value: 'Blog or news', Icon: Newspaper, text: 'Posts you can write and publish yourself' },
  { value: 'Contact form', Icon: Mail, text: 'Messages straight to your inbox' },
  { value: 'Newsletter signup', Icon: MailPlus, text: 'Grow a mailing list' },
  { value: 'Multiple languages', Icon: Languages, text: 'The site in more than one language' },
  { value: 'Customer accounts', Icon: UserRound, text: 'Sign in, orders, saved details' },
  { value: 'Maps & opening hours', Icon: MapPin, text: 'Help people find and visit you' },
]

// Each style is shown as a type specimen in its own face
export const styles = [
  { value: 'Minimal', font: 'system-ui, sans-serif', weight: 300, text: 'Quiet, lots of space' },
  { value: 'Bold', font: 'system-ui, sans-serif', weight: 850, text: 'Big type, strong contrast' },
  { value: 'Elegant', font: 'Georgia, "Times New Roman", serif', weight: 400, italic: true, text: 'Refined, editorial' },
  { value: 'Playful', font: '"Trebuchet MS", ui-rounded, sans-serif', weight: 700, text: 'Friendly and round' },
  { value: 'Warm', font: '"Palatino Linotype", Palatino, Georgia, serif', weight: 600, text: 'Inviting, a little classic' },
  { value: 'Techy', font: 'ui-monospace, "Cascadia Code", Consolas, monospace', weight: 500, text: 'Precise, product-like' },
]
export const styleByValue = Object.fromEntries(styles.map((s) => [s.value, s]))

export const logoOptions = ['I have one', 'I need one', 'Not sure']
export const textOptions = ['I have it', 'Help me write it']
export const photoOptions = ['I have them', 'I need them']

export const careOptions = [
  { value: 'Register a domain', Icon: Globe, text: 'Find and register your .com (or similar)' },
  { value: 'Hosting', Icon: Server, text: 'Fast, secure hosting, looked after for you' },
  { value: 'Ongoing maintenance', Icon: Wrench, text: 'Updates, fixes and small changes each month' },
  { value: 'Business email', Icon: AtSign, text: 'you@yourbusiness.com addresses' },
]

/* ---- Components ---- */

export const componentTypes = [
  { value: 'Buttons & inputs', Icon: MousePointerClick },
  { value: 'Forms', Icon: TextCursorInput },
  { value: 'Navigation & menus', Icon: Menu },
  { value: 'Modals & dialogs', Icon: AppWindow },
  { value: 'Tables & lists', Icon: Table },
  { value: 'Charts & data', Icon: ChartLine },
  { value: 'Cards & layouts', Icon: LayoutGrid },
  { value: 'Landing page sections', Icon: LayoutTemplate },
  { value: 'Animations & micro-interactions', Icon: Sparkles },
  { value: 'Animated icons & logos', Icon: Shapes },
  { value: 'A full design system', Icon: Layers },
]

export const stacks = ['React', 'Next.js', 'Vue', 'Nuxt', 'Svelte', 'Angular', 'React Native', 'Web Components']
export const stylingOptions = ['CSS Modules', 'Tailwind', 'styled-components / Emotion', 'Plain CSS', 'Match my codebase']
export const languageOptions = ['TypeScript', 'JavaScript', 'Either']
export const componentScope = ['One', 'A few (2–5)', 'A library']

export const designOptions = [
  { value: 'I have designs', Icon: PenTool, text: 'Figma or similar; I build them faithfully' },
  { value: 'Design it for me', Icon: Palette, text: 'I design and build them' },
  { value: 'Match my existing style', Icon: Copy, text: 'Fit in with what you already have' },
]

/* ---- Mobile ---- */

export const platforms = ['iOS & Android', 'iOS', 'Android']

export const appStage = [
  { value: 'A new app', Icon: Sparkles, text: 'Starting from scratch' },
  { value: 'Improve an existing app', Icon: Wrench, text: 'New features or fixes' },
  { value: 'Rebuild an existing app', Icon: RefreshCw, text: 'Start over, properly' },
]

export const appFeatures = [
  { value: 'Accounts & login', Icon: KeyRound, text: 'Sign up, sign in, profiles' },
  { value: 'Payments', Icon: CreditCard, text: 'In-app purchases or card payments' },
  { value: 'Push notifications', Icon: Bell, text: 'Reach people outside the app' },
  { value: 'Maps & location', Icon: MapPin, text: 'Maps, directions, nearby places' },
  { value: 'Chat & messaging', Icon: MessageCircle, text: 'Conversations between users' },
  { value: 'Camera & media', Icon: Camera, text: 'Photos, video, uploads' },
  { value: 'Works offline', Icon: WifiOff, text: 'Usable without a connection' },
  { value: 'Admin dashboard', Icon: LayoutDashboard, text: 'Manage content and users on the web' },
]

export const appDesign = ['I have designs', 'Design it for me']
export const appBackend = ['I have one', 'I need one', 'Not sure']

export const appExtras = [
  { value: 'App Store & Play Store publishing', Icon: Store, text: 'Listings, review and release' },
  { value: 'Ongoing maintenance', Icon: Wrench, text: 'OS updates, fixes and improvements' },
]

/* ---- Every kind ---- */

export const timelines = ['As soon as possible', 'Within a month', 'In 1–3 months', 'I’m flexible']
// The budget slider's stops, low to high. Websites start at €450, the lowest price for one.
const budgetStops = {
  website: ['€450–1k', '€1k–3k', '€3k–7k', '€7k–15k', '€15k+'],
  default: ['Under €1k', '€1k–3k', '€3k–7k', '€7k–15k', '€15k+'],
}
export const budgetsFor = (kind) => budgetStops[kind] ?? budgetStops.default
