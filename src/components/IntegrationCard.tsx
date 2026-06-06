"use client";

import { useState } from "react";
import { ProviderIcon } from "./ProviderIcon";
import { OAuthProvider } from "@/lib/providers";
import { cn, timeAgo, isTokenExpired } from "@/lib/utils";

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

interface IntegrationCardProps {
  provider: OAuthProvider;
  connection?: Connection;
  onConnect: (providerId: string) => void;
  onDisconnect: (connectionId: string) => void;
  isLoading?: boolean;
}

export function IntegrationCard({
  provider,
  connection,
  onConnect,
  onDisconnect,
  isLoading,
}: IntegrationCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isConnected = !!connection && connection.status === "active";
  const isExpired =
    isConnected && isTokenExpired(connection?.tokenExpiresAt ? new Date(connection.tokenExpiresAt) : undefined);

  const metadata = connection?.metadata ? JSON.parse(connection.metadata) : null;
  const displayName = metadata?.name || metadata?.login || metadata?.email || metadata?.username;

  return (
    <div
      className={cn(
        "group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden",
        isConnected
          ? "border-green-200 shadow-sm hover:shadow-md"
          : "border-gray-100 hover:border-gray-200 hover:shadow-md",
        isExpired && "border-amber-200"
      )}
    >
      {/* Status indicator strip */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-0.5 transition-all",
          isConnected && !isExpired ? "bg-green-400" : isExpired ? "bg-amber-400" : "bg-transparent group-hover:bg-gray-100"
        )}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: provider.bgColor }}
            >
              <ProviderIcon provider={provider.id} size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {provider.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{provider.category}</p>
            </div>
          </div>

          {/* Status badge */}
          {isConnected ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                isExpired
                  ? "bg-amber-50 text-amber-700"
                  : "bg-green-50 text-green-700"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isExpired ? "bg-amber-400" : "bg-green-400 animate-pulse"
                )}
              />
              {isExpired ? "Expired" : "Connected"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-gray-50 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              Not connected
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          {provider.description}
        </p>

        {/* Connection details */}
        {isConnected && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-1.5">
            {displayName && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Account</span>
                <span className="text-gray-700 font-medium truncate ml-2 max-w-[140px]">
                  {displayName}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Connected</span>
              <span className="text-gray-700">{timeAgo(connection.createdAt)}</span>
            </div>
            {connection.tokenExpiresAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Token expires</span>
                <span className={cn("font-medium", isExpired ? "text-amber-600" : "text-gray-700")}>
                  {isExpired ? "Expired" : timeAgo(connection.tokenExpiresAt)}
                </span>
              </div>
            )}
            {provider.supportsRefresh && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Auto-refresh</span>
                <span className="text-green-600 font-medium">Enabled</span>
              </div>
            )}
          </div>
        )}

        {/* Token expiry info */}
        {!isConnected && (
          <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Token expiry: {provider.tokenExpiry}
            {provider.supportsRefresh && (
              <span className="ml-1 text-green-500">• Auto-refresh</span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {isConnected ? (
            <>
              <button
                onClick={() => onConnect(provider.id)}
                disabled={isLoading}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Reconnect
              </button>
              <button
                onClick={() => onDisconnect(connection.id)}
                disabled={isLoading}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 font-medium transition-colors disabled:opacity-50"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => onConnect(provider.id)}
              disabled={isLoading}
              className="w-full text-sm px-4 py-2.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: provider.color }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Connect {provider.name}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Scopes tooltip on hover */}
      {isConnected && connection.scopes && (
        <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 w-full">
          <p className="font-medium mb-1">Authorized scopes:</p>
          <p className="text-gray-300 break-all">{connection.scopes}</p>
        </div>
      )}
    </div>
  );
}
