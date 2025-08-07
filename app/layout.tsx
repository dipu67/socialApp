import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  metadataBase: new URL('https://chatapp.com'),
  title: {
    default: "ChatApp - Real-time Messaging & Social Platform",
    template: "%s | ChatApp"
  },
  description: "Connect instantly with friends and communities through real-time messaging, social feeds, and interactive features. Join ChatApp for seamless communication and social networking.",
  keywords: [
    "chat app", "messaging", "real-time chat", "social network", "instant messaging",
    "community", "communication", "social media", "chat rooms", "online messaging"
  ],
  authors: [{ name: "ChatApp Team" }],
  creator: "ChatApp",
  publisher: "ChatApp",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://chatapp.com',
    siteName: 'ChatApp',
    title: 'ChatApp - Real-time Messaging & Social Platform',
    description: 'Connect instantly with friends and communities through real-time messaging, social feeds, and interactive features. Join ChatApp for seamless communication and social networking.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ChatApp - Real-time Messaging & Social Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChatApp - Real-time Messaging & Social Platform',
    description: 'Connect instantly with friends and communities through real-time messaging, social feeds, and interactive features. Join ChatApp for seamless communication and social networking.',
    images: ['/og-image.png'],
    creator: '@chatapp',
    site: '@chatapp',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  alternates: {
    canonical: 'https://chatapp.com',
  },
  category: 'technology',
  classification: 'Social Networking',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'ChatApp',
    'application-name': 'ChatApp',
    'msapplication-TileColor': '#000000',
    'theme-color': '#000000',
  },
};

// Structured Data for the application
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ChatApp",
  "description": "Real-time messaging and social platform for instant communication",
  "url": "https://chatapp.com",
  "applicationCategory": "SocialNetworkingApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Organization",
    "name": "ChatApp Team"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250"
  },
  "screenshot": "https://chatapp.com/screenshot.png"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light dark" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="application-name" content="ChatApp" />
        <meta name="apple-mobile-web-app-title" content="ChatApp" />
        <meta name="msapplication-tooltip" content="ChatApp - Real-time Messaging" />
        <meta name="msapplication-starturl" content="/" />
        <meta name="msapplication-navbutton-color" content="#3b82f6" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon and icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "ChatApp",
              "applicationCategory": "CommunicationApplication",
              "operatingSystem": ["Web", "iOS", "Android"],
              "description": "Real-time messaging and social platform for instant communication",
              "url": "https://chatapp.com",
              "author": {
                "@type": "Organization",
                "name": "ChatApp Team"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "Real-time messaging",
                "Group chats",
                "File sharing",
                "Voice messages",
                "Video calls",
                "End-to-end encryption"
              ],
              "screenshot": "https://chatapp.com/screenshot.png",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1250"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
