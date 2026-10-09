import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relative base so the build works on GitHub Pages (/chess/) or any static host.
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Chess Mentor',
        short_name: 'Chess Mentor',
        description: 'Learn chess openings with bite-sized lessons and spaced repetition.',
        theme_color: '#302e2b',
        background_color: '#302e2b',
        display: 'standalone',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png?v=c2', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png?v=c2', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png?v=c2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The chess engine (~1.8 MB of WASM) is precached too, so games work offline.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,wasm}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  test: { environment: 'node' },
});
