import { Suspense } from "react";
import HomePageClient from "@/components/home/HomePageClient";
import LoginSuccessToastClient from "@/components/home/LoginSuccessToastClient";

// ✅ [필수] useSearchParams를 사용하므로 정적 렌더링을 비활성화하고
// 동적 렌더링(SSR)을 강제하여 빌드 오류를 해결합니다.
export const dynamic = "force-dynamic";

// Suspense의 fallback으로 사용할 로딩 스켈레톤 컴포넌트
function HomePageLoading() {
  // HomePageClient.tsx 내부의 스켈레톤과 유사하게 간단히 구성
  return (
    <section className="relative max-w-2xl mx-auto">
      {/* TopBar 영역 스켈레톤 */}
      <div className="mb-5 sticky top-0 z-20 p-4 bg-white/80 backdrop-blur-sm">
        <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Post 리스트 영역 스켈레톤 */}
      <div className="space-y-8 pb-6 px-4">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </section>
  );
}

// 이 페이지는 Suspense 래퍼(Wrapper) 역할을 합니다.
export default function HomePage() {
  return (
    <>
      <LoginSuccessToastClient />
      <Suspense fallback={<HomePageLoading />}>
        {/* useSearchParams를 사용하는 실제 클라이언트 컴포넌트 */}
        <HomePageClient />
      </Suspense>
    </>
  );
}
