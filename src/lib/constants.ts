export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/farmers", label: "Farmers", icon: "Users" },
  { href: "/flocks", label: "Flocks", icon: "Bird" },
  { href: "/treatments", label: "Treatments", icon: "Syringe" },
  { href: "/vaccination", label: "Vaccination", icon: "ShieldPlus" },
  { href: "/messages", label: "Messages", icon: "MessageSquare" },
  { href: "/reports", label: "Reports", icon: "FileBarChart" },
  { href: "/disease-guide", label: "Disease Guide", icon: "BookOpenText" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;

// Farmer portal menu. Entries are added as each screen ships, so no link ever
// points at a page that doesn't exist yet.
export const FARMER_NAV_ITEMS = [
  { href: "/farmer/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/farmer/flocks", label: "Flocks", icon: "Bird" },
  { href: "/farmer/daily-entry", label: "Daily Entry", icon: "ClipboardList" },
  { href: "/farmer/attributes", label: "Attributes", icon: "SlidersHorizontal" },
  { href: "/farmer/assistant", label: "AI Assistant", icon: "Bot" },
] as const;

export const FARMER_STATUS_LABEL: Record<string, string> = {
  HEALTHY: "Healthy",
  AT_RISK: "At Risk",
  UNDER_TREATMENT: "In Progress",
  ESCALATED: "Escalated",
};

export const FARMER_STATUS_COLOR: Record<string, string> = {
  HEALTHY: "bg-green-100 text-green-700",
  AT_RISK: "bg-amber-100 text-amber-700",
  UNDER_TREATMENT: "bg-blue-100 text-blue-700",
  ESCALATED: "bg-red-100 text-red-700",
};

export const TREATMENT_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
};

export const TREATMENT_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export const DISEASE_LABEL: Record<string, string> = {
  ND: "Newcastle Disease (Ranikhet)",
  IB: "Infectious Bronchitis",
  CRD: "Chronic Respiratory Disease",
  COCCIDIOSIS: "Coccidiosis",
  AI_H9: "Avian Influenza (H9)",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};
