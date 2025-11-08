import "@/assets/css/index.css"; 
import "react-loading-skeleton/dist/skeleton.css";
import ClientSideScrollRestorer from "@/components/news/ClientScrollRestorer";

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
      <body>
        <ClientSideScrollRestorer />
        {children}
      </body>
</html>
  );
}