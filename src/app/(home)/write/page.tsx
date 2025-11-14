import { Suspense } from "react";
import WritePageClient from "@/components/write/WritePageClient"; // 1번 파일 import

// ✅ [필수] useSearchParams를 사용(할 예정이거나) 하위 컴포넌트가
// searchParams에 의존하므로 동적 렌더링을 강제합니다.
// (사실 이 페이지는 searchParams를 Promise로 받아 await 하므로
// 이미 동적이지만, 명시적으로 dynamic을 추가하여 빌드 오류 방지)
export const dynamic = "force-dynamic";


type PageProps = {
  searchParams?: Promise<{
    mode?: string;
    postId?: string;
    type?: string;
  }>;
};

// 간단한 로딩 스켈레톤
function WritePageLoading() {
  return (
    <section className="relative max-w-2xl mx-auto p-4">
      {/* 제목 영역 스켈레톤 */}
      <div className="h-10 w-3/4 bg-gray-200 rounded-md animate-pulse mb-4 dark:bg-gray-700"></div>
      {/* 폼 영역 스켈레톤 */}
      <div className="space-y-4">
        <div className="h-8 w-1/3 bg-gray-200 rounded-md animate-pulse dark:bg-gray-700"></div>
        <div className="h-40 bg-gray-200 rounded-lg animate-pulse dark:bg-gray-700"></div>
        <div className="h-20 bg-gray-200 rounded-lg animate-pulse dark:bg-gray-700"></div>
      </div>
    </section>
  );
}

// 이 페이지는 Suspense 래퍼(Wrapper) 역할을 합니다.
export default function Page({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<WritePageLoading />}>
      {/* ✅ 실제 로직을 처리하는 클라이언트를 Suspense로 감쌉니다. */}
      <WritePageClient searchParams={searchParams} />
    </Suspense>
  );
}
