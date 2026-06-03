# ┌───────────────────────────────────────────────────────────┐
# │ Dockerfile(nginx) — Nginx "컨테이너 상자" 설계도            │
# │ 1단계에서 React를 빌드하고, 2단계 Nginx 안에 그 결과를 넣는다.│
# │ (주석은 반드시 # 로 시작하는 별도 줄에 적는다)               │
# └───────────────────────────────────────────────────────────┘

# ── 1단계: React(Vite) 빌드 → 정적 파일(dist) 생성 ──
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── 2단계: Nginx가 빌드된 화면 파일을 서빙 ──
FROM nginx:1.27-alpine
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
