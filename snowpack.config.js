/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    public: '/',
    src: '/dist',
  },
  plugins: [
    '@snowpack/plugin-react-refresh',
    '@snowpack/plugin-dotenv',
    '@snowpack/plugin-typescript',
    [
      '@snowpack/plugin-webpack',
      {
        /* see "Plugin Options" below */
      },
    ],
  ],
  install: [
    /* ... */
  ],
  installOptions: {
    /* ... */
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    /* ... */
    baseUrl: '/maze-builder/',
  },
  proxy: {
    /* ... */
  },
  alias: {
    /* ... */
    src: './src',
    components: './src/components',
    containers: './src/containers',
    models: './src/core/models ',
    assets: './src/assets',
  },
};
