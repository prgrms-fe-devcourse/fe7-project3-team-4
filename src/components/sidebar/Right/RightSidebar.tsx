import News from "./SideNews";
import Rank from "./Rank";
import Tags from "./tag/Tags";

export default function RightSidebar() {
  return (
    <aside className="hidden md:block h-full space-y-6">
      <News />
      <Tags />
      <Rank />
    </aside>
  );
}
