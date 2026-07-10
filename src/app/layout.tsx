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
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
