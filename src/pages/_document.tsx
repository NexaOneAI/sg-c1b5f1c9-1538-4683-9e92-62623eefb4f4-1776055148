import { Html, Head, Main, NextScript } from "next/document";
import { SEOElements } from "@/components/SEO";

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <SEOElements />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Nexa One" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nexa One" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#A855F7" />
        <meta name="color-scheme" content="dark light" />
        
        {/* Viewport optimizado para móvil */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" 
        />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* iOS Icons */}
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/logo.png" />
        
        {/* Splash Screens iOS */}
        <link 
          rel="apple-touch-startup-image" 
          href="/logo.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" 
        />
        
        {/* Favicons */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        
        {/* Preconnect para performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
