import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proofly — Bridge the Trust Gap. Prove Your Code.",
  description:
    "Proofly automates the verification of your daily technical output, transforming raw commits into an immutable ledger of professional achievement.",
  keywords: [
    "developer portfolio",
    "proof of work",
    "GitHub verification",
    "developer CV",
    "coding streaks",
  ],
  openGraph: {
    title: "Proofly — Bridge the Trust Gap. Prove Your Code.",
    description:
      "Proofly automates the verification of your daily technical output, transforming raw commits into an immutable ledger of professional achievement.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
