import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT Help Me!",
  description: "Cổng hỗ trợ IT nội bộ cho phòng ban và đội IT"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
