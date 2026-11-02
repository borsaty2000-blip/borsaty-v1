/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@borsaty/shared", "@borsaty/db", "@borsaty/ui"],
  reactStrictMode: true,
  experimental: {
    nodeMiddleware: true,
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};

export default nextConfig;
