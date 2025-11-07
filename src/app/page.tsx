import LeftSidebar from "@/components/sidebar/LeftSidebar";
import RightSidebar from "@/components/sidebar/RightSidebar";

export default function Page() {
  return (
    <main>
      <div className="p-6 grid md:grid-cols-[208px_minmax(0,1fr)_332px] h-screen overflow-hidden">
        <LeftSidebar />

        <main className="h-full overflow-y-auto px-4 py-4 bg-white">
          <div>잠자</div>
        </main>

        <RightSidebar />
      </div>
    </main>
  );
}
