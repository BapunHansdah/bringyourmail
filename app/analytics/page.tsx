"use client";

import { Sidebar } from "@/components/sidebar";
import AnalyticsSection from "@/components/metrics";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="p-4 pt-18 md:ml-64 md:p-8 md:pt-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">Analtics</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            See performance
          </p>
        </div>
        <AnalyticsSection />
      </main>
    </div>
  );
}
