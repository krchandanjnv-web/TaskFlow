/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
      })
    );
    return config;
  },
};

module.exports = nextConfig;