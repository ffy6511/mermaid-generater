import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { HistoryProvider } from "@/contexts/history-context";

export const metadata = {
  title: "Mermaid Generator",
  description: "将文本转换为Mermaid图表的工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <HistoryProvider>
            {children}
          </HistoryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}