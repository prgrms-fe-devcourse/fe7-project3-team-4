// app/(home)/page.tsx

import { Suspense } from "react";
import HomeClient from "@/components/home/homeClient"; // 2번에서 만들 HomeClient 컴포넌트

// ✅ 이 페이지가 URL 파라미터(searchParams)에 의존하므로
//    정적이 아닌 동적 렌더링을 하도록 명시합니다.
export const dynamic = "force-dynamic";

/**
 * Suspense가 로드되는 동안 보여줄 로딩 UI (폴백)
 * (기존 코드의 NewsItemSkeleton을 재사용하거나 간단한 텍스트를 넣습니다)
 */
function HomeLoadingFallback() {
  return (
    <section className="relative max-w-2xl mx-auto">
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">페이지를 불러오는 중...</p>
        {/*
          <NewsItemSkeleton />
        */}
      </div>
    </section>
  );
}

export default function Page() {
  return (
    // ✅ useSearchParams()를 사용하는 클라이언트 컴포넌트를
    //    Suspense로 감싸 오류를 해결합니다.
    <Suspense fallback={<HomeLoadingFallback />}>
      <HomeClient />
    </Suspense>
  );
}