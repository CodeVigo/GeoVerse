/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cesium does not tolerate React Strict Mode's dev double-mount: the globe
  // viewer is created, destroyed, then recreated, which corrupts the imagery
  // layer collection so tiles never load. Disable it so the globe mounts once.
  reactStrictMode: false,
  transpilePackages: ["@geoverse/shared"],
  experimental: {
    externalDir: true,
  },
  webpack: (config, { webpack }) => {
    // Cesium reads a global CESIUM_BASE_URL to locate its Workers/Assets at runtime.
    // The actual files are copied into /public/cesium by scripts/copy-cesium.mjs.
    config.plugins.push(
      new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify("/cesium"),
      }),
    );
    return config;
  },
};

export default nextConfig;
