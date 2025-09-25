import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/layout/Header";
import { CartStateProvider } from "@/components/cart/cart-state-provider";
import { ToastProvider } from "@/components/ui/toast";
import NavigationOverlay from "@/components/navigation-overlay";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MerchPortal",
  description: "All the merch you could have asked for",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Pre-hydration theme setter to avoid FOUC */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`
          (function() {
            try {
              var storage = localStorage.getItem('theme');
              var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var theme = storage === 'light' || storage === 'dark' ? storage : (systemDark ? 'dark' : 'light');
              document.documentElement.setAttribute('data-theme', theme);
              var meta = document.querySelector('meta[name="theme-color"]');
              if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name','theme-color');
                document.head.appendChild(meta);
              }
              meta.setAttribute('content', theme === 'dark' ? '#0b0b0c' : '#ffffff');
              window.__setTheme = function(next){
                if (next === 'system') {
                  localStorage.removeItem('theme');
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                } else {
                  localStorage.setItem('theme', next);
                  theme = next;
                }
                // Smooth transition: add a short-lived class to enable CSS transitions
                document.documentElement.classList.add('theme-animate');
                document.documentElement.setAttribute('data-theme', theme);
                var m = document.querySelector('meta[name="theme-color"]');
                if (m) m.setAttribute('content', theme === 'dark' ? '#0b0b0c' : '#ffffff');
                window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
                setTimeout(function(){
                  document.documentElement.classList.remove('theme-animate');
                }, 240);
              }
              // React to system changes when theme is system (storage null)
              var mm = window.matchMedia('(prefers-color-scheme: dark)');
              mm.addEventListener('change', function(){
                if (!localStorage.getItem('theme')) {
                  var t = mm.matches ? 'dark' : 'light';
                  document.documentElement.classList.add('theme-animate');
                  document.documentElement.setAttribute('data-theme', t);
                  var m2 = document.querySelector('meta[name="theme-color"]');
                  if (m2) m2.setAttribute('content', t === 'dark' ? '#0b0b0c' : '#ffffff');
                  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
                  setTimeout(function(){
                    document.documentElement.classList.remove('theme-animate');
                  }, 240);
                }
              });
            } catch {}
          })();
          `}
        </Script>
        {/* Default theme-color (will be updated by script) */}
        <meta name="theme-color" content="#ffffff" />
        <SessionProvider>
          <CartStateProvider>
            <ToastProvider>
              {/* Global navigation progress overlay */}
              <NavigationOverlay />
              <Header />
              {children}
            </ToastProvider>
          </CartStateProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

