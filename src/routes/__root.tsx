import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { IconContext } from '@phosphor-icons/react'

import appCss from '../styles.css?url'

const DESCRIPTION =
  'A drawing race with friends. Everyone draws the same word, Drishti watches every canvas, and the first drawing it recognizes wins.'
const SITE = 'https://doodleblaze.bimsina.dev'
// Rendered from scripts/brand/og.html by scripts/brand/render.sh.
const OG_IMAGE = `${SITE}/og.png`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Doodleblaze · draw fast, blaze first' },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#ff5a1f' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Doodleblaze' },
      { property: 'og:url', content: SITE },
      { property: 'og:title', content: 'Doodleblaze · draw fast, blaze first' },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:image', content: OG_IMAGE },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Doodleblaze: a doodle of a giraffe stamped “Blazed!”' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: OG_IMAGE },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Gabarito:wght@600..900&family=Figtree:wght@400..800&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* Phosphor icons everywhere: bold by default to sit with the heavy type; filled where noted. */}
        <IconContext.Provider value={{ weight: 'bold' }}>{children}</IconContext.Provider>
        <Scripts />
      </body>
    </html>
  )
}
