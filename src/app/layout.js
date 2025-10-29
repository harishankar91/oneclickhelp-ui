import { Inter } from "next/font/google";
import { Roboto_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Oneclickhelp - Because Your Health Can't Wait",
  description:
    "Book doctor appointments, manage clinic tokens, and access medical consultations with OneClickHelp - Because Your Health Can't Wait",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="fast2sms"
          content="LBMA6bhTf2MG1QL9yQA89zc2h4tf0PRD"
        />
      </head>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased bg-white text-gray-900`}
      >
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-RLXGCDCG7Y"
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RLXGCDCG7Y');
          `}
        </Script>

        {/*Razorpay Checkout Script */}
        <Script
          id="razorpay-checkout"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />

        {children}
      </body>
    </html>
  );
}