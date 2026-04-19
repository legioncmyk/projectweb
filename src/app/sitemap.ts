// Dynamic Sitemap Generator for ZallTopUp
// This creates SEO-friendly sitemaps for all game pages

import type { MetadataRoute } from 'next'

const SITE_URL = 'https://zalltopup.com'

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ]

  // Game slugs for dynamic pages (these would be separate routes if we had them)
  const gameSlugs = [
    'free-fire', 'pubg-mobile', 'mobile-legends-bang-bang', 'genshin-impact',
    'valorant', 'honkai-star-rail', 'clash-of-clans', 'clash-royale',
    'brawl-stars', 'call-of-duty-mobile', 'arena-of-valor', 'naruto-mobile',
    'ragnarok-m-eternal-love', 'lineage-w', 'lineage-2m', 'black-desert-mobile',
    'dragon-nest-mobile', 'tower-of-fantasy', 'wuthering-waves', 'zenless-zone-zero',
    'honkai-impact-3rd', 'fate-grand-order', 'epic-seven', 'summoners-war',
    'seven-knights-2', 'grand-chase', 'lords-mobile', 'rise-of-kingdoms',
    'arknights', 'girls-frontline', 'punishing-gray-raven', 'solo-leveling-arise',
    'dragon-ball-legends', 'pokemon-unite', 'mobile-legends', 'fifa-mobile',
    'efootball', 'nba-2k-mobile', 'asphalt-9-legends', 'marvel-snap',
    'identity-v', 'dead-by-daylight-mobile', 'lifeafter', 'sky-children-of-the-light',
    'love-nikki', 'azur-lane', 'hearthstone', 'magic-the-gathering-arena',
    'yu-gi-oh-master-duel', 'auto-chess', 'garena-aov', 'apex-legends-mobile',
    'farlight-84', 'heroes-of-the-storm', 'tree-of-savior', 'toram-online',
    'perfect-world-mobile', 'guns-of-glory', 'elsword', 'heaven-burns-red',
    'ultra-demons', 'rise-of-nowlin', 'king-of-kings', 'saint-seiya-awakening',
    'evony',
  ]

  const gamePages: MetadataRoute.Sitemap = gameSlugs.map((slug) => ({
    url: `${SITE_URL}/game/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...gamePages]
}
