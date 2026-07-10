import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Tasks - Todo List by Atif Hasan",
  description: "A premium, beautifully designed todo list and task planner application built to maximize your productivity. Created by Atif Hasan.",
  keywords: ["atif hasan todo", "todolist", "todo planner", "tasks", "productivity", "atif hasan", "todo app"],
  authors: [{ name: "Atif Hasan", url: "https://atifhasan.com" }],
  metadataBase: new URL("https://todo.atifhasan.com"),
  openGraph: {
    title: "Daily Tasks - Todo List",
    description: "A premium, beautifully designed todo list and task planner application.",
    url: "https://todo.atifhasan.com",
    siteName: "Daily Tasks",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Tasks - Todo List",
    description: "A premium, beautifully designed todo list and task planner application.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tasks",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' }
    ],
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import Script from "next/script";

import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Daily Tasks",
    "url": "https://todo.atifhasan.com",
    "description": "A premium, beautifully designed todo list and task planner application.",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "All",
    "author": {
      "@type": "Person",
      "name": "Atif Hasan",
      "url": "https://atifhasan.com"
    }
  };

  return (
    <ClerkProvider appearance={{ theme: dark }}>
      <html lang="en">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body>
          <ClerkLoading>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
              <div className="clerk-spinner"></div>
            </div>
          </ClerkLoading>
          <ClerkLoaded>
            {children}
          </ClerkLoaded>
          <Script id="webpushr-script" strategy="afterInteractive">
            {`(function(w,d, s, id) {if(typeof(w.webpushr)!=='undefined') return;w.webpushr=w.webpushr||function(){(w.webpushr.q=w.webpushr.q||[]).push(arguments)};var js, fjs = d.getElementsByTagName(s)[0];js = d.createElement(s); js.id = id;js.async=1;js.src = "https://cdn.webpushr.com/app.min.js";fjs.parentNode.appendChild(js);}(window,document, 'script', 'webpushr-jssdk'));webpushr('setup',{'key':'BEMI2BoWgNPmojWqNZom40A6oQ7EL215kxVXJP_Lrj1_8Ecag7-Jq32-NkGqMh_X375TU9177AyOkG8D5hksaZE' });`}
          </Script>
        </body>
      </html>
    </ClerkProvider>
  );
}
