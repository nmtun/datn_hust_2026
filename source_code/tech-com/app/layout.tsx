import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TechCom",
  description: "TechCom cung cấp giải pháp công nghệ tiên tiến cho doanh nghiệp. Từ phát triển web đến hạ tầng đám mây, chúng tôi giúp các công ty chuyển đổi sự hiện diện kỹ thuật số.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
