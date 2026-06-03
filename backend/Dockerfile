# ┌───────────────────────────────────────────────────────────┐
# │ Dockerfile(backend) — 백엔드 "컨테이너 상자"를 만드는 설계도 │
# │ "멀티스테이지": 1단계에서 React를 빌드하고, 2단계에 그 결과만  │
# │ 가져온다.                                                    │
# │ (참고: Dockerfile은 명령어 같은 줄에 인라인 주석을 못 쓴다.    │
# │  주석은 반드시 # 로 시작하는 별도 줄에 적는다.)              │
# └───────────────────────────────────────────────────────────┘

# ── 1단계: React(Vite) 빌드해서 정적 파일(dist) 만들기 ──
FROM node:22-alpine AS fe
WORKDIR /fe
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── 2단계: 실제 실행할 백엔드 ──
FROM node:22-alpine
WORKDIR /app
COPY backend/package.json ./
RUN npm install --omit=dev
COPY backend/ ./
# 1단계에서 만든 화면 파일(dist)을 Express가 서빙할 위치(/frontend)로 가져옴
COPY --from=fe /fe/dist ../frontend/

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
