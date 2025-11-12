import Rank from "./Rank";
import Tags from "./tag/Tags";
import SideNews from "./SideNews"; // [수정] SideNews를 임포트
import LatestNewsCarousel from "@/components/news/LatestNewsCarousel";

export default function RightSidebar() {
  return (
    <aside className="hidden lg:flex flex-col h-full justify-between gap-6">
      {/* [수정] SideNews 안에 LatestNewsCarousel을 자식으로 렌더링 */}
      <SideNews>
        <LatestNewsCarousel />
      </SideNews>
      <Tags />
      <Rank />
    </aside>
  );
}
