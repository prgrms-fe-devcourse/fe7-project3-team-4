import "@/assets/css/index.css";
import DragScrollMain from "@/components/DragScrollMain";
import LeftSidebar from "@/components/sidebar/Left/LeftSidebar";
import RightSidebar from "@/components/sidebar/Right/RightSidebar";

export const metadata = {
  title: "ALGO | AI PROMPT",
  description: "ALGO | AI PROMPT",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[linear-gradient(130deg,#EFF5FE_18.41%,#FBF3FB_81.59%)]">
        <div className="p-6 grid lg:grid-cols-[208px_minmax(0,1fr)_332px] gap-6 h-screen">
          <LeftSidebar />
          <DragScrollMain>{children}</DragScrollMain>
          <RightSidebar />
        </div>
      </body>
    </html>
  );
}
