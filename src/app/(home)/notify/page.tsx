// app/notify/page.tsx
import { Suspense } from "react";
import NotifyHomeClient from "@/components/notify/NotifyHomeClient"; // 경로에 맞게 수정하세요

// 페이지를 항상 동적으로 렌더링하도록 설정
export const dynamic = 'force-dynamic';

// NotifyHomeClient 컴포넌트 로딩 중에 보여줄 폴백 UI
function PageLoadingFallback() {
  return (
    <section className="relative max-w-2xl mx-auto">
      <div className="mt-6 space-y-6">
        <div className="text-center p-4">알림 페이지를 불러오는 중...</div>
      </div>
    </section>
  );
}

export default function NotifyPage() {
  return (
    // NotifyHomeClient가 데이터를 로드하는 동안 PageLoadingFallback을 보여줍니다.
    <Suspense fallback={<PageLoadingFallback />}>
      <NotifyHomeClient />
    </Suspense>
  );
}