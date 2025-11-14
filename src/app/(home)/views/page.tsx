import HistoryPostForm from "@/components/home/history/HistoryPostForm";
import { Suspense } from "react";

function HistoryLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white/30 rounded-xl shadow-lg h-48 animate-pulse" />
      <div className="bg-white/30 rounded-xl shadow-lg h-48 animate-pulse" />
      <div className="bg-white/30 rounded-xl shadow-lg h-48 animate-pulse" />
    </div>
  );
}

export default function Page() {
  return (
    <>
      <section className="relative max-w-2xl mx-auto">
        <div className="mt-6 space-y-6">
          <Suspense fallback={<HistoryLoadingSkeleton />}>
            <HistoryPostForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
