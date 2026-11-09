import { useEffect } from 'react';

export interface PageMetaOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | null;
  noindex?: boolean;
}

const DEFAULT_DESCRIPTION =
  'Portofolio resmi SleepyKoala: indie Android game & application studio, pusat perekrutan Closed Testing 14 hari Google Play, dan pelaporan bug proyek.';
const BASE_URL = 'https://sleepykoala.pages.dev';

export function usePageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = '',
  ogType = 'website',
  jsonLd = null,
  noindex = false,
}: PageMetaOptions): void {
  useEffect(() => {
    // 1. Document Title
    const fullTitle = title.includes('SleepyKoala') ? title : `${title} | SleepyKoala Studio`;
    document.title = fullTitle;

    // Helper to get or create a meta tag
    const setMetaTag = (attribute: 'name' | 'property', key: string, content: string) => {
      let meta = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, key);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // 2. Robots Indexing Directive
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // 3. Meta Description
    setMetaTag('name', 'description', description);

    // 3. Open Graph
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    const normalizedPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    const canonicalUrl = normalizedPath === '/' ? BASE_URL : `${BASE_URL}${normalizedPath}`;
    setMetaTag('property', 'og:url', canonicalUrl);

    // 4. Twitter / X Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // 6. JSON-LD structured data (if provided)
    let jsonLdScript = document.getElementById('dynamic-jsonld') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'dynamic-jsonld';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.text = JSON.stringify(jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

    return () => {
      const script = document.getElementById('dynamic-jsonld');
      if (script) script.remove();
    };
  }, [title, description, canonicalPath, ogType, jsonLd, noindex]);
}
