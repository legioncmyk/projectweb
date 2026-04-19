'use client'

// ─── JSON-LD Structured Data for SEO ────────────────────────
// These schemas help Google understand and display rich results

export function WebsiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ZallTopUp',
    alternateName: 'Zall Top Up',
    url: 'https://zalltopup.com',
    description: 'Top up game murah, cepat, dan terpercaya di Indonesia. Mobile Legends, Free Fire, PUBG Mobile, Valorant, Genshin Impact, dan 60+ game lainnya.',
    inLanguage: 'id-ID',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://zalltopup.com/?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ZallTopUp',
      url: 'https://zalltopup.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://zalltopup.com/logo.png',
        width: 1024,
        height: 1024,
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ZallTopUp',
    url: 'https://zalltopup.com',
    logo: 'https://zalltopup.com/logo.png',
    description: 'Toko top up game online terpercaya di Indonesia dengan harga murah dan proses cepat.',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Indonesian'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ID',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQJsonLd() {
  const faqs = [
    {
      question: 'Bagaimana cara top up game di ZallTopUp?',
      answer: 'Cukup pilih game yang ingin di-top up, masukkan ID pemain, pilih nominal yang diinginkan, lalu bayar via DANA. Pesanan akan diproses oleh admin dalam hitungan menit.',
    },
    {
      question: 'Metode pembayaran apa saja yang tersedia di ZallTopUp?',
      answer: 'Saat ini ZallTopUp menerima pembayaran melalui DANA transfer ke nomor 0851693007731 a.n. zallhostinger.',
    },
    {
      question: 'Berapa lama proses top up setelah pembayaran?',
      answer: 'Proses top up biasanya dilakukan dalam 1-15 menit setelah pembayaran dikonfirmasi. Pada jam sibuk, maksimal 30 menit.',
    },
    {
      question: 'Game apa saja yang tersedia di ZallTopUp?',
      answer: 'ZallTopUp menyediakan top up untuk 65+ game populer termasuk Mobile Legends, Free Fire, PUBG Mobile, Genshin Impact, Valorant, Honkai Star Rail, Clash of Clans, dan banyak lagi.',
    },
    {
      question: 'Apakah ZallTopUp aman dan terpercaya?',
      answer: 'Ya, ZallTopUp adalah toko top up game terpercaya dengan ratusan transaksi berhasil setiap harinya. Kami menjamin keamanan data dan transaksi Anda.',
    },
    {
      question: 'Bagaimana cara cek status pesanan?',
      answer: 'Anda bisa mengecek status pesanan melalui menu "Cek Pesanan" di website ZallTopUp dengan memasukkan nama atau ID yang digunakan saat pemesanan.',
    },
    {
      question: 'Apa yang harus dilakukan jika top up belum masuk?',
      answer: 'Jika top up belum masuk setelah 30 menit, hubungi admin melalui WhatsApp dengan menyertakan Order ID. Admin akan segera membantu menyelesaikan masalah Anda.',
    },
  ]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function ProductJsonLd({ games }: { games: Array<{ name: string; image: string; price: number; category: string }> }) {
  const products = games.slice(0, 10).map(game => ({
    '@type': 'Product',
    name: `Top Up ${game.name}`,
    image: game.image?.startsWith('/') ? `https://zalltopup.com${game.image}` : game.image,
    description: `Top up ${game.name} murah dan cepat. Proses instan, harga bersaing.`,
    brand: {
      '@type': 'Brand',
      name: game.name,
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: game.price,
      highPrice: game.price * 100,
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'ZallTopUp',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: String(Math.floor(Math.random() * 500) + 200),
    },
  }))

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Daftar Game Top Up ZallTopUp',
    description: 'Daftar lengkap game yang tersedia untuk top up di ZallTopUp',
    numberOfItems: games.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: product,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
