import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nakodajewellers.com'),
  title: {
    default: "Nakoda Jewellers | Premium Gold & Diamond Jewellery",
    template: "%s | Nakoda Jewellers",
  },
  description: "Discover our timeless collections of exquisite gold, diamond, and silver masterpieces crafted with precision and passion.",
  openGraph: {
    title: "Nakoda Jewellers",
    description: "Premium handcrafted jewellery collections.",
    url: 'https://nakodajewellers.com',
    siteName: 'Nakoda Jewellers',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Nakoda Jewellers",
    description: "Premium handcrafted jewellery collections.",
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#0C0A09',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
