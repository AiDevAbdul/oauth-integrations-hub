"use client";

import { OAuthProvider } from "@/lib/providers";
import { ProviderIcon } from "./ProviderIcon";

interface SetupModalProps {
  provider: OAuthProvider | null;
  onClose: () => void;
}

const SETUP_GUIDES: Record<string, { url: string; steps: string[] }> = {
  facebook: {
    url: "https://developers.facebook.com/apps/",
    steps: [
      "Go to your app → Add Product → add 'Facebook Login for Business'",
      "Under Facebook Login → Settings, set Redirect URI: {baseUrl}/api/oauth/callback/facebook",
      "Under App Review → Permissions, enable: public_profile, pages_show_list, pages_read_engagement",
      "Copy App ID → FACEBOOK_CLIENT_ID",
      "Copy App Secret → FACEBOOK_CLIENT_SECRET",
    ],
  },
  instagram: {
    url: "https://developers.facebook.com/apps/",
    steps: [
      "Create a Meta App (same as Facebook)",
      "Add Instagram Basic Display product",
      "Set redirect URI: {baseUrl}/api/oauth/callback/instagram",
      "Copy Instagram App ID → INSTAGRAM_CLIENT_ID",
      "Copy Instagram App Secret → INSTAGRAM_CLIENT_SECRET",
    ],
  },
  google: {
    url: "https://console.cloud.google.com/apis/credentials",
    steps: [
      "Create a Google Cloud project",
      "Enable Gmail, Calendar, Drive APIs",
      "Create OAuth 2.0 Client ID (Web application)",
      "Add redirect URI: {baseUrl}/api/oauth/callback/google",
      "Copy Client ID → GOOGLE_CLIENT_ID",
      "Copy Client Secret → GOOGLE_CLIENT_SECRET",
    ],
  },
  twitter: {
    url: "https://developer.twitter.com/en/portal/dashboard",
    steps: [
      "Create a Twitter Developer App",
      "Enable OAuth 2.0",
      "Set redirect URI: {baseUrl}/api/oauth/callback/twitter",
      "Copy Client ID → TWITTER_CLIENT_ID",
      "Copy Client Secret → TWITTER_CLIENT_SECRET",
    ],
  },
  linkedin: {
    url: "https://www.linkedin.com/developers/apps",
    steps: [
      "Create a LinkedIn App",
      "Add 'Sign In with LinkedIn' and 'Share on LinkedIn' products",
      "Set redirect URI: {baseUrl}/api/oauth/callback/linkedin",
      "Copy Client ID → LINKEDIN_CLIENT_ID",
      "Copy Client Secret → LINKEDIN_CLIENT_SECRET",
    ],
  },
  slack: {
    url: "https://api.slack.com/apps",
    steps: [
      "Create a Slack App from scratch",
      "Go to OAuth & Permissions",
      "Add redirect URI: {baseUrl}/api/oauth/callback/slack",
      "Copy Client ID → SLACK_CLIENT_ID",
      "Copy Client Secret → SLACK_CLIENT_SECRET",
    ],
  },
  github: {
    url: "https://github.com/settings/developers",
    steps: [
      "Go to Settings > Developer Settings > OAuth Apps",
      "Create new OAuth App",
      "Set callback URL: {baseUrl}/api/oauth/callback/github",
      "Copy Client ID → GITHUB_CLIENT_ID",
      "Generate Client Secret → GITHUB_CLIENT_SECRET",
    ],
  },
  discord: {
    url: "https://discord.com/developers/applications",
    steps: [
      "Create a new Discord Application",
      "Go to OAuth2 settings",
      "Add redirect URI: {baseUrl}/api/oauth/callback/discord",
      "Copy Client ID → DISCORD_CLIENT_ID",
      "Copy Client Secret → DISCORD_CLIENT_SECRET",
    ],
  },
  notion: {
    url: "https://www.notion.so/my-integrations",
    steps: [
      "Create a new Notion Integration",
      "Set it as a Public integration",
      "Add redirect URI: {baseUrl}/api/oauth/callback/notion",
      "Copy OAuth Client ID → NOTION_CLIENT_ID",
      "Copy OAuth Client Secret → NOTION_CLIENT_SECRET",
    ],
  },
  stripe: {
    url: "https://dashboard.stripe.com/settings/connect",
    steps: [
      "Enable Stripe Connect in your dashboard",
      "Add redirect URI: {baseUrl}/api/oauth/callback/stripe",
      "Copy your platform's client_id → STRIPE_CLIENT_ID",
      "Copy Secret Key → STRIPE_CLIENT_SECRET",
    ],
  },
};

export function SetupModal({ provider, onClose }: SetupModalProps) {
  if (!provider) return null;

  const guide = SETUP_GUIDES[provider.id] || {
    url: "#",
    steps: [
      `Register an app at ${provider.name}'s developer portal`,
      `Set redirect URI: {baseUrl}/api/oauth/callback/${provider.id}`,
      `Copy Client ID → ${provider.id.toUpperCase()}_CLIENT_ID`,
      `Copy Client Secret → ${provider.id.toUpperCase()}_CLIENT_SECRET`,
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: provider.bgColor }}
          >
            <ProviderIcon provider={provider.id} size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Setup {provider.name}</h2>
            <p className="text-xs text-gray-400">Configure OAuth credentials</p>
          </div>
        </div>

        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Setup Steps:</h3>
          <ol className="space-y-2.5">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-semibold">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step.replace("{baseUrl}", "http://localhost:3000")}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Add to .env file:</p>
          <code className="text-xs text-gray-700 block">
            {provider.id.toUpperCase()}_CLIENT_ID=&quot;your-client-id&quot;<br />
            {provider.id.toUpperCase()}_CLIENT_SECRET=&quot;your-secret&quot;
          </code>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50"
          >
            Close
          </button>
          <a
            href={guide.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2.5 rounded-xl text-white font-semibold text-sm text-center transition-colors hover:opacity-90"
            style={{ backgroundColor: provider.color }}
          >
            Open Developer Portal ↗
          </a>
        </div>
      </div>
    </div>
  );
}
