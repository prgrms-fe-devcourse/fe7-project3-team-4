import { Suspense } from "react"; // 1. Suspense import
import SearchPostForm from "@/components/home/search/SearchPostForm";

// 2. 이 페이지는 URL 파라미터(검색어)에 의존하므로
//    동적 렌더링을 명시합니다.
export const dynamic = "force-dynamic";

/**
 * Suspense가 로딩되는 동안 보여줄 UI (폴백)
 */
function SearchLoadingFallback() {
  return (
    <div className="relative max-w-2xl mx-auto py-10">
      <p className="text-center text-gray-500">검색 결과를 불러오는 중...</p>
    </div>
  );
}

// 2. export const dynamic = "force-dynamic" 추가
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  // 3. searchParams 타입을 수정했습니다. (App Router 방식)
  //    Promise나 await가 필요 없습니다.
  searchParams: {
    q?: string;
    tag?: string;
  };
}) {
  // 4. await 제거
  const { q, tag } = searchParams;
  const searchTerm = q?.toLowerCase() ?? "";
  const tagTerm = tag?.toLowerCase() ?? "";

  // 3. Suspense의 fallback으로 사용할 간단한 스켈레톤
  const SearchFormSkeleton = (
    <div className="w-full h-12 bg-gray-200 rounded-lg animate-pulse dark:bg-gray-700" />
  );

  return (
    <>
      <section className="relative max-w-2xl mx-auto">
        {/* 4. SearchPostForm을 Suspense로 감싸기 */}
        <Suspense fallback={SearchFormSkeleton}>
          <SearchPostForm searchTerm={searchTerm} tagTerm={tagTerm} />
        </Suspense>
      </section>
    </>
  );
}
