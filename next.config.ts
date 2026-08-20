import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 개발 서버를 localhost가 아닌 호스트(포트 포워딩·사내 리버스 프록시)로 열 때
   * HMR 요청이 차단되지 않도록 허용 목록을 둔다. dev 전용 — 프로덕션 영향 없음.
   */
  allowedDevOrigins: [
    "127.0.0.1",
    "192.168.10.10",
    "*.idc.hectoai.co.kr",
  ],
};

export default nextConfig;
