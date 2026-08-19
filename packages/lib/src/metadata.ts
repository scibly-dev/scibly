import { type Metadata } from "next";

import { loadPackageEnv } from "./internal";

const LOCALE_THUMBNAILS = {
  en: "https://scibly-assets.s3.eu-central-1.amazonaws.com/thumbnail-en.jpg",
  de: "https://scibly-assets.s3.eu-central-1.amazonaws.com/thumbnail-de.jpg",
};

export const constructMetadata = ({
  title,
  fullTitle,
  description = "Turn documents into interactive courses in minutes. scibly is the first AI-native micro-learning and learning in the flow of work platform.",
  locale = "en",
  image = LOCALE_THUMBNAILS[locale],
  video,
  icons = [
    {
      rel: "apple-touch-icon",
      sizes: "32x32",
      url: "https://scibly-assets.s3.eu-central-1.amazonaws.com/logo-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "https://scibly-assets.s3.eu-central-1.amazonaws.com/logo-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "https://scibly-assets.s3.eu-central-1.amazonaws.com/logo-16x16.png",
    },
  ],
  url,
  canonicalUrl,
  alternateTypes,
  noIndex = false,
  manifest,
  keywords = [
    "Corporate Learning",
    "Microlearning",
    "Learning in the flow of work",
    "AI Learning Platform",
    "Corporate LMS",
    "Knowledge Management",
    "Employee Training",
  ],
  category = "Business",
}: {
  title?: string;
  fullTitle?: string;
  description?: string;
  locale?: keyof typeof LOCALE_THUMBNAILS;
  image?: string | null;
  video?: string | null;
  icons?: Metadata["icons"];
  url?: string;
  canonicalUrl?: string;

  alternateTypes?: Record<string, string>;
  noIndex?: boolean;
  manifest?: string | URL | null;
  keywords?: Metadata["keywords"];
  category?: string;
} = {}): Metadata => {
  const env = loadPackageEnv("@scibly/lib", {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  });
  const resolvedTitle =
    fullTitle ||
    (title
      ? `${title} | scibly`
      : "scibly | The next era of corporate learning | AI-Powered LMS");
  const resolvedImage = image
    ? [
        {
          url: image,
          alt: resolvedTitle,
        },
      ]
    : undefined;

  return {
    title: resolvedTitle,
    description,
    applicationName: "Scibly",
    creator: "Scibly",
    publisher: "Scibly",
    authors: [
      {
        name: "Scibly",
        url: env.NEXT_PUBLIC_BASE_URL,
      },
    ],
    ...(keywords && {
      keywords,
    }),
    ...(category && {
      category,
    }),
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      siteName: "Scibly",
      title: resolvedTitle,
      description,
      ...(resolvedImage && {
        images: resolvedImage,
      }),
      url,
      ...(video && {
        videos: video,
      }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: resolvedTitle,
      description,
      ...(resolvedImage && {
        images: resolvedImage.map((item) => item.url),
      }),
    },
    icons,
    metadataBase: new URL(env.NEXT_PUBLIC_BASE_URL),

    alternates: {
      canonical: url || canonicalUrl,
      types: alternateTypes,
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
    ...(manifest && {
      manifest,
    }),
  };
};
