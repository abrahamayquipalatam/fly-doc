import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FlyDoc',
    short_name: 'FlyDoc',
    description: 'Explorador de archivos tipo Windows 11 para Google Drive',
    start_url: '/',
    display: 'standalone',
    background_color: '#2A0087',
    theme_color: '#2A0087',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
