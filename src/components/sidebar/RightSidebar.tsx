import News from "./Right/News";
import Rank from "./Right/Rank";
import Tags from "./Right/Tags";

export default function RightSidebar() {
  return (
    <aside className="hidden md:block h-full space-y-6">
      <News />
      <Tags />
      <Rank />
    </aside>
  );
}
