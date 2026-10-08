import type { NotificationSettings, SiteSettings } from "@/types/content";

/**
 * Default, non-secret site settings. Contact details are intentionally empty:
 * nothing is shown publicly until a real value is entered in /admin/settings.
 */
export const settingsSeed: SiteSettings = {
  general: {
    companyName: "ParitySoft AI",
    siteUrl: "https://parisoftai.com",
    description:
      "ParitySoft AI develops mobile, desktop, and cross-platform applications. Explore our software development services and digital products.",
    footerDescription:
      "Mobile app development and digital product engineering for iOS, Android, macOS, Windows and AI-powered software.",
    logoUrl: "",
    faviconUrl: "",
    contactEmail: "",
    phone: "",
    location: "",
    socials: [],
  },
  branding: {
    primary: "#6366F1",
    secondary: "#8B5CF6",
    highlight: "#22D3EE",
  },
  seo: {
    defaultTitle: "ParitySoft AI | Mobile App & Software Development",
    titleTemplate: "%s | ParitySoft AI",
    defaultDescription:
      "ParitySoft AI develops mobile, desktop, and cross-platform applications. Explore our software development services and digital products.",
    ogImage: "",
  },
  contact_form: {
    budgetOptions: ["Under $5,000", "$5,000 – $15,000", "$15,000 – $40,000", "$40,000+", "Not sure yet"],
    timelineOptions: ["As soon as possible", "1–3 months", "3–6 months", "6+ months", "Flexible"],
    consentText:
      "I agree that ParitySoft AI may store the information I submit so it can respond to my inquiry.",
    retentionDays: 730,
  },
};

export const notificationSeed: NotificationSettings = {
  enabled: true,
  recipients: [],
};
