import { ClerkProvider } from '@clerk/nextjs'
import { Nunito } from 'next/font/google'
import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'

const nunito = Nunito({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Vireo - AI Video Editor | Make Viral Reels & TikToks Instantly',
    description: 'Turn your raw clips into viral-ready reels in seconds. Vireo is the AI-powered video editor that creates beat-synced TikToks, Instagram Reels & YouTube Shorts automatically. No editing skills needed.',
    keywords: 'video editor, reel maker, TikTok video editor, viral video creator, AI video editor, beat sync editor, Instagram reels maker, short video creator, YouTube Shorts maker, reel creator app, automatic video editor, turn clips into reels, video to TikTok converter, viral reels, short form video, social media video editor',
    authors: [{ name: 'Vireo' }],
    robots: 'index, follow',
    openGraph: {
        type: 'website',
        url: 'https://editvireo.com/',
        title: 'Vireo - AI Video Editor | Make Viral Reels & TikToks Instantly',
        description: 'Turn your raw clips into viral-ready reels in seconds. AI-powered beat-synced editing for TikTok, Instagram Reels & YouTube Shorts.',
        images: [
            {
                url: 'https://editvireo.com/android-chrome-512x512.png',
                width: 512,
                height: 512,
            },
        ],
        siteName: 'Vireo',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Vireo - AI Video Editor | Make Viral Reels & TikToks Instantly',
        description: 'Turn your raw clips into viral-ready reels in seconds. AI-powered beat-synced editing for TikTok, Instagram Reels & YouTube Shorts.',
        images: ['https://editvireo.com/android-chrome-512x512.png'],
    },
    icons: {
        icon: [
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        ],
        apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
}

export const viewport = {
    themeColor: '#4ECDC4',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ClerkProvider>
            <html lang="en">
                <head>
                    {/* Google Analytics */}
                    <Script
                        async
                        src="https://www.googletagmanager.com/gtag/js?id=G-SPQWPZYRCP"
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-SPQWPZYRCP');
            `}
                    </Script>

                    {/* Google AdSense */}
                    <Script
                        async
                        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7431469479082797"
                        crossOrigin="anonymous"
                        strategy="afterInteractive"
                    />

                    {/* Umami Analytics */}
                    <Script
                        defer
                        src="https://cloud.umami.is/script.js"
                        data-website-id="8725e3eb-4d82-457c-baf1-a0f9875bd0df"
                        strategy="afterInteractive"
                    />

                    {/* Font Awesome */}
                    <link
                        rel="stylesheet"
                        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
                        integrity="sha512-SfZ6P3xYpNsmW4W+WvVManIeZDV4mQdlqzTeWY5Avzkdxl3pNGdisM8Iky3UczZz7YT1Nx1B4ezhO6LNpH3K0w=="
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                    />

                    {/* JSON-LD Structured Data */}
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify({
                                '@context': 'https://schema.org',
                                '@type': 'WebApplication',
                                name: 'Vireo',
                                alternateName: 'Vireo Video Editor',
                                url: 'https://editvireo.com',
                                description: 'AI-powered video editor that turns raw clips into viral-ready reels with automatic beat-synced editing for TikTok, Instagram Reels, and YouTube Shorts.',
                                applicationCategory: 'MultimediaApplication',
                                operatingSystem: 'Web Browser',
                                browserRequirements: 'Requires JavaScript',
                                offers: {
                                    '@type': 'Offer',
                                    price: '0',
                                    priceCurrency: 'USD',
                                    description: 'Free tier with 2 video generations',
                                },
                                featureList: [
                                    'AI-powered video editing',
                                    'Automatic beat synchronization',
                                    'TikTok reel creation',
                                    'Instagram Reels maker',
                                    'YouTube Shorts creator',
                                    'Multiple vibe styles',
                                    'One-click viral videos',
                                ],
                                screenshot: 'https://editvireo.com/android-chrome-512x512.png',
                                softwareVersion: '1.0',
                                creator: {
                                    '@type': 'Organization',
                                    name: 'Vireo',
                                    url: 'https://editvireo.com',
                                },
                            }),
                        }}
                    />
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify({
                                '@context': 'https://schema.org',
                                '@type': 'SoftwareApplication',
                                name: 'Vireo - AI Video Editor',
                                applicationCategory: 'VideoApplication',
                                operatingSystem: 'Web',
                                offers: {
                                    '@type': 'Offer',
                                    price: '0',
                                    priceCurrency: 'USD',
                                },
                                aggregateRating: {
                                    '@type': 'AggregateRating',
                                    ratingValue: '4.8',
                                    ratingCount: '150',
                                },
                            }),
                        }}
                    />
                </head>
                <body className={nunito.className}>{children}</body>
            </html>
        </ClerkProvider>
    )
}
