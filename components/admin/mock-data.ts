/**
 * components/admin/mock-data.ts
 *
 * UI placeholder mock data for Phase 9 Admin, Billing, Members, Audit Log, and Security experiences.
 * Replace with real backend API responses when endpoints are connected.
 */

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: "Admin" | "Editor" | "Viewer";
  status: "Active" | "Pending" | "Suspended";
  joinedAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userName: string;
  userAvatar: string;
  action: string;
  actionCategory: "Security" | "Billing" | "Member" | "Repository";
  target: string;
  details: string;
  ipAddress: string;
}

export interface SubscriptionPlan {
  id: "free" | "pro" | "org";
  name: string;
  badge?: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  limits: {
    repos: string;
    seats: string;
    aiQueries: string;
    snapshots: string;
  };
  highlighted?: boolean;
}

export const MOCK_CURRENT_PLAN = {
  id: "pro" as const,
  name: "Pro Plan",
  status: "Active" as const,
  renewsAt: "September 1, 2026",
  amount: "$29.00 / month",
  paymentMethod: "Visa ending in 4242",
  isDevMode: true,
};

export const MOCK_SEAT_STATS = {
  usedSeats: 3,
  totalSeats: 5,
};

export const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Essential 3D repository visualization for individual open-source developers.",
    features: [
      "1 Connected Workspace Repository",
      "Full Explorer Mode Access (Public Repos)",
      "Interactive 3D Dependency Graph",
      "Standard AI Module Summaries",
      "1 Team Seat",
      "Community Support",
    ],
    limits: {
      repos: "1 Repo",
      seats: "1 Seat",
      aiQueries: "50 / day",
      snapshots: "3 Snapshots",
    },
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most Popular",
    price: "$29",
    period: "per month",
    description:
      "Advanced intelligence and architecture tracking for professional software engineers.",
    features: [
      "Up to 10 Private & Public Repositories",
      "Unlimited 3D Dependency Maps & LOD",
      "Ask the Codebase AI Chat (Grounded)",
      "Architecture Snapshots & Visual Diffing",
      "Complexity Heatmap Overlay",
      "Contributor Activity Timelines",
      "3 Team Seats included",
      "Priority Email Support",
    ],
    limits: {
      repos: "10 Repos",
      seats: "3 Seats",
      aiQueries: "500 / day",
      snapshots: "Unlimited",
    },
    highlighted: true,
  },
  {
    id: "org",
    name: "Organization",
    badge: "Enterprise Ready",
    price: "$99",
    period: "per month",
    description: "Complete security, governance, RBAC, and audit controls for engineering teams.",
    features: [
      "Unlimited Repositories (Public & Private)",
      "Role-Based Access Control (Admin/Editor/Viewer)",
      "Encrypted Token Storage at Rest (AES-256)",
      "Organization Security Audit Logging",
      "Resend Email Architecture Alerts",
      "Slack / Discord Webhook Integration",
      "10 Team Seats included ($10/additional)",
      "Dedicated 24/7 Priority Support",
    ],
    limits: {
      repos: "Unlimited",
      seats: "10 Seats included",
      aiQueries: "Unlimited",
      snapshots: "Unlimited",
    },
  },
];

export const MOCK_MEMBERS: OrganizationMember[] = [
  {
    id: "mem-1",
    name: "Ayush Lohiya",
    email: "ayush@structa.dev",
    avatarUrl: "https://github.com/9140ayush.png",
    role: "Admin",
    status: "Active",
    joinedAt: "Jan 12, 2026",
  },
  {
    id: "mem-2",
    name: "Sarah Chen",
    email: "sarah.chen@structa.dev",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    role: "Editor",
    status: "Active",
    joinedAt: "Mar 04, 2026",
  },
  {
    id: "mem-3",
    name: "Marcus Vance",
    email: "marcus.vance@structa.dev",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "Viewer",
    status: "Active",
    joinedAt: "May 18, 2026",
  },
  {
    id: "mem-4",
    name: "Elena Rostova",
    email: "elena.r@structa.dev",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "Editor",
    status: "Pending",
    joinedAt: "Aug 10, 2026",
  },
];

export const MOCK_AUDIT_LOGS: AuditEvent[] = [
  {
    id: "aud-1",
    timestamp: "2 minutes ago",
    userName: "Ayush Lohiya",
    userAvatar: "https://github.com/9140ayush.png",
    action: "Repository Sync Triggered",
    actionCategory: "Repository",
    target: "Structa / main",
    details: "Initiated manual 3D graph re-sync for main branch.",
    ipAddress: "192.168.1.42",
  },
  {
    id: "aud-2",
    timestamp: "1 hour ago",
    userName: "Ayush Lohiya",
    userAvatar: "https://github.com/9140ayush.png",
    action: "Member Role Changed",
    actionCategory: "Member",
    target: "Marcus Vance (Developer -> Viewer)",
    details: "Downgraded seat permissions to Viewer role.",
    ipAddress: "192.168.1.42",
  },
  {
    id: "aud-3",
    timestamp: "3 hours ago",
    userName: "Sarah Chen",
    userAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    action: "Architecture Annotation Pinned",
    actionCategory: "Repository",
    target: "components/three/GraphCanvasWrapper.tsx",
    details: "Added sticky note annotation: 'LOD threshold toggle optimization'.",
    ipAddress: "10.0.4.19",
  },
  {
    id: "aud-4",
    timestamp: "1 day ago",
    userName: "Ayush Lohiya",
    userAvatar: "https://github.com/9140ayush.png",
    action: "Plan Upgraded to Pro",
    actionCategory: "Billing",
    target: "Pro Subscription Plan",
    details: "Upgraded organization tier from Free to Pro.",
    ipAddress: "192.168.1.42",
  },
  {
    id: "aud-5",
    timestamp: "2 days ago",
    userName: "System Security",
    userAvatar: "",
    action: "GitHub Token Rotated",
    actionCategory: "Security",
    target: "Private Repo Access Scope",
    details: "AES-256 encrypted access token verified and rotated successfully.",
    ipAddress: "Internal KMS",
  },
  {
    id: "aud-6",
    timestamp: "4 days ago",
    userName: "Ayush Lohiya",
    userAvatar: "https://github.com/9140ayush.png",
    action: "Member Invited",
    actionCategory: "Member",
    target: "Elena Rostova (Editor)",
    details: "Sent seat invitation to elena.r@structa.dev.",
    ipAddress: "192.168.1.42",
  },
];

export const MOCK_SECURITY_OVERVIEW = {
  githubOAuth: {
    status: "Connected" as const,
    account: "9140ayush",
    scopes: ["read:user", "repo (read-only)"],
    lastVerified: "Today at 08:30 AM",
  },
  privateTokens: {
    status: "Protected" as const,
    encryption: "AES-256-GCM",
    keyStorage: "Hardware Security Module (HSM)",
    statusText: "Token storage encrypted at rest.",
  },
  explorerIsolation: {
    status: "Isolated" as const,
    rule: "Public Repositories Only",
    defenseInDepth: "Private repository data is strictly excluded from Explorer cache.",
  },
};
