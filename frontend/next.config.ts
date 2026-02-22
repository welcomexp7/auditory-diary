import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== "production";

// next-pwa 플러그인 설정
// 참고: next-pwa는 next 15+ 에서는 실험적인 설정이 필요할 수 있습니다.
const nextConfig: NextConfig = {
  // PWA는 프로덕션 빌드에서만 활성화하거나 테스트를 위해 개발에서도 켤 수 있습니다.
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" }, // Spotify
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google
      { protocol: "https", hostname: "images.unsplash.com" } // Mock data
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : 'http://localhost:8000/api/:path*' // default for local fallback
      }
    ];
  }
};

export default nextConfig;
