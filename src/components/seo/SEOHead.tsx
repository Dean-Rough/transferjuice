/**
 * SEO Head Component
 * Automatically injects optimized meta tags
 */

import { type SEOMetadata } from "@/lib/seo/seoGenerator";

interface SEOHeadProps {
  metadata: SEOMetadata;
}

export function SEOHead({ metadata }: SEOHeadProps) {
  const structuredDataScript = `
    ${JSON.stringify(metadata.structuredData)}
  `;

  return (
    <>
      {/* Primary Meta Tags */}
      <title>{metadata.title}</title>
      <meta name="title" content={metadata.title} />
      <meta name="description" content={metadata.description} />
      <meta name="keywords" content={metadata.keywords.join(", ")} />
      <meta name="author" content="Transfer Juice" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={metadata.canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={metadata.openGraph.type} />
      <meta property="og:url" content={metadata.openGraph.url} />
      <meta property="og:title" content={metadata.openGraph.title} />
      <meta
        property="og:description"
        content={metadata.openGraph.description}
      />
      <meta property="og:site_name" content={metadata.openGraph.siteName} />
      {metadata.openGraph.images.map((image, index) => (
        <meta key={index} property="og:image" content={image.url} />
      ))}
      {metadata.openGraph.images[0] && (
        <>
          <meta
            property="og:image:width"
            content={metadata.openGraph.images[0].width.toString()}
          />
          <meta
            property="og:image:height"
            content={metadata.openGraph.images[0].height.toString()}
          />
          <meta
            property="og:image:alt"
            content={metadata.openGraph.images[0].alt}
          />
        </>
      )}

      {/* Twitter */}
      <meta property="twitter:card" content={metadata.twitter.card} />
      <meta property="twitter:url" content={metadata.openGraph.url} />
      <meta property="twitter:title" content={metadata.twitter.title} />
      <meta
        property="twitter:description"
        content={metadata.twitter.description}
      />
      <meta property="twitter:creator" content={metadata.twitter.creator} />
      <meta property="twitter:site" content={metadata.twitter.site} />
      {metadata.twitter.images.map((image, index) => (
        <meta key={index} property="twitter:image" content={image} />
      ))}

      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#1a365d" />
      <meta name="msapplication-TileColor" content="#1a365d" />
      <meta name="format-detection" content="telephone=no" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataScript }}
      />
    </>
  );
}

/**
 * Generate Next.js metadata object for app router
 */
export function generateMetadata(seoMetadata: SEOMetadata) {
  return {
    title: seoMetadata.title,
    description: seoMetadata.description,
    keywords: seoMetadata.keywords,
    authors: [{ name: "Transfer Juice" }],
    creator: "Transfer Juice",
    publisher: "Transfer Juice",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: seoMetadata.openGraph.type as "website" | "article",
      url: seoMetadata.openGraph.url,
      title: seoMetadata.openGraph.title,
      description: seoMetadata.openGraph.description,
      siteName: seoMetadata.openGraph.siteName,
      images: seoMetadata.openGraph.images,
    },
    twitter: {
      card: seoMetadata.twitter.card as "summary" | "summary_large_image",
      title: seoMetadata.twitter.title,
      description: seoMetadata.twitter.description,
      creator: seoMetadata.twitter.creator,
      site: seoMetadata.twitter.site,
      images: seoMetadata.twitter.images,
    },
    alternates: {
      canonical: seoMetadata.canonical,
    },
    other: {
      "application-ld+json": JSON.stringify(seoMetadata.structuredData),
    },
  };
}
