/**
 * XML Sitemap Generator for Kmetija Maroša
 * Run with: npx ts-node scripts/generateSitemap.ts
 * 
 * Generates sitemap.xml in the public folder
 */

import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://kmetija-marosa.si';
const LANGUAGES = ['sl', 'en', 'de', 'hr'];

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: { lang: string; href: string }[];
}

// Static pages
const staticPages: SitemapUrl[] = [
  {
    loc: '/',
    changefreq: 'weekly',
    priority: 1.0
  },
  {
    loc: '/o-nas',
    changefreq: 'monthly',
    priority: 0.8
  },
  {
    loc: '/recipes',
    changefreq: 'weekly',
    priority: 0.7
  },
  {
    loc: '/cart',
    changefreq: 'weekly',
    priority: 0.5
  },
  {
    loc: '/darilo',
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    loc: '/login',
    changefreq: 'yearly',
    priority: 0.3
  },
  {
    loc: '/privacy-policy',
    changefreq: 'yearly',
    priority: 0.2
  }
];

// Product pages (these should ideally be fetched from Supabase)
const productPages: SitemapUrl[] = [
  { loc: '/izdelek/aronija-100-sok', changefreq: 'monthly', priority: 0.9 },
  { loc: '/izdelek/aronija-marmelada', changefreq: 'monthly', priority: 0.9 },
  { loc: '/izdelek/aronija-caj', changefreq: 'monthly', priority: 0.9 },
  { loc: '/izdelek/slamnik-caj', changefreq: 'monthly', priority: 0.9 },
  { loc: '/izdelek/slamnik-sirup', changefreq: 'monthly', priority: 0.9 },
  { loc: '/izdelek/med', changefreq: 'monthly', priority: 0.9 },
  // Add more products as needed
];

// Recipe pages
const recipePages: SitemapUrl[] = [
  { loc: '/recipes/aronija-smoothie', changefreq: 'monthly', priority: 0.6 },
  { loc: '/recipes/slamnik-caj-recept', changefreq: 'monthly', priority: 0.6 },
  // Add more recipes as needed
];

function generateXMLSitemap(): string {
  const allPages = [...staticPages, ...productPages, ...recipePages];
  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  for (const page of allPages) {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${page.loc}</loc>\n`;
    xml += `    <lastmod>${page.lastmod || today}</lastmod>\n`;
    
    if (page.changefreq) {
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    }
    
    if (page.priority !== undefined) {
      xml += `    <priority>${page.priority.toFixed(1)}</priority>\n`;
    }

    // Add hreflang alternates for multilingual support
    for (const lang of LANGUAGES) {
      xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE_URL}${page.loc}?lang=${lang}"/>\n`;
    }
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${page.loc}"/>\n`;

    xml += '  </url>\n';
  }

  xml += '</urlset>';
  return xml;
}

function generateRobotsTxt(): string {
  return `# Robots.txt for Kmetija Maroša
User-agent: *
Allow: /

# Disallow admin pages
Disallow: /admin/
Disallow: /admin/*

# Disallow checkout and cart for crawlers
Disallow: /checkout
Disallow: /checkout-steps
Disallow: /checkout-modular

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
`;
}

// Main execution
function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Generate sitemap
  const sitemap = generateXMLSitemap();
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap, 'utf-8');
  console.log(`✓ Generated sitemap.xml at ${sitemapPath}`);
  console.log(`  - ${staticPages.length} static pages`);
  console.log(`  - ${productPages.length} product pages`);
  console.log(`  - ${recipePages.length} recipe pages`);
  console.log(`  - ${LANGUAGES.length} language variants each`);

  // Generate robots.txt
  const robotsTxt = generateRobotsTxt();
  const robotsPath = path.join(publicDir, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8');
  console.log(`✓ Generated robots.txt at ${robotsPath}`);
}

main();
