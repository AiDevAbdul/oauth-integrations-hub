"use client";

import { OAuthProvider } from "@/lib/providers";
import { ProviderIcon } from "./ProviderIcon";

interface DisconnectModalProps {
  provider: OAuthProvider | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DisconnectModal({ provider, onConfirm, onCancel, isLoading }: DisconnectModalProps) {
  if (!provider) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-150">
        <div className="flex justify-center mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: provider.bgColor }}
          >
            <ProviderIcon provider={provider.id} size={28} />
          </div>
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
          Disconnect {provider.name}?
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          This will revoke access and delete the stored tokens. You&apos;ll need to reconnect to use {provider.name} again.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      </div>
    </div>
  );
}
