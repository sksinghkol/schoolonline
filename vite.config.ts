import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 4200
  },
  assetsInclude: ['**/*.bin', '**/*_shard*', '**/*_weights_manifest.json']
});
