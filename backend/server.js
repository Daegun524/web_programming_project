// ┌─────────────────────────────────────────────────────────┐
// │ server.js — 로컬/도커용 서버 실행기                        │
// │ app.js(앱 본체)를 가져와서, DB 표를 준비한 뒤 포트를 연다.   │
// │ (Vercel 배포에서는 이 파일 대신 api/index.js가 쓰인다)      │
// └─────────────────────────────────────────────────────────┘
import app, { ensureSchema } from "./app.js";

const PORT = process.env.PORT || 3000; // 환경변수 PORT가 있으면 그걸, 없으면 3000

// 먼저 DB 테이블을 준비(ensureSchema)한 뒤 서버를 켠다.
ensureSchema()
  .then(() => app.listen(PORT, () => console.log(`API listening on :${PORT}`)))
  .catch((e) => {
    console.error("schema init failed:", e);
    process.exit(1); // DB 준비 실패면 서버를 끈다
  });
