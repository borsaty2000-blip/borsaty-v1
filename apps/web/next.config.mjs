/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@borsaty/shared", "@borsaty/db", "@borsaty/ui"],
  reactStrictMode: true,
};

export default nextConfig;
