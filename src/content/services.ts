import type { Service } from "@/types/content";

/**
 * Seed copy for service pages. This is the source for supabase/seed.sql and the
 * fallback content used when Supabase is not configured (local development).
 * Edit live content in the admin panel, not here.
 */
type ServiceSeed = Omit<Service, "id" | "status" | "updatedAt" | "coverImage">;

export const serviceSeeds: ServiceSeed[] = [
  {
    slug: "ios-app-development",
    title: "iOS App Development",
    icon: "apple",
    shortDescription:
      "Native iPhone and iPad apps built with Swift and SwiftUI that feel at home on Apple platforms and pass App Store review cleanly.",
    fullDescription:
      "We build native iOS apps in Swift and SwiftUI, following Apple's Human Interface Guidelines so your product behaves the way iPhone users expect. From the first prototype to App Store submission, we focus on smooth performance, accessibility, and a codebase your team can keep extending.",
    problems: [
      "Your app needs to feel genuinely native, not like a web page wrapped in a shell.",
      "You need features that depend on Apple frameworks such as HealthKit, StoreKit, widgets, or push notifications.",
      "An existing iOS codebase has become hard to change and slow to release.",
      "You are unsure how to get through App Store review and subscription setup.",
    ],
    features: [
      { title: "SwiftUI interfaces", description: "Modern declarative UI with support for Dynamic Type, Dark Mode and VoiceOver." },
      { title: "Platform integrations", description: "Widgets, notifications, in-app purchases, Sign in with Apple, and system frameworks." },
      { title: "Offline-ready data", description: "Local persistence and sync strategies that keep the app usable on poor connections." },
      { title: "Release management", description: "TestFlight builds, App Store Connect setup, metadata, and review preparation." },
    ],
    benefits: [
      "Native performance and platform conventions users already understand",
      "Direct access to the latest Apple APIs as they ship",
      "A maintainable architecture that scales with new features",
    ],
    approach: [
      { title: "Product discovery", description: "Clarify users, core flows, and the Apple capabilities the app depends on." },
      { title: "Architecture", description: "Choose data, networking and state patterns (typically MVVM) before writing features." },
      { title: "Iterative builds", description: "Ship TestFlight builds regularly so you can try real features early." },
      { title: "Launch", description: "Prepare App Store assets, privacy details and submission, then support the release." },
    ],
    technologies: ["Swift", "SwiftUI", "UIKit", "Combine", "Swift Concurrency", "Core Data", "SwiftData", "StoreKit", "XCTest"],
    faq: [
      {
        question: "Should I build native iOS or cross-platform?",
        answer:
          "Native is the stronger choice when your product depends on Apple-specific features, demanding performance, or a premium iOS feel. If you need iOS and Android quickly with a shared codebase, Flutter is often more cost-effective. We'll recommend one after understanding your requirements.",
      },
      {
        question: "Do you handle App Store submission?",
        answer:
          "Yes. We prepare builds, App Store Connect configuration, screenshots and privacy disclosures, and we help you respond to any review feedback.",
      },
      {
        question: "Can you take over an existing iOS app?",
        answer:
          "Yes. We start with a code review to understand its current state, then propose a practical plan for fixes, modernization and new features.",
      },
    ],
    seoTitle: "iOS App Development | Swift & SwiftUI",
    seoDescription:
      "Native iPhone and iPad app development with Swift and SwiftUI — from product discovery to App Store launch and ongoing support.",
    sortOrder: 10,
  },
  {
    slug: "android-app-development",
    title: "Android App Development",
    icon: "smartphone",
    shortDescription:
      "Native Android apps in Kotlin and Jetpack Compose, designed for the wide range of devices your users actually own.",
    fullDescription:
      "We develop native Android applications in Kotlin with Jetpack Compose and Material 3. Our focus is reliable behavior across screen sizes and OS versions, efficient battery and network use, and a clean architecture that keeps features easy to add.",
    problems: [
      "Your app must work well across many devices, screen sizes and Android versions.",
      "You need deep Android integrations such as background work, notifications or hardware access.",
      "Crash rates or ANRs are hurting your Play Store ratings.",
      "A legacy Java or XML-based app needs a modern foundation.",
    ],
    features: [
      { title: "Jetpack Compose UI", description: "Material 3 interfaces with adaptive layouts for phones, foldables and tablets." },
      { title: "Clean architecture", description: "MVVM, dependency injection with Hilt, and clear separation of data and UI layers." },
      { title: "Background & sync", description: "WorkManager, notifications and offline-first data with Room." },
      { title: "Play Store release", description: "Signing, staged rollouts, store listing and policy compliance." },
    ],
    benefits: [
      "Consistent experience across a fragmented device landscape",
      "Lower crash rates through careful lifecycle and state handling",
      "A modern Kotlin codebase that is straightforward to maintain",
    ],
    approach: [
      { title: "Requirements", description: "Map user flows, target devices and minimum Android version." },
      { title: "Architecture", description: "Set up modules, DI and data layers before feature work begins." },
      { title: "Build & test", description: "Develop in short iterations with internal test tracks for early feedback." },
      { title: "Release", description: "Staged rollout on Google Play with monitoring of crashes and performance." },
    ],
    technologies: ["Kotlin", "Jetpack Compose", "Material 3", "Coroutines", "Flow", "Hilt", "Room", "WorkManager", "Retrofit"],
    faq: [
      {
        question: "Can you migrate our Java/XML app to Kotlin and Compose?",
        answer:
          "Yes. We usually migrate incrementally, screen by screen, so the app keeps shipping while the codebase is modernized.",
      },
      {
        question: "Which Android versions will you support?",
        answer:
          "We recommend a minimum version based on your audience and required APIs, balancing reach against development and testing cost.",
      },
    ],
    seoTitle: "Android App Development | Kotlin & Compose",
    seoDescription:
      "Native Android app development with Kotlin, Jetpack Compose and Material 3 — reliable across devices and ready for Google Play.",
    sortOrder: 20,
  },
  {
    slug: "flutter-app-development",
    title: "Flutter Cross-Platform Development",
    icon: "layers",
    shortDescription:
      "One Flutter codebase for iOS, Android and beyond — faster delivery without giving up a polished, consistent interface.",
    fullDescription:
      "Flutter lets us ship a single, well-structured Dart codebase to iOS and Android, with desktop and web targets available when needed. We use proven state-management patterns and platform channels so your app stays fast, testable and able to use native features.",
    problems: [
      "You need iOS and Android at the same time on a realistic budget.",
      "Keeping two native codebases in sync is slowing your team down.",
      "You want a custom, branded UI that looks identical on every platform.",
      "An existing Flutter app has grown hard to maintain.",
    ],
    features: [
      { title: "Shared codebase", description: "One Dart codebase for iOS and Android, with optional macOS, Windows and web targets." },
      { title: "Structured state", description: "Riverpod or BLoC with clear layers, making features predictable and testable." },
      { title: "Native bridges", description: "Platform channels and plugins for device features when packages aren't enough." },
      { title: "Automated testing", description: "Unit, widget and integration tests to protect releases." },
    ],
    benefits: [
      "Shorter time to market on both major mobile platforms",
      "One team and one codebase to maintain",
      "Pixel-consistent branding across devices",
    ],
    approach: [
      { title: "Scope", description: "Confirm which platforms and native features the product needs." },
      { title: "Foundation", description: "Set up architecture, theming, navigation and CI." },
      { title: "Feature delivery", description: "Build in iterations with test builds for both platforms." },
      { title: "Store launch", description: "Release to App Store and Google Play together." },
    ],
    technologies: ["Flutter", "Dart", "Riverpod", "BLoC", "go_router", "Firebase", "Platform Channels"],
    faq: [
      {
        question: "Is Flutter good enough for production apps?",
        answer:
          "Yes, for most product categories. It is less suitable when an app depends heavily on cutting-edge platform-specific APIs, which we'll flag during discovery.",
      },
      {
        question: "Can a Flutter app also run on desktop?",
        answer:
          "Flutter supports macOS, Windows and Linux. We'll assess whether your plugins and UI patterns translate well to desktop before committing to it.",
      },
    ],
    seoTitle: "Flutter App Development | Cross-Platform",
    seoDescription:
      "Cross-platform Flutter and Dart app development for iOS and Android from one maintainable codebase.",
    sortOrder: 30,
  },
  {
    slug: "desktop-app-development",
    title: "macOS & Windows Applications",
    icon: "monitor",
    shortDescription:
      "Desktop software for macOS and Windows that respects each platform's conventions and handles real productivity workloads.",
    fullDescription:
      "We build desktop applications for macOS and Windows — native where platform integration matters, cross-platform where a shared codebase makes more sense. Typical work includes productivity tools, utilities, companion apps for mobile products and internal business software.",
    problems: [
      "Your users work on desktops and need more than a browser tab can offer.",
      "You need file system access, menu bar or system tray presence, or offline operation.",
      "You want your mobile product to have a matching desktop companion.",
      "Distribution, code signing and updates feel complicated.",
    ],
    features: [
      { title: "Native macOS", description: "SwiftUI and AppKit apps including menu bar utilities and document-based apps." },
      { title: "Windows apps", description: "Modern Windows applications with packaging for the Microsoft Store or direct distribution." },
      { title: "Shared logic", description: "Cross-platform options such as Flutter desktop when one codebase fits best." },
      { title: "Distribution", description: "Code signing, notarization, installers and update strategies." },
    ],
    benefits: [
      "Software that feels native on each operating system",
      "Offline capability and deep OS integration",
      "A clear plan for signing, distribution and updates",
    ],
    approach: [
      { title: "Platform fit", description: "Decide between native and shared codebases based on features and budget." },
      { title: "Design", description: "Adapt layouts and interactions to desktop conventions such as menus and keyboard shortcuts." },
      { title: "Build", description: "Develop and test on each target OS throughout the project." },
      { title: "Ship", description: "Sign, notarize, package and publish through the right stores or channels." },
    ],
    technologies: ["Swift", "SwiftUI", "AppKit", "C#", ".NET", "WinUI", "Flutter Desktop"],
    faq: [
      {
        question: "Can you publish to the Mac App Store and Microsoft Store?",
        answer:
          "Yes. We can also set up direct distribution with signed installers when store distribution is not the right fit.",
      },
    ],
    seoTitle: "macOS & Windows Desktop App Development",
    seoDescription:
      "Desktop application development for macOS and Windows — native or cross-platform, signed, packaged and ready to distribute.",
    sortOrder: 40,
  },
  {
    slug: "backend-development",
    title: "Backend & API Development",
    icon: "server",
    shortDescription:
      "Secure REST APIs, authentication and cloud backends that give your apps reliable data, accounts and integrations.",
    fullDescription:
      "Apps are only as dependable as the systems behind them. We design and build backends and REST APIs with clear contracts, sensible security and room to grow — using managed platforms such as Supabase or Firebase where they fit, and custom Node.js services where they don't.",
    problems: [
      "Your app needs user accounts, data sync or subscriptions handled securely.",
      "You must integrate payment providers, third-party APIs or internal systems.",
      "An existing backend is slow, hard to change or poorly documented.",
      "You are unsure which cloud services to use and what they will cost.",
    ],
    features: [
      { title: "API design", description: "Documented REST APIs with validation, versioning and consistent error handling." },
      { title: "Auth & security", description: "Authentication, role-based access and secure secret management." },
      { title: "Data modeling", description: "PostgreSQL schemas, migrations and row-level security where appropriate." },
      { title: "Integrations", description: "Payments, email, push notifications and third-party services." },
    ],
    benefits: [
      "A dependable foundation for mobile, desktop and web clients",
      "Security built in from the start rather than bolted on",
      "Infrastructure choices matched to your scale and budget",
    ],
    approach: [
      { title: "Requirements", description: "Define data, integrations, access rules and expected load." },
      { title: "Design", description: "Model the schema and API contract before implementation." },
      { title: "Implement", description: "Build with automated tests, migrations and environment separation." },
      { title: "Operate", description: "Deploy with monitoring, backups and documentation." },
    ],
    technologies: ["Node.js", "TypeScript", "PostgreSQL", "Supabase", "Firebase", "REST", "Docker"],
    faq: [
      {
        question: "Do you work with our existing backend?",
        answer:
          "Yes. We can integrate apps with your current APIs, or help improve and extend them after reviewing the existing system.",
      },
    ],
    seoTitle: "Backend & REST API Development",
    seoDescription:
      "Secure backend and REST API development with Node.js, PostgreSQL, Supabase and Firebase for mobile and desktop apps.",
    sortOrder: 50,
  },
  {
    slug: "ai-integration",
    title: "AI Integration",
    icon: "sparkles",
    shortDescription:
      "Practical AI features — assistants, smart search, summarization and on-device intelligence — added where they genuinely help users.",
    fullDescription:
      "We help you add AI capabilities to new and existing apps in ways that are useful, measurable and responsible. That can mean integrating large language model APIs, building retrieval over your own content, or running models on-device for privacy and speed.",
    problems: [
      "You want to add AI to your product but are unsure where it creates real value.",
      "Users need to search, summarize or ask questions about large amounts of content.",
      "Privacy requirements mean some data should never leave the device.",
      "You need to control AI costs, latency and output quality.",
    ],
    features: [
      { title: "LLM features", description: "Chat, drafting, summarization and classification using leading model APIs." },
      { title: "Retrieval (RAG)", description: "Answers grounded in your own documents and data, with source references." },
      { title: "On-device ML", description: "Core ML, ML Kit and lightweight models for private, offline features." },
      { title: "Guardrails", description: "Input/output validation, rate limits, cost controls and evaluation." },
    ],
    benefits: [
      "AI features scoped to clear user outcomes",
      "Server-side key management and data-handling safeguards",
      "Measurable quality through evaluation before and after launch",
    ],
    approach: [
      { title: "Use-case review", description: "Identify tasks where AI measurably improves the user experience." },
      { title: "Prototype", description: "Test feasibility, quality and cost on real examples." },
      { title: "Integrate", description: "Build the feature into your app with security and fallbacks." },
      { title: "Evaluate", description: "Monitor quality, latency and cost, and iterate." },
    ],
    technologies: ["LLM APIs", "RAG", "Embeddings", "Core ML", "ML Kit", "TensorFlow Lite", "Python"],
    faq: [
      {
        question: "Will our data be used to train AI models?",
        answer:
          "We select providers and configurations based on your data-handling requirements and document how data flows. Provider terms vary, so we review them with you before integration.",
      },
      {
        question: "Can AI run without an internet connection?",
        answer:
          "Some features can run on-device using smaller models. We'll tell you which of your use cases are realistic offline.",
      },
    ],
    seoTitle: "AI Integration for Mobile & Desktop Apps",
    seoDescription:
      "Add practical AI features to your apps — LLM integrations, retrieval over your content and on-device machine learning.",
    sortOrder: 60,
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    icon: "pen-tool",
    shortDescription:
      "User flows, interfaces and design systems that make your product easy to understand and pleasant to use.",
    fullDescription:
      "Good engineering needs a clear design to build against. We map user journeys, create wireframes and high-fidelity interfaces, and assemble design systems that keep your product consistent as it grows — always with accessibility and real implementation constraints in mind.",
    problems: [
      "Users get lost or drop off in key flows such as onboarding or checkout.",
      "Your product looks inconsistent across screens and platforms.",
      "Developers lack a clear, complete design to build from.",
      "You need to validate an idea before investing in full development.",
    ],
    features: [
      { title: "UX research & flows", description: "User journeys, information architecture and wireframes." },
      { title: "Interface design", description: "High-fidelity screens for mobile, desktop and web." },
      { title: "Prototypes", description: "Clickable prototypes to test ideas with stakeholders and users." },
      { title: "Design systems", description: "Reusable components, tokens and documentation for consistent delivery." },
    ],
    benefits: [
      "Clearer products that need less explaining",
      "Faster development thanks to complete, consistent specs",
      "Accessibility considered from the first wireframe",
    ],
    approach: [
      { title: "Understand", description: "Learn about your users, goals and constraints." },
      { title: "Structure", description: "Define flows and wireframes before visual design." },
      { title: "Design", description: "Create interfaces and a component library." },
      { title: "Hand off", description: "Deliver specs and support developers during implementation." },
    ],
    technologies: ["Figma", "Design Systems", "Prototyping", "Human Interface Guidelines", "Material Design", "WCAG"],
    faq: [
      {
        question: "Can you design only, without developing?",
        answer: "Yes. We can deliver designs and a design system for your own team to implement.",
      },
    ],
    seoTitle: "UI/UX Design for Apps & Software",
    seoDescription:
      "UI/UX design for mobile and desktop apps — user flows, interfaces, prototypes and design systems built for implementation.",
    sortOrder: 70,
  },
  {
    slug: "app-maintenance-modernization",
    title: "Application Maintenance & Support",
    icon: "wrench",
    shortDescription:
      "Keep existing apps healthy — OS updates, bug fixes, performance work and gradual modernization of older codebases.",
    fullDescription:
      "Software needs care after launch. We keep apps compatible with new OS releases and store policies, fix bugs, improve performance, and modernize aging code in manageable steps so your product keeps moving without risky rewrites.",
    problems: [
      "New iOS or Android versions keep breaking your app.",
      "Store policy changes or deprecated SDKs threaten your listing.",
      "The original developers are gone and nobody understands the code.",
      "Performance and crash rates are slowly getting worse.",
    ],
    features: [
      { title: "Code audit", description: "An honest assessment of code health, risks and priorities." },
      { title: "OS & SDK updates", description: "Compatibility work for new platform releases and policy requirements." },
      { title: "Stability & performance", description: "Crash fixing, profiling and optimization." },
      { title: "Incremental modernization", description: "Step-by-step migration to current languages and frameworks." },
    ],
    benefits: [
      "Fewer surprises at each OS release",
      "Lower long-term cost than a full rewrite",
      "A codebase your team can understand again",
    ],
    approach: [
      { title: "Audit", description: "Review the codebase, build pipeline and crash data." },
      { title: "Stabilize", description: "Fix the highest-impact issues first." },
      { title: "Modernize", description: "Improve architecture and dependencies incrementally." },
      { title: "Support", description: "Ongoing updates on an agreed schedule." },
    ],
    technologies: ["Swift", "Kotlin", "Flutter", "Objective-C", "Java", "CI/CD", "Crash Reporting"],
    faq: [
      {
        question: "Do you offer ongoing maintenance agreements?",
        answer:
          "Yes. After an initial audit we can agree on a scope and schedule that fits your product's needs.",
      },
    ],
    seoTitle: "App Maintenance & Modernization",
    seoDescription:
      "Mobile and desktop app maintenance — OS updates, bug fixing, performance work and incremental modernization.",
    sortOrder: 80,
  },
];
