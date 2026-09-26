// English source strings for the farmer portal. Every key here is available in both
// languages; see ur.ts for how Urdu is supplied. Add a string here, use it via t("key").
// Admin screens are intentionally not part of this: they stay English.

export const en = {
  "common.signOut": "Sign out",
  "common.signingOut": "Signing out…",
  "common.continue": "Continue",
  "common.saving": "Saving…",
  "common.view": "View",
  "common.save": "Save",
  "common.welcomeBack": "Welcome back",

  "nav.dashboard": "Dashboard",
  "nav.flocks": "Flocks",
  "nav.dailyEntry": "Daily Entry",
  "nav.attributes": "Attributes",
  "nav.reports": "Reports",
  "nav.alerts": "Alerts",
  "nav.assistant": "AI Assistant",
  "nav.settings": "Settings",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.unreadAlerts": "unread alerts",
  "nav.brandTagline": "AI Poultry Doctor",

  "dashboard.headline": "Healthy Flocks, Stronger Farm",
  "dashboard.tagline": "Disease detection, treatment guidance, daily reporting and expert advice, all in one place.",
  "dashboard.myFlocks": "My Flocks",
  "dashboard.totalBirds": "Total Birds",
  "dashboard.activeAlerts": "Active Alerts",
  "dashboard.thisWeek": "This Week",
  "dashboard.entry": "entry",
  "dashboard.entries": "entries",
  "dashboard.deaths": "deaths",

  "assistant.title": "Dr. Hen Assistant",
  "assistant.subtitle": "Ask any poultry question, any time.",
  "assistant.chatAi": "Chat with AI Assistant",
  "assistant.chatWhatsapp": "Chat on WhatsApp",
  "assistant.whatsappUnavailable": "Chat on WhatsApp · unavailable",

  "flocks.title": "My Flocks",
  "flocks.subtitle": "Keep this list matching the birds on your farm.",
  "flocks.empty": "No flocks yet. Add your first flock to start recording daily data.",
  "flocks.birds": "Birds",
  "flocks.age": "Age",
  "flocks.weeks": "weeks",
  "flocks.viewDetails": "View Details",
  "flocks.inactive": "Inactive",

  "alerts.title": "Alerts",
  "alerts.empty": "No alerts. Alerts appear here when your daily entries cross a warning level.",
  "alerts.resolvedHeading": "Resolved",
  "alerts.allFlocks": "All flocks",
  "alerts.acknowledged": "acknowledged",
  "alerts.disclaimer": "Alerts prompt a review. Serious health problems should be escalated to a qualified vet.",

  "settings.title": "Settings",
  "settings.languageHeading": "Language",
  "settings.languageHelp": "Choose the language used in your portal.",
  "settings.saved": "Language updated.",
  "settings.error": "Could not save. Please try again.",

  "language.title": "Choose your language",
  "language.subtitle": "You can change this later in Settings.",
  "language.english": "English",
  "language.urdu": "اردو",
} as const;

export type I18nKey = keyof typeof en;
export type Dict = Record<I18nKey, string>;
