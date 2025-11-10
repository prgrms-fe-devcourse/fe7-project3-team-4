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
      <body>{children}</body>
    </html>
  );
}
