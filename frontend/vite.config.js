// vite.config.js — Vite(빌드/개발 도구) 설정 파일.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // JSX(React 문법)를 브라우저가 알아듣게 변환

export default defineConfig({
  plugins: [react()],
  server: {
    // "npm run dev"로 개발 서버(5173)를 켰을 때만 쓰는 설정.
    // 화면에서 /api로 보낸 요청을 백엔드(3000)로 대신 전달해준다.
    // (실제 배포/도커 환경에서는 Nginx가 이 역할을 한다)
    proxy: { "/api": "http://localhost:3000" },
  },
});
