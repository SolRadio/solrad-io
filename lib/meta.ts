/**
 * Centralized Metadata Generators
 * OpenGraph, Twitter Card, and additional meta tag builders
 */

import type { Metadata } from "next"
import { SEO_CONSTANTS } from "./seo"

export interface MetaConfig {
  title: string
  description: string
  canonical: string
  ogImage?: string
  keywords?: string
  noIndex?: boolean
  type?: "website" | "article"
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
}

/**
 * Generate OpenGraph metadata
 */
export function generateOpenGraphMeta(config: MetaConfig): Metadata["openGraph"] {
  return {
    title: config.title,
    description: config.description,
    url: config.canonical,
    siteName: SEO_CONSTANTS.SITE_NAME,
    type: config.type || "website",
    images: [
      {
        url: config.ogImage || SEO_CONSTANTS.DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${config.title} - ${SEO_CONSTANTS.SITE_NAME}`,
        type: "image/png",
      },
    ],
    locale: "en_US",
    ...(config.type === "article" && {
      article: {
        publishedTime: config.publishedTime,
        modifiedTime: config.modifiedTime,
        authors: config.authors,
      },
    }),
  }
}

/**
 * Generate Twitter Card metadata
 */
export function generateTwitterMeta(config: MetaConfig): Metadata["twitter"] {
  return {
    card: "summary_large_image",
    title: config.title,
    description: config.description,
    images: [config.ogImage || SEO_CONSTANTS.DEFAULT_OG_IMAGE],
    creator: "@solrad_io",
    site: "@solrad_io",
  }
}

/**
 * Generate robots meta directives
 */
export function generateRobotsMeta(config: { noIndex?: boolean }): Metadata["robots"] {
  if (config.noIndex) {
    return {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    }
  }
  
  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  }
}

/**
 * Generate complete Next.js Metadata object
 * Main entry point for page metadata
 */
export function generatePageMetadata(config: MetaConfig): Metadata {
  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    authors: config.authors?.map(name => ({ name })),
    creator: SEO_CONSTANTS.SITE_NAME,
    publisher: SEO_CONSTANTS.SITE_NAME,
    metadataBase: new URL(SEO_CONSTANTS.BASE_URL),
    alternates: {
      canonical: config.canonical,
    },
    openGraph: generateOpenGraphMeta(config),
    twitter: generateTwitterMeta(config),
    robots: generateRobotsMeta({ noIndex: config.noIndex }),
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  }
}

/**
 * Generate metadata for article/blog pages
 */
export function generateArticleMetadata(config: {
  title: string
  description: string
  path: string
  publishedTime: string
  modifiedTime?: string
  authors?: string[]
  keywords?: string[]
  ogImage?: string
}): Metadata {
  return generatePageMetadata({
    title: config.title,
    description: config.description,
    canonical: `${SEO_CONSTANTS.BASE_URL}${config.path}`,
    ogImage: config.ogImage,
    keywords: config.keywords?.join(", "),
    type: "article",
    publishedTime: config.publishedTime,
    modifiedTime: config.modifiedTime || config.publishedTime,
    authors: config.authors || ["SOLRAD Team"],
  })
}

/**
 * Generate metadata for landing pages
 */
export function generateLandingPageMetadata(config: {
  title: string
  description: string
  path: string
  keywords: string[]
}): Metadata {
  return generatePageMetadata({
    title: config.title,
    description: config.description,
    canonical: `${SEO_CONSTANTS.BASE_URL}${config.path}`,
    keywords: config.keywords.join(", "),
    type: "website",
  })
}

/**
 * Simple metadata builder (wrapper for generatePageMetadata)
 * Accepts title, description, path, keywords, and noIndex
 */
export function buildMetadata(config: {
  title: string
  description: string
  path?: string
  keywords?: string[]
  noIndex?: boolean
}): Metadata {
  return generatePageMetadata({
    title: config.title,
    description: config.description,
    canonical: config.path ? `${SEO_CONSTANTS.BASE_URL}${config.path}` : SEO_CONSTANTS.BASE_URL,
    keywords: config.keywords?.join(", "),
    noIndex: config.noIndex,
    type: "website",
  })
}

/**
 * Viewport configuration for optimal mobile experience
 */
export const defaultViewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}
