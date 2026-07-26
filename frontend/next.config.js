/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  headers: async () => [
    {
      source: "/sw.js",
      headers: [{ key: "Service-Worker-Allowed", value: "/" }],
    },
  ],
}

module.exports = nextConfig
