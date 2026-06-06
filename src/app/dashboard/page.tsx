import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { IntegrationsClient } from "./IntegrationsClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">IntegrationHub</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-gray-600 hidden sm:block">
                {session.user.name || session.user.email}
              </span>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect your apps and services with one click. All tokens are encrypted at rest.
          </p>
        </div>

        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-52 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-100" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-20" />
                    <div className="h-2 bg-gray-100 rounded w-14" />
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded mb-2" />
                <div className="h-2 bg-gray-100 rounded w-3/4 mb-4" />
                <div className="h-9 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        }>
          <IntegrationsClient />
        </Suspense>
      </main>
    </div>
  );
}
