import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 개발 서버에 다른 기기(아이패드 등)로 접속할 때 허용할 주소
  // 여기에 없는 주소로 접속하면 /_next/* 요청이 막혀서 화면은 뜨지만 React가 붙지 않는다
  // 사설망 IP는 DHCP로 바뀌므로 대역 전체를 열어둔다
  allowedDevOrigins: [
    '192.168.1.216',
    '192.168.1.*',
    '192.168.0.*',
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  }
};

export default nextConfig;
