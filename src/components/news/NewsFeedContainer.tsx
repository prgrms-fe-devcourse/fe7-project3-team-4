"use client";

import { useNewsFeed } from "@/hooks/news/useNewsFeed";
import { useNewsUpload } from "@/hooks/news/useNewsUpload";
import NewsHeader from "@/components/news/NewsHeader";
import NewsFeed from "@/components/news/NewsFeed";
import FeedStatus from "@/components/news/FeedStatus";
import LastedNewsCarousel from "@/components/news/LatestNewsCarousel";
import { FadeLoader } from "react-spinners";

export default function NewsFeedContainer() {
  // 1. 뉴스 피드 로직 가져오기 (데이터, 정렬, 스크롤, 옵티미스틱 UI...)
  const {
    isLoading,
    isLoadingMore,
    newsList,
    message,
    setMessage,
    hasNextPage,
    sortBy,
    handleSortChange,
    handleLikeToggle,
    handleBookmarkToggle,
    loadMoreTriggerRef,
    refreshFeed, // 피드 새로고침 함수
    lastedNews, // 인기 뉴스 목록 (useMemo)
  } = useNewsFeed("published_at"); // 기본 정렬 '최신순'

  // 2. 파일 업로드 로직 가져오기
  const {
    fileInputRef,
    loadingUpload,
    handleFileChange,
    triggerFileInput,
  } = useNewsUpload({
    // 콜백 함수를 연결하여 훅끼리 통신
    onUploadStart: () => setMessage("업로드 중..."),
    onUploadSuccess: () => {
      setMessage("✅ 기사 저장 완료! 목록을 새로고침합니다.");
      refreshFeed(); // 피드 훅의 새로고침 함수 호출
    },
    onUploadError: (errorMessage) => setMessage(errorMessage),
  });

  // 3. UI 렌더링 (상태와 핸들러를 컴포넌트에 주입)
  return (
    <>
      {/* 파일 업로드용 숨겨진 input (useNewsUpload 훅이 참조) */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".html,.htm"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true" // 스크린 리더에서 숨김
      />

      {/* 최신 뉴스 캐러셀 - 우측 상단 고정 */}
      {lastedNews.length > 0 && (
        <LastedNewsCarousel newsList={lastedNews} />
      )}

      {/* 메인 피드 영역 */}
      <div className="flex justify-center max-w-7xl mx-auto">
        <main className="flex-1 p-0">
          <div className="max-w-2xl mx-auto w-full">
            
            {/* 헤더 컴포넌트 (정렬, 새 게시글 버튼) */}
            <NewsHeader
              sortBy={sortBy}
              loadingUpload={loadingUpload}
              onSortChange={handleSortChange}
              onAddPostClick={triggerFileInput} // 업로드 훅의 트리거 연결
            />

            {/* 본문 영역 (피드 목록) */}
            <div className="p-6 pt-4 bg-white rounded-b-xl min-h-[calc(100vh-60px)]">
              <section aria-label="뉴스 피드">
                
                <FeedStatus
                  isLoading={isLoading}
                  listLength={newsList.length}
                  message={loadingUpload ? "업로드 중..." : message}
                />

                <NewsFeed
                  newsList={newsList}
                  onLikeToggle={handleLikeToggle}
                  onBookmarkToggle={handleBookmarkToggle}
                  isLoading={isLoading} // 1번: 스켈레톤을 위한 로딩 상태
                />

                <div className="flex justify-center items-center py-6" role="status">
                  {isLoadingMore && (
                    <>
                      <span className="sr-only">추가 로딩 중...</span>
                      <FadeLoader color="#808080" />
                    </>
                  )}
                  {!isLoadingMore && !hasNextPage && newsList.length > 0 && (
                    <p className="text-center text-gray-500">
                      모든 뉴스를 불러왔습니다.
                    </p>
                  )}
                </div>

                <div 
                  ref={loadMoreTriggerRef} 
                  style={{ height: "1px" }} 
                  aria-hidden="true" 
                />
              </section>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}