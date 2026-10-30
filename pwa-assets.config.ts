import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Erzeugt die App-Icons aus public/icon.svg. iOS bekommt einen dunklen Hintergrund statt Weiß.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#0F1012', fit: 'contain' } },
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#0F1012', fit: 'contain' } },
  },
  images: ['public/icon.svg'],
});
