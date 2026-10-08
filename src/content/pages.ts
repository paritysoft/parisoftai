import type { GenericPageContent, HomeContent, PageKey } from "@/types/content";

/**
 * Seed page content. Source for supabase/seed.sql and for the no-database
 * development fallback. Live content is edited in /admin/pages.
 */
export const homeSeed: HomeContent = {
  hero: {
    eyebrow: "Software development & digital innovation",
    headline: "We Build Digital Products That Make an Impact.",
    description:
      "From mobile apps to intelligent software solutions, we turn ambitious ideas into real digital experiences.",
    primaryCta: { label: "Start a Project", href: "/contact" },
    secondaryCta: { label: "Explore Our Work", href: "/work" },
    credibility: "Founded by an engineer with over 10 years of mobile app development experience.",
    backgroundImage: "",
  },
  sections: [
    {
      key: "stats",
      visible: true,
      heading: "Experience you can build on",
      description: "Figures marked as founder experience refer to our founder's career, not only to ParitySoft AI.",
      items: [
        { value: 10, suffix: "+", label: "Years of mobile development", note: "Founder's experience", verified: true },
        { value: 50, suffix: "+", label: "Applications worked on", note: "Founder's experience", verified: true },
        { value: 24.2, suffix: "K", label: "Total users", note: "Pending confirmation of scope and period", verified: false },
        { value: 200, suffix: "+", label: "Active subscribers", note: "Pending confirmation of scope and period", verified: false },
      ],
    },
    {
      key: "services",
      visible: true,
      heading: "End-to-End Software Development for a Digital-First World",
      description:
        "We design and build scalable, high-performance applications across mobile, desktop, and connected platforms.",
    },
    {
      key: "why",
      visible: true,
      heading: "Built on Experience. Driven by Engineering.",
      description: "What you can expect when you work with us.",
      items: [
        {
          title: "Native and cross-platform expertise",
          description:
            "Swift, Kotlin and Flutter under one roof, so the platform choice is made for your product, not for our convenience.",
        },
        {
          title: "Mobile and desktop engineering",
          description: "Experience across iOS, Android, macOS and Windows means your product can grow onto new devices.",
        },
        {
          title: "Practical product experience",
          description: "We build and maintain our own apps, so we understand releases, reviews, subscriptions and support.",
        },
        {
          title: "Thoughtful UI/UX",
          description: "Interfaces designed around real user flows, platform conventions and accessibility.",
        },
        {
          title: "Quality-focused development",
          description: "Code review, automated tests and staged releases are part of the process, not an add-on.",
        },
        {
          title: "Long-term maintainability",
          description: "Clear architecture and documentation so your product stays easy to change after launch.",
        },
      ],
    },
    {
      key: "tech",
      visible: true,
      heading: "Technology Expertise",
      description: "The languages, frameworks and tools we use every day — chosen for each product, not by habit.",
    },
    {
      key: "process",
      visible: true,
      heading: "From Idea to Impact",
      description: "A clear, collaborative process with visible progress at every step.",
      items: [
        { title: "Discover", description: "Understand business goals, users, requirements, and constraints." },
        { title: "Plan", description: "Define scope, technical architecture, milestones, and delivery approach." },
        { title: "Design", description: "Create user flows, interfaces, prototypes, and design systems." },
        { title: "Develop", description: "Implement, integrate, review, and test the software." },
        { title: "Launch & Improve", description: "Prepare releases, monitor quality, and support improvements." },
      ],
    },
    {
      key: "work",
      visible: true,
      heading: "Featured Projects",
      description: "Selected projects, shown with the permission and attribution they require.",
    },
    {
      key: "products",
      visible: true,
      heading: "Featured Products",
      description: "Beyond client development, we build and maintain our own digital products.",
    },
    {
      key: "proof",
      visible: true,
      heading: "What clients say",
      fallbackHeading: "Founder-Led Engineering Experience",
      description: "The experience behind the work we deliver.",
      testimonials: [],
      highlights: [
        {
          title: "A decade of shipping mobile apps",
          description: "Our founder has worked on mobile applications for more than ten years, across native and cross-platform stacks.",
        },
        {
          title: "Publisher of our own products",
          description: "We design, release and support our own software, which keeps our process grounded in real-world results.",
        },
        {
          title: "Store-ready from day one",
          description: "App Store, Google Play and Microsoft Store requirements are planned for from the start of every project.",
        },
      ],
    },
    {
      key: "cta",
      visible: true,
      heading: "Ready to Bring Your Idea to Life?",
      description:
        "Whether you're planning a mobile app, desktop solution, or intelligent software product, we'd love to hear about your project.",
      primaryCta: { label: "Start a Project", href: "/contact" },
      secondaryCta: { label: "Contact Us", href: "/contact#details" },
    }
  ],
};

export const aboutSeed: GenericPageContent = {
  heading: "Engineering What's Next.",
  intro:
    "ParitySoft AI is a software development company focused on mobile and desktop applications, AI-powered features and digital product engineering. We build software for clients and publish our own products.",
  mission:
    "Turn ambitious ideas into reliable, well-crafted software that people enjoy using and businesses can depend on.",
  vision:
    "Be a trusted engineering partner for teams worldwide, known for products that perform on every platform they run on.",
  blocks: [
    { id: "about-h1", type: "heading", level: 2, text: "Our story" },
    {
      id: "about-rt1",
      type: "richText",
      markdown:
        "ParitySoft AI was founded by a mobile engineer with more than ten years of experience building iOS, Android and cross-platform applications.\n\nThe name reflects how we work: **parity** between platforms, so your product feels equally good on every device, and between design and engineering, so what is designed is what ships.",
    },
    {
      id: "about-fg1",
      type: "featureGrid",
      heading: "How we work",
      items: [
        { title: "Honest scoping", description: "We tell you what is realistic for your budget and timeline before work begins." },
        { title: "Visible progress", description: "Regular builds you can install and try, not just status reports." },
        { title: "Ownership", description: "You own the code, designs and accounts we create for your product." },
      ],
    },
    {
      id: "about-cta",
      type: "cta",
      heading: "Have a project in mind?",
      description: "Tell us about it and we'll reply with next steps.",
      label: "Start a Project",
      href: "/contact",
    },
  ],
};

export const contactSeed: GenericPageContent = {
  heading: "Start a project",
  intro:
    "Tell us what you're building. We read every inquiry and reply with questions or next steps — usually within two business days.",
  blocks: [
    {
      id: "contact-faq",
      type: "faq",
      heading: "Before you get in touch",
      items: [
        {
          question: "What should I include in my message?",
          answer: "Your goals, target platforms, any existing designs or code, and your timeline. Rough is fine.",
        },
        {
          question: "Do you sign NDAs?",
          answer: "Yes, we're happy to sign a reasonable NDA before you share confidential details.",
        },
      ],
    },
  ],
};

export const privacySeed: GenericPageContent = {
  heading: "Privacy Policy",
  intro: "How ParitySoft AI collects, uses and protects information submitted through this website.",
  notice:
    "Draft: this policy is a starting template and must be reviewed by a qualified legal professional before it is relied upon.",
  blocks: [
    {
      id: "pp-1",
      type: "richText",
      markdown: `## Information we collect

When you submit our contact form we collect the details you provide: your name, email address, company name (optional), the service you are interested in, optional budget and timeline preferences, and your project description.

To protect the form from abuse we store a one-way hash of your IP address for a limited time. We do not store your raw IP address alongside your inquiry.

We use privacy-friendly website analytics to understand aggregate page usage. These analytics do not use cookies to identify you personally.

## How we use your information

- To respond to your inquiry and discuss your project
- To keep a record of business communications
- To protect our website from spam and abuse

We do not sell your personal information.

## Retention

Inquiries are retained only as long as needed to respond and maintain business records, after which they are deleted.

## Service providers

We use third-party providers to host this website, store data and send email notifications. They process data on our behalf under their own security and privacy commitments.

## Your rights

You may ask us to access, correct or delete the personal information you have submitted. Contact us using the details on our contact page.

## Changes

We may update this policy. The latest version will always be published on this page.`,
    },
  ],
};

export const termsSeed: GenericPageContent = {
  heading: "Terms of Use",
  intro: "The terms that apply when you use the parisoftai.com website.",
  notice:
    "Draft: these terms are a starting template and must be reviewed by a qualified legal professional before they are relied upon.",
  blocks: [
    {
      id: "tos-1",
      type: "richText",
      markdown: `## Use of this website

This website provides information about ParitySoft AI and its services and products. You may browse it for personal and business purposes.

## Intellectual property

Unless stated otherwise, the content, design and code of this website belong to ParitySoft AI. Product names and trademarks of third parties belong to their respective owners.

## No warranty

Information on this website is provided in good faith but without warranty. Project terms are agreed separately in writing.

## Third-party links

This website may link to app stores and other external sites. We are not responsible for their content.

## Changes

We may update these terms. Continued use of the website means you accept the current version.`,
    },
  ],
};

export const pageSeeds: Record<PageKey, { title: string; content: HomeContent | GenericPageContent }> = {
  home: { title: "Home", content: homeSeed },
  about: { title: "About", content: aboutSeed },
  contact: { title: "Contact", content: contactSeed },
  privacy: { title: "Privacy Policy", content: privacySeed },
  terms: { title: "Terms of Use", content: termsSeed },
};
