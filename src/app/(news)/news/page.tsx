// src/app/news/page.tsx
// [통합]: src_news/app/page.tsx의 내용을 /news 경로로 이동

// [통합] 컴포넌트 경로 수정 (src/components/news/ 로 이동 가정)
import NewsFeedContainer from "@/components/news/NewsFeedContainer"; 

export default function NewsPage() {
  return (
    <div className="min-h-screen">
      <NewsFeedContainer />
    </div>
  );
}