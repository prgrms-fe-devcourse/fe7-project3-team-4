import { Suspense } from "react";
import MessagePageClient from "@/components/home/message/MessagePageClient";

export const dynamic = 'force-dynamic';

// Suspense의 fallback으로 사용할 간단한 로딩 컴포넌트
function MessagePageLoading() {
  return (
    <div className="w-full h-full pt-0 lg:pt-10 lg:p-18">
      <div className="lg:max-w-250 mx-auto">
        <div className="bg-white/40 rounded-xl shadow-md lg:shadow-xl h-200 lg:min-w-50 flex flex-row items-center justify-center">
          <p className="text-lg text-gray-500">메시지 로딩 중...</p>
        </div>
      </div>
    </div>
  );
}

// 이 페이지는 이제 Suspense 래퍼(Wrapper) 역할을 합니다.
export default function MessagePage() {
  return (
    <Suspense fallback={<MessagePageLoading />}>
      {/* useSearchParams를 사용하는 실제 컴포넌트 */}
      <MessagePageClient />
    </Suspense>
  );
}

