/**
 * app/(dashboard)/admin/page.tsx
 *
 * Phase 9 — Billing, RBAC, Member Seats, Audit Logging, and Security Administration.
 * UI/UX implementation built using Structa's design tokens and components.
 */
"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Users,
  Shield,
  ShieldCheck,
  Lock,
  CheckCircle,
  Activity,
  History,
  Check,
  X,
  Search,
  UserPlus,
  ArrowRight,
  Sparkles,
  Info,
  ChevronRight,
  Key,
  Eye,
} from "lucide-react";
import {
  MOCK_CURRENT_PLAN,
  MOCK_PLANS,
  MOCK_MEMBERS,
  MOCK_AUDIT_LOGS,
  MOCK_SEAT_STATS,
  MOCK_SECURITY_OVERVIEW,
  type OrganizationMember,
} from "@/components/admin/mock-data";

type AdminTab = "overview" | "billing" | "members" | "rbac" | "audit" | "security";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // Notification Toast state for interactive demo actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Member Management State
  const [members, setMembers] = useState<OrganizationMember[]>(MOCK_MEMBERS);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<"Admin" | "Editor" | "Viewer">("Editor");

  // Invite Member Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Editor" | "Viewer">("Editor");

  // Audit Search & Filter State
  const [auditSearch, setAuditSearch] = useState("");
  const [auditCategory, setAuditCategory] = useState<string>("All");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenRoleModal = (member: OrganizationMember) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = () => {
    if (!selectedMember) return;
    setMembers((prev) =>
      prev.map((m) => (m.id === selectedMember.id ? { ...m, role: newRole } : m)),
    );
    setIsRoleModalOpen(false);
    showToast(`Updated role for ${selectedMember.name} to ${newRole} (Demo Mode)`);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newMember: OrganizationMember = {
      id: `mem-${Date.now()}`,
      name: inviteEmail.split("@")[0] || "New Member",
      email: inviteEmail,
      avatarUrl: "",
      role: inviteRole,
      status: "Pending",
      joinedAt: "Just now",
    };

    setMembers((prev) => [newMember, ...prev]);
    setInviteEmail("");
    setIsInviteModalOpen(false);
    showToast(`Invitation sent to ${inviteEmail} as ${inviteRole} (Demo Mode)`);
  };

  const filteredAuditLogs = MOCK_AUDIT_LOGS.filter((log) => {
    const matchesCategory = auditCategory === "All" || log.actionCategory === auditCategory;
    const q = auditSearch.toLowerCase();
    const matchesQuery =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="relative w-full flex-1 flex flex-col space-y-8 pb-12">
      {/* Toast Notification Floating Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-8 z-50 px-4 py-3 rounded-lg border border-accent/30 bg-surface-elevated/95 backdrop-blur-xl shadow-glow-primary text-xs font-mono text-foreground flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Organization Settings & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">
            Administration & Monetization
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-sans mt-1">
            Manage subscription tier, member seats, role-based access control, security audit logs,
            and encryption policies.
          </p>
        </div>

        {/* Development / Test Mode Badge */}
        <div className="px-3 py-1.5 rounded-lg border border-warning/30 bg-warning/10 text-warning font-mono text-xs flex items-center gap-2 shrink-0 shadow-sm">
          <Info className="w-4 h-4 shrink-0" />
          <span>Billing & RBAC in Test/UI Mode</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-px font-mono text-xs scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-accent text-accent bg-accent/5 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "billing"
              ? "border-accent text-accent bg-accent/5 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Plan & Billing</span>
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "members"
              ? "border-accent text-accent bg-accent/5 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members & Seats</span>
        </button>

        <button
          onClick={() => setActiveTab("rbac")}
          className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "rbac"
              ? "border-accent text-accent bg-accent/5 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Roles & Access</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "audit"
              ? "border-accent text-accent bg-accent/5 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "security"
              ? "border-accent text-accent bg-accent/5 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: OVERVIEW                                                     */}
      {/* =================================================================== */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Architecture Change Alert Demo Banner */}
          <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent/15 border border-accent/30 text-accent shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-semibold text-sm text-foreground">
                  Architecture Alert: Sync Completed
                </h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  The latest repository sync added 3 new modules and resolved 1 circular dependency
                  path. Architecture docs and 3D maps have been updated.
                </p>
              </div>
            </div>
            <button
              onClick={() => showToast("Navigating to recent snapshot visual diff (Demo)")}
              className="px-3.5 py-1.5 rounded-md bg-accent text-background font-mono text-xs font-bold shrink-0 hover:bg-accent/90 transition-colors"
            >
              View Visual Diff
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 font-mono">
            {/* Current Plan Card */}
            <div className="p-5 rounded-xl border border-border bg-card/60 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-muted-foreground font-bold">
                  Active Tier
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
                  {MOCK_CURRENT_PLAN.status}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">
                  {MOCK_CURRENT_PLAN.name}
                </h2>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Renews {MOCK_CURRENT_PLAN.renewsAt}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("billing")}
                className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>Manage Subscription</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Seat Usage Card */}
            <div className="p-5 rounded-xl border border-border bg-card/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-muted-foreground font-bold">
                  Seats Used
                </span>
                <span className="text-xs text-foreground font-bold">
                  {MOCK_SEAT_STATS.usedSeats} / {MOCK_SEAT_STATS.totalSeats}
                </span>
              </div>
              <div>
                <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border mb-2">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{
                      width: `${(MOCK_SEAT_STATS.usedSeats / MOCK_SEAT_STATS.totalSeats) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  2 additional seats available
                </p>
              </div>
              <button
                onClick={() => setActiveTab("members")}
                className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>Manage Members</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Security Status Card */}
            <div className="p-5 rounded-xl border border-border bg-card/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-muted-foreground font-bold">
                  Credential Protection
                </span>
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-foreground">
                  AES-256 Encrypted
                </h2>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Token storage encrypted at rest
                </p>
              </div>
              <button
                onClick={() => setActiveTab("security")}
                className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>View Security Specs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Recent Audit Events Card */}
            <div className="p-5 rounded-xl border border-border bg-card/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-muted-foreground font-bold">
                  Audit History
                </span>
                <History className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-foreground">
                  {MOCK_AUDIT_LOGS.length} Logged Events
                </h2>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Latest: {MOCK_AUDIT_LOGS[0]?.timestamp}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("audit")}
                className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>View Audit Log</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 space-y-4">
            <h3 className="font-heading font-bold text-base text-foreground">
              Administration Shortcuts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab("billing")}
                className="p-4 rounded-lg border border-border/80 bg-card/40 hover:bg-secondary/60 transition-all text-left space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-sm text-foreground group-hover:text-accent transition-colors">
                    Upgrade Subscription Tier
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  Unlock unlimited private repos, RBAC seats, and audit logging.
                </p>
              </button>

              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="p-4 rounded-lg border border-border/80 bg-card/40 hover:bg-secondary/60 transition-all text-left space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-sm text-foreground group-hover:text-accent transition-colors">
                    Invite Team Member
                  </span>
                  <UserPlus className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  Assign Admin, Editor, or Viewer seats to developers.
                </p>
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className="p-4 rounded-lg border border-border/80 bg-card/40 hover:bg-secondary/60 transition-all text-left space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-sm text-foreground group-hover:text-accent transition-colors">
                    Review Security & Access
                  </span>
                  <Lock className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  Verify private repo encryption and public Explorer boundaries.
                </p>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: BILLING & PLANS                                              */}
      {/* =================================================================== */}
      {activeTab === "billing" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Test Mode Info Banner */}
          <div className="p-4 rounded-xl border border-warning/30 bg-warning/5 backdrop-blur-md flex items-center justify-between gap-4 font-mono text-xs text-warning">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 shrink-0" />
              <span>
                Billing is currently operating in development test mode. No actual charge will be
                made.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-warning/20 border border-warning/30 font-bold text-[10px] uppercase">
              Dev Mode
            </span>
          </div>

          {/* Current Subscription Card */}
          <div className="p-6 rounded-xl border border-border bg-surface-elevated/50 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground font-bold tracking-wider">
                  Current Subscription
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="text-2xl font-heading font-bold text-foreground">
                    {MOCK_CURRENT_PLAN.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/15 text-primary border border-primary/30">
                    {MOCK_CURRENT_PLAN.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => showToast("Opening Stripe billing portal (Demo Mode)")}
                  className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-background font-mono text-xs font-bold transition-colors shadow-glow-accent"
                >
                  Manage Subscription
                </button>
                <button
                  onClick={() => showToast("Subscription cancellation dialog (Demo Mode)")}
                  className="px-3.5 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel Plan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-3.5 rounded-lg bg-card/40 border border-border/70">
                <span className="text-muted-foreground text-[10px] uppercase block mb-1">
                  Billing Amount
                </span>
                <span className="font-bold text-foreground text-sm">
                  {MOCK_CURRENT_PLAN.amount}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-card/40 border border-border/70">
                <span className="text-muted-foreground text-[10px] uppercase block mb-1">
                  Next Renewal Date
                </span>
                <span className="font-bold text-foreground text-sm">
                  {MOCK_CURRENT_PLAN.renewsAt}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-card/40 border border-border/70">
                <span className="text-muted-foreground text-[10px] uppercase block mb-1">
                  Payment Method
                </span>
                <span className="font-bold text-foreground text-sm">
                  {MOCK_CURRENT_PLAN.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-lg text-foreground">
              Available Subscription Plans
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MOCK_PLANS.map((plan) => {
                const isCurrent = plan.id === MOCK_CURRENT_PLAN.id;
                return (
                  <div
                    key={plan.id}
                    className={`p-6 rounded-xl border flex flex-col justify-between relative transition-all ${
                      plan.highlighted
                        ? "border-accent bg-surface-elevated/80 shadow-glow-primary"
                        : "border-border bg-card/40 hover:border-border/80"
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-accent/15 border border-accent/30 text-accent">
                        {plan.badge}
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-heading font-bold text-xl text-foreground">
                          {plan.name}
                        </h4>
                        <p className="text-xs text-muted-foreground font-sans mt-1 leading-relaxed">
                          {plan.description}
                        </p>
                      </div>

                      <div className="flex items-baseline gap-1 font-mono">
                        <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                        <span className="text-xs text-muted-foreground">/ {plan.period}</span>
                      </div>

                      <div className="border-t border-border/70 pt-4 space-y-2.5 font-sans text-xs">
                        {plan.features.map((feat) => (
                          <div key={feat} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-foreground/90">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border/70 mt-6">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-lg border border-primary/40 bg-primary/10 font-mono text-xs font-bold text-primary cursor-default text-center"
                        >
                          Current Plan
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            showToast(`Initiating upgrade to ${plan.name} Plan (Demo Mode)`)
                          }
                          className={`w-full py-2.5 rounded-lg font-mono text-xs font-bold transition-all text-center ${
                            plan.highlighted
                              ? "bg-accent hover:bg-accent/90 text-background shadow-glow-accent"
                              : "border border-border bg-secondary hover:bg-secondary/80 text-foreground"
                          }`}
                        >
                          {plan.id === "free" ? "Downgrade to Free" : `Upgrade to ${plan.name}`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plan Feature Comparison Table */}
          <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 space-y-4">
            <h3 className="font-heading font-bold text-base text-foreground">
              Feature Matrix & Limits
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                    <th className="py-3 px-4">Feature / Capacity</th>
                    <th className="py-3 px-4 text-center">Free</th>
                    <th className="py-3 px-4 text-center">Pro</th>
                    <th className="py-3 px-4 text-center">Organization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      Workspace Repositories
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">1 Repo</td>
                    <td className="py-3 px-4 text-center text-accent font-bold">10 Repos</td>
                    <td className="py-3 px-4 text-center text-primary font-bold">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      Private Repositories
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      <X className="w-4 h-4 mx-auto text-danger/60" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Check className="w-4 h-4 mx-auto text-primary" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Check className="w-4 h-4 mx-auto text-primary" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      Grounded AI Chat Queries
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">50 / day</td>
                    <td className="py-3 px-4 text-center text-accent font-bold">500 / day</td>
                    <td className="py-3 px-4 text-center text-primary font-bold">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      Architecture Snapshots & Diff
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">3 Snapshots</td>
                    <td className="py-3 px-4 text-center text-accent font-bold">Unlimited</td>
                    <td className="py-3 px-4 text-center text-primary font-bold">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground font-semibold">Included Team Seats</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">1 Seat</td>
                    <td className="py-3 px-4 text-center text-accent font-bold">3 Seats</td>
                    <td className="py-3 px-4 text-center text-primary font-bold">10 Seats</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      Role-Based Access (RBAC)
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      <X className="w-4 h-4 mx-auto text-danger/60" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <X className="w-4 h-4 mx-auto text-danger/60" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Check className="w-4 h-4 mx-auto text-primary" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      Security Audit Logging
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      <X className="w-4 h-4 mx-auto text-danger/60" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <X className="w-4 h-4 mx-auto text-danger/60" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Check className="w-4 h-4 mx-auto text-primary" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: MEMBERS & SEATS                                              */}
      {/* =================================================================== */}
      {activeTab === "members" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Seat Utilization Bar Header */}
          <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 flex-1 max-w-md">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground uppercase font-bold">
                  Active Seats Utilization
                </span>
                <span className="font-bold text-foreground">
                  {members.length} / {MOCK_SEAT_STATS.totalSeats} Seats Used
                </span>
              </div>
              <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${(members.length / MOCK_SEAT_STATS.totalSeats) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-background font-mono text-xs font-bold uppercase transition-all shadow-glow-accent flex items-center gap-2 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Team Member</span>
            </button>
          </div>

          {/* Members Table */}
          <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 space-y-4">
            <h3 className="font-heading font-bold text-base text-foreground">
              Organization Members
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-8 h-8 rounded-full border border-border object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-accent">
                              {member.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-foreground block">{member.name}</span>
                            <span className="text-[11px] text-muted-foreground font-sans block">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            member.role === "Admin"
                              ? "bg-accent/15 text-accent border-accent/30"
                              : member.role === "Editor"
                                ? "bg-primary/15 text-primary border-primary/30"
                                : "bg-secondary text-muted-foreground border-border"
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] ${
                            member.status === "Active"
                              ? "text-primary"
                              : member.status === "Pending"
                                ? "text-warning"
                                : "text-danger"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current" />
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">{member.joinedAt}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenRoleModal(member)}
                          className="px-2.5 py-1 rounded border border-border bg-card hover:bg-secondary text-foreground text-[11px] transition-colors"
                        >
                          Manage Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: ROLES & ACCESS (RBAC)                                        */}
      {/* =================================================================== */}
      {activeTab === "rbac" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 space-y-4">
            <h3 className="font-heading font-bold text-lg text-foreground">
              Role-Based Access Control (RBAC)
            </h3>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Structa enforces server-side role permissions across repository connections, 3D graph
              annotations, member invitations, and billing management.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 font-mono text-xs">
              <div className="p-5 rounded-xl border border-accent/30 bg-accent/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-accent text-sm uppercase">Admin Role</span>
                  <ShieldCheck className="w-5 h-5 text-accent" />
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  Full administrative control over organization repos, billing, members, and audit
                  logs.
                </p>
                <ul className="space-y-1.5 text-[11px] text-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> Manage Subscription & Billing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> Invite & Assign Member Roles
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> Connect / Disconnect Repos
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> Access Full Security Audit Logs
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary text-sm uppercase">Editor Role</span>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  Active contributor access to analyze codebases, trigger syncs, and pin 3D node
                  annotations.
                </p>
                <ul className="space-y-1.5 text-[11px] text-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> Trigger Repository Graph Sync
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> Add & Edit 3D Node Annotations
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> Ask the Codebase AI Chat
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="w-3.5 h-3.5 text-danger/60" /> Cannot Manage Billing / Seats
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-xl border border-border bg-card/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm uppercase">Viewer Role</span>
                  <Eye className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  Read-only exploration access for onboarding developers and architecture reviewers.
                </p>
                <ul className="space-y-1.5 text-[11px] text-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> Explore 3D Dependency Graphs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> View Complexity & Analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="w-3.5 h-3.5 text-danger/60" /> Read-Only (Cannot Mutate State)
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="w-3.5 h-3.5 text-danger/60" /> Cannot Add Annotations
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: AUDIT LOG                                                    */}
      {/* =================================================================== */}
      {activeTab === "audit" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Controls: Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit logs by action, user, or target..."
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {auditSearch && (
                <button
                  onClick={() => setAuditSearch("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["All", "Security", "Billing", "Member", "Repository"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAuditCategory(cat)}
                  className={`px-3 py-1.5 rounded-md border transition-all whitespace-nowrap ${
                    auditCategory === cat
                      ? "bg-accent/15 border-accent/40 text-accent font-bold"
                      : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Events Table */}
          <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 space-y-4">
            <h3 className="font-heading font-bold text-base text-foreground">
              Security & Activity Audit Events
            </h3>

            {filteredAuditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-muted-foreground italic">
                No audit events match your search query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {log.userAvatar ? (
                              <img
                                src={log.userAvatar}
                                alt={log.userName}
                                className="w-5 h-5 rounded-full border border-border"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold">
                                {log.userName.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <span className="font-bold text-foreground">{log.userName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              log.actionCategory === "Security"
                                ? "bg-primary/15 text-primary border-primary/30"
                                : log.actionCategory === "Billing"
                                  ? "bg-accent/15 text-accent border-accent/30"
                                  : log.actionCategory === "Member"
                                    ? "bg-warning/15 text-warning border-warning/30"
                                    : "bg-secondary text-foreground border-border"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-foreground font-semibold">{log.target}</td>
                        <td className="py-3.5 px-4 text-muted-foreground max-w-xs truncate">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* =================================================================== */}
      {/* TAB 6: SECURITY                                                     */}
      {/* =================================================================== */}
      {activeTab === "security" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Security Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-6 rounded-xl border border-border bg-card/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-muted-foreground font-bold">
                  GitHub Integration
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {MOCK_SECURITY_OVERVIEW.githubOAuth.status}
                </span>
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-foreground">
                  OAuth Connection
                </h4>
                <p className="text-xs text-muted-foreground font-sans mt-1">
                  Connected as{" "}
                  <code className="text-accent font-mono">
                    {MOCK_SECURITY_OVERVIEW.githubOAuth.account}
                  </code>
                </p>
              </div>
              <div className="pt-2 border-t border-border/70 text-[11px] text-muted-foreground space-y-1">
                <div>
                  Scopes:{" "}
                  <span className="text-foreground">
                    {MOCK_SECURITY_OVERVIEW.githubOAuth.scopes.join(", ")}
                  </span>
                </div>
                <div>Verified: {MOCK_SECURITY_OVERVIEW.githubOAuth.lastVerified}</div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-muted-foreground font-bold">
                  Token Storage
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {MOCK_SECURITY_OVERVIEW.privateTokens.status}
                </span>
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-foreground">
                  Encryption at Rest
                </h4>
                <p className="text-xs text-muted-foreground font-sans mt-1">
                  {MOCK_SECURITY_OVERVIEW.privateTokens.statusText}
                </p>
              </div>
              <div className="pt-2 border-t border-border/70 text-[11px] text-muted-foreground space-y-1">
                <div>
                  Cipher:{" "}
                  <span className="text-accent">
                    {MOCK_SECURITY_OVERVIEW.privateTokens.encryption}
                  </span>
                </div>
                <div>
                  Key Vault:{" "}
                  <span className="text-foreground">
                    {MOCK_SECURITY_OVERVIEW.privateTokens.keyStorage}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-muted-foreground font-bold">
                  Explorer Security
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/15 text-accent border border-accent/30 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {MOCK_SECURITY_OVERVIEW.explorerIsolation.status}
                </span>
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-foreground">
                  Public-Only Isolation
                </h4>
                <p className="text-xs text-muted-foreground font-sans mt-1">
                  🔒 Private repositories cannot be accessed through Explorer Mode.
                </p>
              </div>
              <div className="pt-2 border-t border-border/70 text-[11px] text-muted-foreground">
                {MOCK_SECURITY_OVERVIEW.explorerIsolation.defenseInDepth}
              </div>
            </div>
          </div>

          {/* Detailed Security Architecture Banner */}
          <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Key className="w-4 h-4 text-accent" />
              <h3 className="font-heading font-bold text-base text-foreground">
                Private Repository Credential Policy
              </h3>
            </div>
            <p className="text-xs text-foreground/90 font-sans leading-relaxed">
              Private repository credentials and GitHub PATs are securely protected with
              hardware-managed AES-256 encryption at rest and are never exposed to client-side
              browser runtimes.
            </p>
            <div className="p-4 rounded-lg bg-card/50 border border-border/70 font-mono text-xs text-muted-foreground leading-normal">
              🔒 Defense-in-depth security ensures Explorer caching mechanisms operate strictly on
              public repositories. Organization private repository graphs remain isolated within
              tenant-scoped database indexes.
            </div>
          </div>
        </motion.div>
      )}

      {/* =================================================================== */}
      {/* DIALOG 1: CHANGE ROLE MODAL                                         */}
      {/* =================================================================== */}
      <AnimatePresence>
        {isRoleModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-xl border border-border bg-surface-elevated shadow-2xl space-y-6 font-mono"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-heading font-bold text-base text-foreground">
                  Change Member Role
                </h3>
                <button
                  onClick={() => setIsRoleModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Target Member:</span>
                <div className="p-3 rounded-lg bg-card border border-border flex items-center gap-3">
                  {selectedMember.avatarUrl ? (
                    <img
                      src={selectedMember.avatarUrl}
                      alt={selectedMember.name}
                      className="w-8 h-8 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-accent">
                      {selectedMember.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-foreground text-xs block">
                      {selectedMember.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-sans block">
                      {selectedMember.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <span className="text-muted-foreground font-bold">Select Role:</span>

                {(["Admin", "Editor", "Viewer"] as const).map((r) => (
                  <label
                    key={r}
                    onClick={() => setNewRole(r)}
                    className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                      newRole === r
                        ? "border-accent bg-accent/10"
                        : "border-border bg-card/40 hover:bg-secondary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      checked={newRole === r}
                      onChange={() => setNewRole(r)}
                      className="mt-0.5 text-accent focus:ring-accent"
                    />
                    <div>
                      <span className="font-bold text-foreground block">{r}</span>
                      <span className="text-[11px] font-sans text-muted-foreground block">
                        {r === "Admin"
                          ? "Full control over billing, seats, and org repos."
                          : r === "Editor"
                            ? "Can sync repos, add annotations, and use AI chat."
                            : "Read-only graph exploration & analytics view."}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-xs text-foreground font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-xs text-background font-bold uppercase transition-all shadow-glow-accent"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* DIALOG 2: INVITE MEMBER MODAL                                       */}
      {/* =================================================================== */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-xl border border-border bg-surface-elevated shadow-2xl space-y-6 font-mono"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-heading font-bold text-base text-foreground">
                  Invite Team Member
                </h3>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-bold block">Email Address:</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="developer@company.com"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-bold block">Initial Role:</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "Admin" | "Editor" | "Viewer")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="Admin">Admin — Full Organization Access</option>
                    <option value="Editor">Editor — Can Sync Repos & Annotate</option>
                    <option value="Viewer">Viewer — Read-Only Exploration</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-xs text-foreground font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-xs text-background font-bold uppercase transition-all shadow-glow-accent"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
