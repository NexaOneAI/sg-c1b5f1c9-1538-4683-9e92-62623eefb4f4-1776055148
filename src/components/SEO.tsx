import Head from "next/head";

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export function SEOElements({
  title = "Nexa One - AI App Builder Platform",
  description = "Crea aplicaciones web completas con IA. Chat inteligente, preview en tiempo real, código limpio y deploy automático. La plataforma premium para desarrolladores.",
  image = "https://nexaoneia.com/og-image.png",
  url = "https://nexaoneia.com",
}: SEOProps) {
  const fullTitle = title.includes("Nexa One") ? title : `${title} | Nexa One`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <link rel="canonical" href={url} />
    </>
  );
}

export function SEO({
  title = "Nexa One - AI App Builder Platform",
  description = "Crea aplicaciones web completas con IA. Chat inteligente, preview en tiempo real, código limpio y deploy automático. La plataforma premium para desarrolladores.",
  image = "https://nexaoneia.com/og-image.png",
  url = "https://nexaoneia.com",
}: SEOProps) {
  const fullTitle = title.includes("Nexa One") ? title : `${title} | Nexa One`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <link rel="canonical" href={url} />
    </Head>
  );
}
