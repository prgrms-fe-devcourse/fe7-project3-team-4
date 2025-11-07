import "@/assets/css/index.css";

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
      <body>{children}</body>
    </html>
  );
}
