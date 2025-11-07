import "./globals.css";

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
      <body className="min-h-screen bg-[linear-gradient(126.44deg,#EFF5FE_18.41%,#FBF3FB_81.59%)]">
        {children}
      </body>
    </html>
  );
}
