/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // INTERNAL_API_URL is for server-side rewrites inside Docker where
    // "localhost" doesn't reach the backend container. Falls back to the
    // public-facing URL for local dev outside Docker.
    const apiBase =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";
    return [
      // Next.js strips trailing slashes before applying rewrites (trailingSlash: false default).
      // Django requires trailing slashes, so we always append one in the destination.
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*/`,
      },
    ];
  },
};

module.exports = nextConfig;
