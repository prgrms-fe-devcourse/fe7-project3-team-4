import "@/assets/css/index.css";
import DragScrollMain from "@/components/DragScrollMain";
import LeftSidebar from "@/components/sidebar/Left/LeftSidebar";
import RightSidebar from "@/components/sidebar/Right/RightSidebar";
import { NewsFeedProvider } from "@/context/NewsFeedContext";
import "react-loading-skeleton/dist/skeleton.css";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 min-h-screen bg-[linear-gradient(130deg,#EFF5FE_18.41%,#FBF3FB_81.59%)]"></div>
      <div className="relative">
        <div className="z-5">
          <NewsFeedProvider>
            <div className="p-6 grid lg:grid-cols-[208px_minmax(0,1fr)_332px] gap-6 h-screen">
              <LeftSidebar />
              <DragScrollMain>
                <section className="max-w-2xl mx-auto">{children}</section>
              </DragScrollMain>
              <RightSidebar />
            </div>
          </NewsFeedProvider>
        </div>
      </div>
    </>
  );
}
