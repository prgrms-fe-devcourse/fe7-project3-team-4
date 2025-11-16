import { Suspense } from "react"; // 1. Suspense import
import SearchPostForm from "@/components/home/search/SearchPostForm";

// 2. export const dynamic = "force-dynamic" 추가
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tag?: string;
  }>;
}) {
  const { q, tag } = await searchParams;
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