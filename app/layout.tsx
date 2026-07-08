import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rebio - 仕事は情報ではなく、責任が流れている",
  description: "Rebioは記録・申し送り・タスク・書類・コメントをつなげ、業務上の責任が誰に渡り、どこで止まり、どう解決されたかを見える化する業務共有SaaSのデモMVPです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
