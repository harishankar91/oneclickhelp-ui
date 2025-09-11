import { Inter } from "next/font/google";
import { Roboto_Mono } from "next/font/google";
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
  title: "Oneclickhelp - Your one stop solution for health",
  description:
    "Oneclickhelp is a comprehensive health platform that connects users with healthcare professionals, offers medical consultations, and provides access to health resources.",
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
        {children}
      </body>
    </html>
  );
}