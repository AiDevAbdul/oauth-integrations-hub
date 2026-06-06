"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { IntegrationCard } from "@/components/IntegrationCard";
import { DisconnectModal } from "@/components/DisconnectModal";
import { SetupModal } from "@/components/SetupModal";
import { PROVIDERS, CATEGORIES, getProvider, OAuthProvider } from "@/lib/providers";
import { useSearchParams, useRouter } from "next/navigation";

interface Connection {
  id: string;
  provider: string;
  providerAccountId?: string | null;
  scopes?: string | null;
  metadata?: string | null;
  status: string;
  tokenExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function IntegrationsClient() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<{
    connectionId: string;
    provider: OAuthProvider;
  } | null>(null);
  const [setupTarget, setSetupTarget] = useState<OAuthProvider | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Handle success/error from OAuth callback
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      toast.success(success);
      fetchConnections();
      router.replace("/dashboard");
    }
    if (error) {
      if (error === "not_configured") {
        toast.error("Provider not configured. Add credentials to .env file.");
      } else {
        toast.error(error);
      }
      router.replace("/dashboard");
    }
  }, [searchParams, fetchConnections, router]);

  const handleConnect = async (providerId: string) => {
    setLoadingProvider(providerId);
    try {
      // Check if configured first
      const res = await fetch(`/api/oauth/connect/${providerId}`, {
        redirect: "manual",
      });

      if (res.type === "opaqueredirect" || res.status === 0) {
        // Redirect happened — follow it
        window.location.href = `/api/oauth/connect/${providerId}`;
        return;
      }

      if (res.status === 400) {
        const data = await res.json();
        if (data.error === "not_configured") {
          const provider = getProvider(providerId);
          setSetupTarget(provider || null);
          return;
        }
        toast.error(data.message || "Failed to connect");
        return;
      }

      // For other redirects
      window.location.href = `/api/oauth/connect/${providerId}`;
    } catch {
      window.location.href = `/api/oauth/connect/${providerId}`;
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleDisconnectRequest = (connectionId: string, providerId: string) => {
    const provider = getProvider(providerId);
    if (provider) {
      setDisconnectTarget({ connectionId, provider });
    }
  };

  const handleDisconnectConfirm = async () => {
    if (!disconnectTarget) return;
    setIsDisconnecting(true);
    try {
      const res = await fetch(`/api/connections/${disconnectTarget.connectionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`${disconnectTarget.provider.name} disconnected`);
        setConnections((prev) => prev.filter((c) => c.id !== disconnectTarget.connectionId));
      } else {
        toast.error("Failed to disconnect");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsDisconnecting(false);
      setDisconnectTarget(null);
    }
  };

  const connectionMap = new Map(connections.map((c) => [c.provider, c]));
  const connectedCount = connections.filter((c) => c.status === "active").length;

  const filtered = PROVIDERS.filter((p) => {
    const matchesCategory = category === "All" || p.category === category;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Integrations", value: PROVIDERS.length, color: "text-gray-900" },
          { label: "Connected", value: connectedCount, color: "text-green-600" },
          { label: "Available", value: PROVIDERS.length - connectedCount, color: "text-gray-500" },
          { label: "Categories", value: CATEGORIES.length - 1, color: "text-blue-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 bg-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                category === cat
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Connected section */}
      {connectedCount > 0 && category === "All" && !search && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Connected ({connectedCount})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {PROVIDERS.filter((p) => connectionMap.has(p.id)).map((provider) => (
              <IntegrationCard
                key={provider.id}
                provider={provider}
                connection={connectionMap.get(provider.id)}
                onConnect={handleConnect}
                onDisconnect={(id) => handleDisconnectRequest(id, provider.id)}
                isLoading={loadingProvider === provider.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* All / filtered integrations */}
      <div>
        {connectedCount > 0 && category === "All" && !search && (
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            All Integrations
          </h2>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No integrations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((provider) => (
              <IntegrationCard
                key={provider.id}
                provider={provider}
                connection={connectionMap.get(provider.id)}
                onConnect={handleConnect}
                onDisconnect={(id) => handleDisconnectRequest(id, provider.id)}
                isLoading={loadingProvider === provider.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <DisconnectModal
        provider={disconnectTarget?.provider || null}
        onConfirm={handleDisconnectConfirm}
        onCancel={() => setDisconnectTarget(null)}
        isLoading={isDisconnecting}
      />
      <SetupModal
        provider={setupTarget}
        onClose={() => setSetupTarget(null)}
      />
    </>
  );
}
