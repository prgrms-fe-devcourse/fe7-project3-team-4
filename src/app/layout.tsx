export const metadata = {
  title: "ALGO | AI PROMPT",
  description: "ALGO | AI PROMPT",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="fixed inset-0 min-h-screen bg-[linear-gradient(130deg,#EFF5FE_18.41%,#FBF3FB_81.59%)]"></div>
        {children}
      </body>
    </html>
  );
}
