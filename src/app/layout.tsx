import Providers from "./Providers";

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
