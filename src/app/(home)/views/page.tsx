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
          <div className="flex justify-between items-center">
            <h3 className="ml-2 text-xl font-semibold">게시글 조회 목록</h3>

            <button className="cursor-pointer leading-none border-b text-[#717182] disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline">
              내역 삭제
            </button>
          </div>
          <Suspense fallback={<HistoryLoadingSkeleton />}>
            <HistoryPostForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
