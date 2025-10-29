import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "./components/WalletProvider";
import { X402ClientProvider } from "./components/X402ClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "X402 Next.js Demo",
  description: "Demonstration of X402 payment protocol in Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <X402ClientProvider>{children}</X402ClientProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
