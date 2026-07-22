"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth, OrganizationList } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Plus,
  Search,
  AlertCircle,
  Loader2,
  Lock,
  Globe,
  Check,
  Database,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  url: string;
  private: boolean;
  description?: string;
}

interface ConnectedRepo {
  _id: string;
  name: string;
  url: string;
  isPrivate: boolean;
  healthScore: number;
  lastSyncedAt?: string;
}

export default function DashboardPage() {
  const { orgId, isLoaded } = useAuth();

  // States
  const [connectedRepos, setConnectedRepos] = useState<ConnectedRepo[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [connectingRepoId, setConnectingRepoId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch connected repos for the active org
  const fetchConnectedRepos = useCallback(async () => {
    if (!orgId) return;
    setIsLoadingRepos(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/repos");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch repositories");
      }
      setConnectedRepos(data.repos || []);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage((err as Error).message || "Error loading connected repositories");
    } finally {
      setIsLoadingRepos(false);
    }
  }, [orgId]);

  // Fetch GitHub repositories
  const fetchGithubRepos = useCallback(async () => {
    setIsLoadingGithub(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/repos?source=github");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load GitHub repositories");
      }
      setGithubRepos(data.repos || []);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        (err as Error).message || "Error connecting to GitHub. Make sure your account is linked.",
      );
    } finally {
      setIsLoadingGithub(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && orgId) {
      Promise.resolve().then(() => fetchConnectedRepos());
    }
  }, [orgId, isLoaded, fetchConnectedRepos]);

  useEffect(() => {
    if (isModalOpen) {
      Promise.resolve().then(() => fetchGithubRepos());
    }
  }, [isModalOpen, fetchGithubRepos]);

  // Connect a repository
  const handleConnectRepo = async (repo: GitHubRepo) => {
    setConnectingRepoId(repo.id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubRepoId: repo.id,
          name: repo.name,
          url: repo.url,
          isPrivate: repo.private,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to connect repository");
      }

      setSuccessMessage(`Successfully connected ${repo.name}!`);
      fetchConnectedRepos();

      // Close modal after brief delay
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage("");
      }, 1500);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage((err as Error).message || "Could not connect repository");
    } finally {
      setConnectingRepoId(null);
    }
  };

  // Filter GitHub repositories based on search term
  const filteredGithubRepos = githubRepos.filter((repo) =>
    repo.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!isLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-mono text-sm">Loading workspace context...</p>
      </div>
    );
  }

  // If no organization selected, show org management list
  if (!orgId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full"
        >
          <div className="mx-auto w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-6 border border-border">
            <Database className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-2">Select Organization</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Structa organizes connected repositories under team or personal organizations. Select an
            existing one or create a new workspace to proceed.
          </p>

          <div className="flex justify-center p-4 border border-border rounded-lg bg-card/45 backdrop-blur-md shadow-sm">
            <OrganizationList
              hidePersonal={false}
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationListTrigger: "text-foreground",
                  organizationSwitcherTrigger: "text-foreground",
                  card: "bg-transparent border-0 shadow-none p-0 text-foreground",
                  headerTitle: "text-foreground text-base font-semibold",
                  headerSubtitle: "text-muted-foreground text-xs",
                  organizationListPreviewButton: "text-foreground hover:bg-secondary",
                  createOrganizationButton: "text-primary hover:bg-secondary",
                },
              }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Info Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Repositories</h1>
          <p className="text-muted-foreground text-sm">
            Manage connected codebases and explore structures.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background font-medium px-4 py-2 rounded-md shadow-glow-primary transition-all duration-200 active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4" />
          Connect Repository
        </button>
      </div>

      {/* Error State */}
      {errorMessage && !isModalOpen && (
        <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/20 flex items-start gap-3 text-sm text-danger animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Connected Repository List */}
      {isLoadingRepos ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-lg border border-border bg-card/40 backdrop-blur-sm h-40 flex flex-col justify-between animate-pulse"
            >
              <div className="space-y-3">
                <div className="h-5 bg-border rounded w-2/3" />
                <div className="h-4 bg-border rounded w-1/2" />
              </div>
              <div className="h-4 bg-border rounded w-1/3 mt-4" />
            </div>
          ))}
        </div>
      ) : connectedRepos.length === 0 ? (
        // Empty State Dashboard
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col items-center justify-center p-12 rounded-lg border border-dashed border-border bg-card/15 backdrop-blur-sm text-center min-h-[50vh]"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full w-16 h-16 mx-auto pointer-events-none" />
            <div className="relative w-16 h-16 rounded-xl bg-card border border-border flex items-center justify-center mx-auto text-primary shadow-sm">
              <GitBranch className="w-8 h-8" />
            </div>
          </div>

          <h2 className="text-xl font-heading font-bold text-foreground mb-2">
            Connect your first repository
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8">
            Structa turns your code into a living 3D dependency model. Link a repository to start
            visualizing and exploring its modules.
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background font-medium px-5 py-2.5 rounded-md shadow-glow-primary transition-all duration-200 active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" />
            Connect a GitHub Repository
          </button>
        </motion.div>
      ) : (
        // Active Repository Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectedRepos.map((repo) => (
            <motion.div
              layoutId={repo._id}
              key={repo._id}
              className="p-6 rounded-lg border border-border bg-card hover:border-accent/40 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground uppercase bg-secondary/50 px-2 py-0.5 rounded border border-border">
                    {repo.isPrivate ? (
                      <>
                        <Lock className="w-3 h-3 text-warning" />
                        <span>Private</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3 text-primary" />
                        <span>Public</span>
                      </>
                    )}
                  </div>

                  {/* Health score badge placeholder */}
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-primary">
                    <Check className="w-3 h-3" />
                    <span>Score {repo.healthScore}</span>
                  </div>
                </div>

                <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                  {repo.name}
                </h3>

                <a
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent font-mono mt-1.5 transition-colors max-w-fit"
                >
                  <GitHubIcon className="w-3.5 h-3.5" />
                  <span className="truncate">{repo.url.replace("https://github.com/", "")}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>

              <div className="border-t border-border mt-6 pt-4 flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/80 animate-pulse" />
                  Connected
                </span>

                {/* Disabled workspace mapping button for Phase 1 */}
                <button
                  disabled
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground opacity-50 cursor-not-allowed transition-colors text-[11px]"
                  title="3D Mapping will be enabled in Phase 2 & 3"
                >
                  <span>Map</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* GitHub Repository Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-lg rounded-lg border border-border bg-surface-elevated p-6 shadow-md flex flex-col max-h-[85vh] z-10"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-heading font-semibold text-foreground">
                    Connect GitHub Repository
                  </h3>
                  <p className="text-muted-foreground text-xs font-mono mt-0.5">
                    Select a repository to map in Structa
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-sm font-mono p-1 rounded hover:bg-secondary transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Status / Success Messages */}
              {successMessage && (
                <div className="mb-4 p-3 rounded-md bg-primary/10 border border-primary/20 flex items-center gap-2.5 text-xs text-primary font-mono animate-fade-in">
                  <Check className="w-4 h-4 shrink-0" />
                  <div>{successMessage}</div>
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 rounded-md bg-danger/10 border border-danger/20 flex items-start gap-2.5 text-xs text-danger animate-fade-in">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div className="flex-1">{errorMessage}</div>
                </div>
              )}

              {/* Search input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search repository names..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-card/50 border border-border rounded-md pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* Repo list container */}
              <div className="flex-1 overflow-y-auto min-h-[30vh] max-h-[50vh] pr-1 space-y-2 scrollbar-thin">
                {isLoadingGithub ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
                    <p className="text-muted-foreground text-xs font-mono">
                      Fetching repos from GitHub...
                    </p>
                  </div>
                ) : filteredGithubRepos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs font-mono">
                    {githubRepos.length === 0
                      ? "No GitHub repositories found. Check access scopes."
                      : "No matching repositories found."}
                  </div>
                ) : (
                  filteredGithubRepos.map((repo) => {
                    const isAlreadyConnected = connectedRepos.some((cr) => cr.url === repo.url);
                    const isConnecting = connectingRepoId === repo.id;

                    return (
                      <div
                        key={repo.id}
                        className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card/30 hover:bg-card/70 hover:border-accent/25 transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-heading font-medium text-sm text-foreground truncate max-w-[200px]">
                              {repo.name}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase bg-secondary/50 px-1.5 py-0.5 rounded">
                              {repo.private ? "Private" : "Public"}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate font-mono">
                            {repo.fullName}
                          </p>
                        </div>

                        <button
                          disabled={isAlreadyConnected || isConnecting || !!connectingRepoId}
                          onClick={() => handleConnectRepo(repo)}
                          className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded transition-all duration-200 ${
                            isAlreadyConnected
                              ? "bg-secondary text-muted-foreground cursor-default border border-border"
                              : isConnecting
                                ? "bg-primary/20 text-primary"
                                : "bg-primary hover:bg-primary-hover text-background active:scale-95"
                          }`}
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Connecting</span>
                            </>
                          ) : isAlreadyConnected ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-primary" />
                              <span>Connected</span>
                            </>
                          ) : (
                            <span>Connect</span>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
