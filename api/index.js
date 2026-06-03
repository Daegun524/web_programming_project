// ┌─────────────────────────────────────────────────────────┐
// │ api/index.js — Vercel "서버리스 함수"                      │
// │                                                           │
// │ Vercel은 24시간 켜진 서버 대신, 요청이 올 때마다 잠깐        │
// │ 깨어나는 "함수"를 실행한다. 이 파일이 그 진입점이다.         │
// │ vercel.json의 rewrite가 /api/* 요청을 전부 여기로 보낸다.   │
// │                                                           │
// │ 우리는 이미 만든 Express 앱(app.js)을 그대로 재사용한다.     │
// └─────────────────────────────────────────────────────────┘
import app, { ensureSchema } from "../backend/app.js";

// DB 표 준비는 처음 한 번만 하면 된다. 그 약속을 기억해두고 재사용.
let schemaReady;

export default async function handler(req, res) {
  if (!schemaReady) {
    // 실패하면 다음 요청에서 다시 시도하도록 초기화
    schemaReady = ensureSchema().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  await schemaReady;
  // Express 앱은 그 자체가 (요청, 응답)을 처리하는 함수다 → 그대로 넘긴다.
  return app(req, res);
}
