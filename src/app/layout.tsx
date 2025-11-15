import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata = {
  title: "ALGO | AI PROMPT",
  description: "ALGO | AI PROMPT",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <div className="pointer-events-none fixed inset-0 -z-10 min-h-screen bgGradient" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
