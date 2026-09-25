/*
 * English: the reference language. Every key the site uses is here; other
 * languages translate these, and anything they leave out falls back to this.
 * `{name}` marks a placeholder the code fills in; keep it as is when translating.
 */

export default {
  name: 'English',
  short: 'EN',
  messages: {
    titles: {
      home: 'Aaron Anehasse',
      websites: 'Website creation · Aaron Anehasse',
      contact: 'Start a project · Aaron Anehasse',
      lumen: 'Lumen — bookkeeping that runs itself (demo)',
      privacy: 'Privacy policy · Aaron Anehasse',
      imprint: 'Imprint · Aaron Anehasse',
    },

    nav: {
      home: 'Aaron Anehasse, home',
      projects: 'Projects',
      services: 'Services',
      contact: 'Contact',
    },

    footer: {
      copyright: '© {year} Aaron Anehasse',
      language: 'Language',
      privacy: 'Privacy',
      imprint: 'Imprint',
    },

    hero: {
      status: 'Available for freelance work',
      title: 'Hi, I’m {name}',
      role: 'User interface designer & full-stack developer',
      intro: [
        'In an era where everyone can use AI to build software, the human factor, the attention to detail and natural experience are a requirement for any enterprise-grade product.',
        'I help companies build software that is not only functional, but also delightful to use. The future of software is human-centered.',
      ],
      seeWork: 'See my work',
      contact: 'Get in touch',
      portrait: 'Portrait of {name}',
      photoMissing: 'Add your photo at',
    },

    philosophy: {
      title: 'My philosophy',
      lead: 'Anyone can build software now. That’s exactly why yours needs to stand out.',
      points: [
        {
          label: 'The problem',
          title: 'Software is easy to copy',
          body: 'Thanks to AI, the amount of software being built is growing exponentially. A competitor can copy your product, or even improve on it, in record time.',
        },
        {
          label: 'The answer',
          title: 'Craft is what AI can’t copy',
          body: 'An experienced designer who builds gives you what AI can’t easily clone: the detail, the feel, a product that is unmistakably yours. That’s what lifts conversion and strengthens your position.',
        },
      ],
      compareTitle: 'Same brief, three results',
      compareText: 'The icon for Echo, an AI product of mine, as each kind of maker would deliver it.',
      steps: [
        {
          label: 'AI',
          title: 'AI generated',
          description: 'A decent concept on paper, but it looks like exactly that: a concept. Not something a business should ship.',
        },
        {
          label: 'Average developer',
          title: 'Developer made',
          description: 'It works, but it lacks soul. Perfectly fine for a basic product, not for a company that competes on quality.',
        },
        {
          label: 'Me',
          title: 'Alive',
          description: 'Not just animated, but alive. Nothing is pre-made; every motion happens in real time. Try the states on it, or click it while it’s idle.',
        },
      ],
      iconAlt: 'Echo AI icon, {version} version',
      comingSoon: 'Echo component coming soon',
      svgMissing: 'Add SVG at',
    },

    echo: {
      logo: 'Echo AI logo, animated',
      controls: 'Echo animation',
      states: { greeting: 'Wave', thinking: 'Think', typing: 'Type', finished: 'Finish', sleeping: 'Sleep', idle: 'Idle' },
    },

    work: {
      title: 'Selected work',
      intro: 'Most of my work is private and protected, but here’s what I can share: two products I designed and built from the ground up.',
      founder: 'Founder',
      visit: 'Visit {site}',
      logo: '{name} logo',
      products: {
        'lode-studio': {
          kind: 'Desktop app',
          tagline: 'Create custom Minecraft content.',
          description: 'A desktop app for building custom Minecraft content. Designed, engineered and shipped end to end under my own company.',
          stats: ['Downloads', 'Active creators', 'Win · Mac · Linux'],
        },
        nmcrate: {
          kind: 'Marketplace',
          tagline: 'The Minecraft marketplace.',
          description: 'A community-driven marketplace where server owners and builders buy and sell plugins, models, datapacks and tools, with creator studios, a server directory and forums.',
          stats: ['Listings', 'Creators', 'Sales'],
        },
      },
    },

    services: {
      title: 'Services',
      intro: 'Three ways to work together, all with the same attention to detail.',
      items: {
        websites: {
          audience: 'For businesses',
          title: 'Full website creation',
          description: 'Complete websites for businesses, designed and built with maximum attention to detail. Depending on complexity, delivered in as little as 48 hours.',
          points: ['Every page designed, nothing templated', 'Live in as little as 48 hours', 'Domain, hosting and maintenance available'],
          example: 'See the full service →',
        },
        components: {
          audience: 'For developers',
          title: 'Curated components',
          description: 'Components, animations and interactive sets for developers who’d rather stay out of complex, detail-heavy work. Built to drop into your modular stack.',
          points: ['Made for React, Vue or whatever you use', 'Animation and interaction included', 'Crafted to your request'],
          example: 'Example: the Echo icon',
        },
        mobile: {
          audience: 'For businesses',
          title: 'Mobile apps',
          description: 'Mobile apps built with React Native: one codebase for iOS and Android, with the same care as the web. From the first release to ongoing maintenance.',
          points: ['iOS and Android from one codebase', 'Designed and developed by one person', 'Maintenance plans available'],
          note: 'Packs and pricing coming soon',
        },
      },
      ctaText: 'Not sure which fits? Tell me what you’re building.',
      cta: 'Start a project',
    },

    websites: {
      tag: 'Service · Website creation',
      title: 'Your full website, {accent} in as little as 48 hours.',
      titleAccent: 'designed and built',
      intro: 'Every page designed with care, built to be fast, and handed over ready to go live. I can take care of the domain, hosting and maintenance too, so you never have to think about it.',
      facts: [
        'Free preview first, pay only if you continue',
        'Live in as little as 48 hours',
        'Every page designed, nothing templated',
        'Domain, hosting and maintenance available',
      ],
      requestPreview: 'Request a free preview',
      seeWork: 'See my work',
      demoNote: 'Lumen is a demo site, built as a real, working page.',
      explore: 'Explore it',
      newTab: 'New tab',
      previewTag: 'Free preview · No commitment',
      previewTitle: 'See your website before you spend a thing.',
      previewIntro: 'I’ll build a preview of your site for free. If it’s not what you want, there’s nothing to pay and nothing to cancel.',
      steps: [
        { title: 'Request a preview', text: 'Tell me about your business and what the site should do. It takes a couple of minutes.' },
        { title: 'I build it within hours', text: 'Once I accept your request, you get a real preview with 2–3 sections, usually within a few hours.' },
        { title: 'You decide', text: 'Like it? We carry on and build the full site. Not for you? You walk away and pay nothing.' },
      ],
    },

    request: {
      title: 'Request your free preview',
      intro: 'Tell me a little about your business. Once I accept the request, I’ll make you a preview within a few hours.',
      promises: [
        'A real preview with 2–3 sections, made within a few hours of accepting',
        'No commitment: if it’s not for you, you don’t pay anything',
        'If you like it, we carry on and build the full site',
      ],
      duration: 'Takes about three minutes',
      asks: ['Your business and what the site should do', 'Colours, pages or sites you like, if you have them', 'Where to send the preview'],
      button: 'Request free preview',
      fine: 'Free. No card, no commitment.',
    },

    lumen: {
      window: 'Lumen demo website',
      newTab: 'Open in new tab',
      close: 'Close demo',
      loading: 'Loading…',
      back: 'Demo by Aaron Anehasse',
    },

    contact: {
      title: 'Start a project',
      intro: 'A few short steps and I’ll have everything I need to give you a real answer. It takes about three minutes.',
      stepsLabel: 'Steps',
      steps: [
        { label: 'Type', title: 'What are we making?', intro: 'Pick the closest fit. You can explain the rest next.' },
        { label: 'Project', title: 'Tell me about it', intro: 'A title and a few sentences on what it is and who it’s for.' },
        { label: 'Details', title: 'The details', intro: 'The specifics I need to give you an accurate answer.' },
        { label: 'You', title: 'Where do I reply?', intro: 'I’ll only use this to get back to you about this project.' },
        { label: 'Review', title: 'Check and send', intro: 'Make sure everything’s right. You can edit any part.' },
      ],
      progress: 'Step {n} of {total} · {label}',
      saved: 'Draft saved on this device',
      privacy: 'How I handle what you send: {link}.',
      privacyLink: 'privacy policy',
      back: 'Back',
      continue: 'Continue',
      sending: 'Sending…',
      send: 'Send request',
      sendPreview: 'Request free preview',
      failed: 'Something went wrong sending that. Please try again in a moment.',
      sent: {
        title: 'Request sent',
        preview: 'Thanks! I’ll look at your request, and once I accept it you’ll get a free preview of a few sections, usually within a few hours.',
        quote: 'Thanks! I’ll look at your request and reply with next steps and a quote, usually within a couple of days.',
        copy: 'A copy of everything you sent is on its way to {email}.',
        home: 'Back to home',
        another: 'Start another request',
      },
      errors: {
        kind: 'Pick one to continue.',
        title: 'Give it a short title.',
        description: 'A sentence or two is enough, but I need something.',
        business: 'What’s the business called?',
        pickOne: 'Pick at least one, or type your own.',
        platform: 'Pick the platforms.',
        name: 'Please enter your name.',
        email: 'Please enter a valid email.',
      },

      // Step 1
      typeLabel: 'Project type',
      // Step 2
      titleLabel: 'Title',
      descriptionLabel: 'Description',
      descriptionHint: 'You’ll add specifics in the next step.',
      placeholders: {
        website: { title: 'Website for Northfield Coffee', description: 'What the business does, who the site is for, and what it should help people do…' },
        components: { title: 'Animated pricing table', description: 'What the components are for, where they’ll live, and how they should behave…' },
        mobile: { title: 'Booking app for our gym', description: 'What the app does, who uses it, and the main things they should be able to do…' },
        other: { title: 'Give it a short name', description: 'Explain exactly what you need. The more detail, the better the reply…' },
      },
      // Step 3
      timeline: 'Timeline',
      budget: 'Budget',
      budgetHintPreview: 'Optional. You’ll get an exact price after the free preview.',
      budgetHint: 'Optional, but it helps me suggest the right scope.',
      website: {
        business: 'Business name',
        businessPlaceholder: 'Northfield Coffee',
        current: 'Current website (optional)',
        previewTitle: 'Get a free preview first',
        previewText: 'I’ll build 2–3 sections of your site for free before giving you a price. If it’s not for you, you pay nothing.',
        builderTitle: 'Shape your site',
        builderIntro: 'Everything here is optional. Fill in what you already know.',
        tabsLabel: 'Site details',
        pagesHint: 'What people should be able to find. You can change this later.',
        featuresHint: 'What the site should be able to do.',
        colors: 'Brand colours',
        primary: 'Primary',
        secondary: 'Secondary',
        accent: 'Accent',
        addAccent: 'Accent colour',
        style: 'Style',
        styleHint: 'The overall feel. The sketch uses its typeface.',
        logo: 'Logo',
        text: 'Text for the site',
        photos: 'Photos',
        references: 'Sites you like',
        referencesHint: 'Any site whose look or feel you like, even in another industry.',
        care: 'I’d like you to handle',
        careHint: 'So you never have to think about it.',
      },
      components: {
        types: 'What kind of components?',
        typesHint: 'Pick all that apply.',
        stack: 'Which stack?',
        stackOther: 'Another framework?',
        styling: 'Styling',
        language: 'Language',
        design: 'Design',
        scope: 'How many?',
        references: 'Designs or examples (optional)',
        referencesHint: 'Figma, CodePen, or a site with something similar.',
      },
      mobile: {
        platforms: 'Platforms',
        stage: 'Where are you starting?',
        features: 'Features',
        design: 'Design',
        backend: 'Backend',
        extras: 'Also needs',
      },
      other: {
        links: 'Links (optional)',
        linksHint: 'Anything that helps explain it: examples, docs, designs.',
      },
      // Step 4
      you: {
        name: 'Your name',
        namePlaceholder: 'Jane Doe',
        email: 'Email',
        emailPlaceholder: 'jane@business.com',
        company: 'Company (optional)',
      },
      // Step 5
      edit: 'Edit',

      // The controls' own words
      field: {
        somethingElse: 'Something else? Type it here',
        somethingElseLabel: '{legend}: something else',
        choose: 'Choose…',
        dragToChoose: 'Drag to choose',
        notChosen: 'Not chosen',
        home: 'Home',
        alwaysIncluded: 'Always included',
        addPage: 'Add a page',
        add: 'Add',
        common: 'Common:',
        remove: 'Remove {name}',
        colorPicker: '{name} colour picker',
        colorEmpty: 'Choose',
        addLink: 'Add another link',
        removeLink: 'Remove link {n}',
        next: 'Next: {name}',
        filledIn: '(filled in)',
      },

      // The site sketch
      sketch: {
        caption: 'A rough sketch that updates as you add details. Not the design.',
        themeLabel: 'Site theme',
        yourBusiness: 'Your business',
        bookNow: 'Book now',
        shop: 'Shop',
        contact: 'Contact',
        learnMore: 'Learn more',
      },

      // The review and the email: section titles and row labels
      summary: {
        project: 'Project',
        details: 'Details',
        you: 'You',
        type: 'Type',
        title: 'Title',
        description: 'Description',
        business: 'Business',
        current: 'Current website',
        preview: 'Free preview',
        previewYes: 'Yes, a preview of a few sections before a price',
        previewNo: 'No, straight to a quote',
        theme: 'Theme',
        pages: 'Pages',
        features: 'Features',
        primary: 'Primary colour',
        secondary: 'Secondary colour',
        accent: 'Accent colour',
        style: 'Style',
        logo: 'Logo',
        text: 'Text',
        photos: 'Photos',
        references: 'Sites they like',
        care: 'Domain & hosting',
        types: 'Component types',
        stack: 'Stack',
        styling: 'Styling',
        language: 'Language',
        design: 'Design',
        scope: 'Scope',
        examples: 'Designs or examples',
        platforms: 'Platforms',
        stage: 'Stage',
        appFeatures: 'Features',
        backend: 'Backend',
        extras: 'Also needs',
        links: 'Links',
        timeline: 'Timeline',
        budget: 'Budget',
        name: 'Name',
        email: 'Email',
        company: 'Company',
      },

      // Every option, by its id (see pages/contact/options.js)
      o: {
        kinds: {
          website: { label: 'Website', text: 'A full website for your business, designed and built.' },
          components: { label: 'Components', text: 'Components, animations or interactive sets for your stack.' },
          mobile: { label: 'Mobile app', text: 'An iOS and Android app from one codebase.' },
          other: { label: 'Something else', text: 'Not on the list? Explain exactly what you need.' },
        },
        tabs: { pages: 'Pages', features: 'Features', look: 'Look', content: 'Content', hosting: 'Hosting' },
        suggestedPages: ['About', 'Services', 'Pricing', 'Menu', 'Gallery', 'Blog', 'Contact', 'Shop', 'Booking', 'FAQ'],
        features: {
          store: { label: 'Online store', text: 'Sell products with checkout and payments' },
          booking: { label: 'Bookings & appointments', text: 'Let customers book a time online' },
          blog: { label: 'Blog or news', text: 'Posts you can write and publish yourself' },
          contactForm: { label: 'Contact form', text: 'Messages straight to your inbox' },
          newsletter: { label: 'Newsletter signup', text: 'Grow a mailing list' },
          languages: { label: 'Multiple languages', text: 'The site in more than one language' },
          accounts: { label: 'Customer accounts', text: 'Sign in, orders, saved details' },
          maps: { label: 'Maps & opening hours', text: 'Help people find and visit you' },
        },
        styles: {
          minimal: { label: 'Minimal', text: 'Quiet, lots of space' },
          bold: { label: 'Bold', text: 'Big type, strong contrast' },
          elegant: { label: 'Elegant', text: 'Refined, editorial' },
          playful: { label: 'Playful', text: 'Friendly and round' },
          warm: { label: 'Warm', text: 'Inviting, a little classic' },
          techy: { label: 'Techy', text: 'Precise, product-like' },
        },
        logo: { have: 'I have one', need: 'I need one', unsure: 'Not sure' },
        text: { have: 'I have it', help: 'Help me write it' },
        photos: { have: 'I have them', need: 'I need them' },
        care: {
          domain: { label: 'Register a domain', text: 'Find and register your .com (or similar)' },
          hosting: { label: 'Hosting', text: 'Fast, secure hosting, looked after for you' },
          maintenance: { label: 'Ongoing maintenance', text: 'Updates, fixes and small changes each month' },
          email: { label: 'Business email', text: 'you@yourbusiness.com addresses' },
        },
        theme: { dark: 'Dark', light: 'Light' },
        componentTypes: {
          buttons: 'Buttons & inputs',
          forms: 'Forms',
          navigation: 'Navigation & menus',
          modals: 'Modals & dialogs',
          tables: 'Tables & lists',
          charts: 'Charts & data',
          cards: 'Cards & layouts',
          sections: 'Landing page sections',
          animations: 'Animations & micro-interactions',
          animatedIcons: 'Animated icons & logos',
          designSystem: 'A full design system',
        },
        styling: {
          cssModules: 'CSS Modules',
          tailwind: 'Tailwind',
          cssInJs: 'styled-components / Emotion',
          plainCss: 'Plain CSS',
          matchCodebase: 'Match my codebase',
        },
        codeLanguage: { ts: 'TypeScript', js: 'JavaScript', either: 'Either' },
        scope: { one: 'One', few: 'A few (2–5)', library: 'A library' },
        componentDesign: {
          have: { label: 'I have designs', text: 'Figma or similar; I build them faithfully' },
          forMe: { label: 'Design it for me', text: 'I design and build them' },
          match: { label: 'Match my existing style', text: 'Fit in with what you already have' },
        },
        platforms: { both: 'iOS & Android', ios: 'iOS', android: 'Android' },
        stage: {
          new: { label: 'A new app', text: 'Starting from scratch' },
          improve: { label: 'Improve an existing app', text: 'New features or fixes' },
          rebuild: { label: 'Rebuild an existing app', text: 'Start over, properly' },
        },
        appFeatures: {
          accounts: { label: 'Accounts & login', text: 'Sign up, sign in, profiles' },
          payments: { label: 'Payments', text: 'In-app purchases or card payments' },
          push: { label: 'Push notifications', text: 'Reach people outside the app' },
          maps: { label: 'Maps & location', text: 'Maps, directions, nearby places' },
          chat: { label: 'Chat & messaging', text: 'Conversations between users' },
          camera: { label: 'Camera & media', text: 'Photos, video, uploads' },
          offline: { label: 'Works offline', text: 'Usable without a connection' },
          admin: { label: 'Admin dashboard', text: 'Manage content and users on the web' },
        },
        appDesign: { have: 'I have designs', forMe: 'Design it for me' },
        backend: { have: 'I have one', need: 'I need one', unsure: 'Not sure' },
        extras: {
          stores: { label: 'App Store & Play Store publishing', text: 'Listings, review and release' },
          maintenance: { label: 'Ongoing maintenance', text: 'OS updates, fixes and improvements' },
        },
        timelines: { asap: 'As soon as possible', month: 'Within a month', quarter: 'In 1–3 months', flexible: 'I’m flexible' },
        budgets: {
          'under-1k': 'Under €1k',
          '450-1k': '€450–1k',
          '1k-3k': '€1k–3k',
          '3k-7k': '€3k–7k',
          '7k-15k': '€7k–15k',
          '15k+': '€15k+',
          unsure: 'Not sure yet',
        },
      },
    },

    legal: {
      updated: 'Last updated {date}',
      date: '25 September 2026',

      imprint: {
        title: 'Imprint',
        intro: 'The business behind this site and how to reach it.',
        labels: {
          company: 'Company',
          form: 'Legal form',
          represented: 'Represented by',
          address: 'Address',
          email: 'Email',
          vat: 'VAT number',
          phone: 'Phone',
          register: 'Register',
        },
        form: 'Private limited company (osaühing) under Estonian law',
        register: 'Estonian Commercial Register (Äriregister), registry code {code}',
        sections: [
          {
            title: 'About the content',
            body: [
              'I write and check everything on this site with care, but I can’t guarantee it’s always complete or up to date. Prices, timelines and offers only become binding once I confirm them to you in writing.',
            ],
          },
          {
            title: 'Links to other sites',
            body: ['Links to other sites are there for convenience. I have no control over those sites and I’m not responsible for what’s on them.'],
          },
          {
            title: 'Copyright',
            body: ['The design, code, text and images on this site are mine unless stated otherwise. Please ask before reusing any of it: {email}.'],
          },
        ],
      },

      privacy: {
        title: 'Privacy policy',
        intro: 'What this site collects, why, and what you can do about it. Short version: no tracking, no analytics, no ads, and nothing is sold or shared for marketing.',
        sections: [
          {
            title: 'Who is responsible',
            body: [
              'This site is run by Nexomaker OÜ, my company, represented by me, Aaron Anehasse Romera. Nexomaker OÜ is the controller of your personal data. The full company details are on the imprint page.',
              'For anything about your data, email {email}.',
            ],
          },
          {
            title: 'When you visit',
            body: [
              'The site is hosted by Vercel. To deliver pages and keep the service secure, Vercel’s servers log technical data about each request: your IP address, browser, the page requested and the time. The legal basis is legitimate interest (GDPR Art. 6(1)(f)): a website can’t be served or protected without it. Vercel keeps these logs only for a limited time.',
              'There are no analytics, tracking pixels, ads or third-party embeds, and the site sets no cookies.',
            ],
          },
          {
            title: 'Stored on your device',
            body: [
              'The site saves two things in your browser’s local storage, and they never leave your device:',
              [
                'Your language choice, so the site stays in the language you picked.',
                'A draft of the contact form while you fill it in, so you don’t lose it on a reload. It’s removed once you send the request.',
              ],
              'Both only exist to do what you asked for, so no consent is needed. You can remove them at any time by clearing this site’s data in your browser.',
            ],
          },
          {
            title: 'When you send a project request',
            body: [
              'The contact form collects your name, email, company (if you give it) and everything you tell me about the project, including any links. I use it to reply, to prepare a quote or a free preview, and, if we work together, to run the project.',
              'The legal basis is taking steps at your request before entering into a contract (GDPR Art. 6(1)(b)). The request reaches me by email, and you get an automatic copy of what you sent.',
            ],
          },
          {
            title: 'Who else handles it',
            body: [
              'Only the services needed to run the site and deliver email, each bound by a data processing agreement:',
              [
                'Vercel Inc.: hosting, and the server function that receives the form.',
                'Resend: sends the request to me and the copy to you.',
                'My email provider: the inbox the request arrives in.',
              ],
              'Your data isn’t sold, rented or used for marketing.',
            ],
          },
          {
            title: 'Transfers outside the EU',
            body: [
              'Vercel and Resend are based in the United States, so your data may be processed there. These transfers rely on the EU–US Data Privacy Framework or on the European Commission’s standard contractual clauses.',
            ],
          },
          {
            title: 'How long it’s kept',
            body: [
              'Requests that don’t lead to a project are deleted within 12 months. If we work together, I keep what’s needed for the project for as long as it runs, and invoices and related records for as long as accounting and tax law requires (7 years in Estonia).',
            ],
          },
          {
            title: 'Security',
            body: [
              'The whole site is served only over an encrypted HTTPS (TLS) connection, so everything between your browser and the site, including what you send through the contact form, is encrypted in transit.',
              'Beyond that, I take appropriate technical and organisational measures to protect your data (GDPR Art. 32): access to requests is limited to me, and I only use providers that apply recognised security standards.',
            ],
          },
          {
            title: 'Your rights',
            body: [
              'Under the GDPR you can:',
              [
                'ask for a copy of the data I hold about you',
                'have it corrected if it’s wrong',
                'have it deleted',
                'restrict how it’s used',
                'receive it in a portable format',
                'object to processing based on legitimate interest',
              ],
              'Email {email} and I’ll reply within one month. No decisions about you are made automatically.',
            ],
          },
          {
            title: 'Complaints',
            body: [
              'If you think your data is being mishandled, please tell me first so I can fix it. You can also complain to a data protection authority: the Estonian Data Protection Inspectorate (Andmekaitse Inspektsioon, aki.ee), where Nexomaker OÜ is registered, or the authority where you live or work, such as the Belgian Data Protection Authority (dataprotectionauthority.be).',
            ],
          },
          {
            title: 'Changes',
            body: ['If this policy changes, the new version is posted here with a new date at the top.'],
          },
        ],
      },
    },
  },
}
