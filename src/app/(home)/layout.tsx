import "@/assets/css/index.css";
import DragScrollMain from "@/components/DragScrollMain";
import LeftSidebar from "@/components/sidebar/Left/LeftSidebar";
import RightSidebar from "@/components/sidebar/Right/RightSidebar";
import { NewsFeedProvider } from "@/context/NewsFeedContext";
import { FollowProvider } from "@/context/FollowContext";
import "react-loading-skeleton/dist/skeleton.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="relative">
        <div className="z-5">
          <FollowProvider>
            <NewsFeedProvider>
              <div className="p-6 grid lg:grid-cols-[208px_minmax(0,1fr)_332px] gap-6 h-screen">
                <LeftSidebar />
                <DragScrollMain>{children}</DragScrollMain>
                <RightSidebar />
              </div>
            </NewsFeedProvider>
          </FollowProvider>
        </div>
      </div>
    </>
  );
}
