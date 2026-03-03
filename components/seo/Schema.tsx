/**
 * SEO Schema Injector
 * Supports: WebPage, FAQPage, SoftwareApplication, Article, BreadcrumbList
 * Zero runtime overhead - fully static JSON-LD injection
 */

import type { ReactElement } from "react"

// Schema type definitions
export interface FAQItem {
  question: string
  answer: string
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export interface WebPageSchema {
  type: "WebPage"
  url: string
  name: string
  description: string
  image?: string
  datePublished?: string
  dateModified?: string
}

export interface FAQPageSchema {
  type: "FAQPage"
  url: string
  name: string
  faqs: FAQItem[]
}

export interface SoftwareApplicationSchema {
  type: "SoftwareApplication"
  name: string
  applicationCategory: string
  operatingSystem: string
  offers?: {
    price: string
    priceCurrency?: string
  }
  aggregateRating?: {
    ratingValue: number
    ratingCount: number
  }
  description?: string
}

export interface ArticleSchema {
  type: "Article"
  headline: string
  description: string
  image?: string
  datePublished: string
  dateModified?: string
  author: {
    name: string
    url?: string
  }
  publisher: {
    name: string
    logo?: {
      url: string
      width?: number
      height?: number
    }
  }
}

export interface BreadcrumbListSchema {
  type: "BreadcrumbList"
  items: BreadcrumbItem[]
}

export type SchemaType =
  | WebPageSchema
  | FAQPageSchema
  | SoftwareApplicationSchema
  | ArticleSchema
  | BreadcrumbListSchema

interface SchemaProps {
  schema: SchemaType | SchemaType[]
}

/**
 * Generate JSON-LD for WebPage schema
 */
function generateWebPageSchema(schema: WebPageSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: schema.url,
    name: schema.name,
    description: schema.description,
    ...(schema.image && { image: schema.image }),
    ...(schema.datePublished && { datePublished: schema.datePublished }),
    ...(schema.dateModified && { dateModified: schema.dateModified }),
  }
}

/**
 * Generate JSON-LD for FAQPage schema
 */
function generateFAQPageSchema(schema: FAQPageSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: schema.url,
    name: schema.name,
    mainEntity: schema.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

/**
 * Generate JSON-LD for SoftwareApplication schema
 */
function generateSoftwareApplicationSchema(
  schema: SoftwareApplicationSchema
): object {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: schema.name,
    applicationCategory: schema.applicationCategory,
    operatingSystem: schema.operatingSystem,
    ...(schema.description && { description: schema.description }),
    ...(schema.offers && {
      offers: {
        "@type": "Offer",
        price: schema.offers.price,
        priceCurrency: schema.offers.priceCurrency || "USD",
      },
    }),
    ...(schema.aggregateRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: schema.aggregateRating.ratingValue,
        ratingCount: schema.aggregateRating.ratingCount,
      },
    }),
  }
}

/**
 * Generate JSON-LD for Article schema
 */
function generateArticleSchema(schema: ArticleSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: schema.headline,
    description: schema.description,
    ...(schema.image && { image: schema.image }),
    datePublished: schema.datePublished,
    ...(schema.dateModified && { dateModified: schema.dateModified }),
    author: {
      "@type": "Person",
      name: schema.author.name,
      ...(schema.author.url && { url: schema.author.url }),
    },
    publisher: {
      "@type": "Organization",
      name: schema.publisher.name,
      ...(schema.publisher.logo && {
        logo: {
          "@type": "ImageObject",
          url: schema.publisher.logo.url,
          ...(schema.publisher.logo.width && {
            width: schema.publisher.logo.width,
          }),
          ...(schema.publisher.logo.height && {
            height: schema.publisher.logo.height,
          }),
        },
      }),
    },
  }
}

/**
 * Generate JSON-LD for BreadcrumbList schema
 */
function generateBreadcrumbListSchema(schema: BreadcrumbListSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: schema.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate JSON-LD based on schema type
 */
function generateSchema(schema: SchemaType): object {
  switch (schema.type) {
    case "WebPage":
      return generateWebPageSchema(schema)
    case "FAQPage":
      return generateFAQPageSchema(schema)
    case "SoftwareApplication":
      return generateSoftwareApplicationSchema(schema)
    case "Article":
      return generateArticleSchema(schema)
    case "BreadcrumbList":
      return generateBreadcrumbListSchema(schema)
    default:
      return {}
  }
}

/**
 * Schema Component
 * Injects JSON-LD structured data into the page
 * Supports single or multiple schemas
 */
export function Schema({ schema }: SchemaProps): ReactElement {
  const schemas = Array.isArray(schema) ? schema : [schema]

  return (
    <>
      {schemas.map((s, index) => {
        const jsonLd = generateSchema(s)
        return (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLd),
            }}
          />
        )
      })}
    </>
  )
}

/**
 * Usage Examples:
 * 
 * // Single WebPage schema
 * <Schema schema={{
 *   type: "WebPage",
 *   url: "https://solrad.io/about",
 *   name: "About SOLRAD",
 *   description: "Learn about SOLRAD token intelligence platform"
 * }} />
 * 
 * // Multiple schemas
 * <Schema schema={[
 *   {
 *     type: "WebPage",
 *     url: "https://solrad.io/faq",
 *     name: "FAQ",
 *     description: "Frequently Asked Questions"
 *   },
 *   {
 *     type: "FAQPage",
 *     url: "https://solrad.io/faq",
 *     name: "SOLRAD FAQ",
 *     faqs: [
 *       {
 *         question: "What is SOLRAD?",
 *         answer: "SOLRAD is a Solana token intelligence platform..."
 *       }
 *     ]
 *   }
 * ]} />
 * 
 * // SoftwareApplication schema
 * <Schema schema={{
 *   type: "SoftwareApplication",
 *   name: "SOLRAD",
 *   applicationCategory: "FinanceApplication",
 *   operatingSystem: "Web Browser",
 *   offers: {
 *     price: "0",
 *     priceCurrency: "USD"
 *   }
 * }} />
 * 
 * // Article schema
 * <Schema schema={{
 *   type: "Article",
 *   headline: "How to Find Solana Gems",
 *   description: "Complete guide to finding gems on Solana",
 *   datePublished: "2024-01-01T00:00:00Z",
 *   author: { name: "SOLRAD Team" },
 *   publisher: { name: "SOLRAD" }
 * }} />
 * 
 * // BreadcrumbList schema
 * <Schema schema={{
 *   type: "BreadcrumbList",
 *   items: [
 *     { name: "Home", url: "https://solrad.io" },
 *     { name: "Trending", url: "https://solrad.io/solana-trending" },
 *     { name: "Last 1H", url: "https://solrad.io/solana-trending/last-1h" }
 *   ]
 * }} />
 */
