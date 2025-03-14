import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientThemeProvider from "../components/ClientWrapper";
import { Inter } from 'next/font/google';
import { Toaster } from "react-hot-toast";
import { SessionProvider } from '../components/SessionProvider';
import ChatBotWrapper from '../components/ChatBotWrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Green Map - Tree Atlas",
  description: "Explore and learn about trees in our interactive Green Map tree atlas",
  authors: [{ name: "Green Map Team" }],
  keywords: ["trees", "green", "map", "ecology", "environment", "nature", "conservation"],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#2F5D50"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#2F5D50" />
        <link rel="stylesheet" href="/css/center-fix.css" />
        <script src="/center-map.js" defer></script>
        <style>
          {`
            img[alt="Beautiful forest landscape"] {
              display: none !important;
            }
          `}
        </style>
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased min-h-screen bg-[var(--background)]`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <ClientThemeProvider>
            <main>
              {children}
            </main>
            <ChatBotWrapper />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--background-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--primary-light)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: 'white',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: 'white',
                  },
                },
              }}
            />
          </ClientThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
