import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Battle Battle | Social Battle Platform",
  description: "Social platform where users can create, join and participate in one-on-one battles with judges and betting.",
  keywords: ["battle", "social", "competition", "betting", "debates", "voting"],
  authors: [{ name: "Battle Battle Team" }],
  openGraph: {
    title: "Battle Battle | Social Battle Platform",
    description: "Social platform where users can create, join and participate in one-on-one battles with judges and betting.",
    type: "website",
    locale: "en_US",
    siteName: "Battle Battle",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}