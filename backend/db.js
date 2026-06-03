// ┌─────────────────────────────────────────────────────────┐
// │ db.js — 데이터베이스(PostgreSQL) 연결 담당                 │
// └─────────────────────────────────────────────────────────┘
import pg from "pg"; // PostgreSQL과 대화하는 라이브러리

const { Pool } = pg;

// Pool = DB 연결을 여러 개 미리 만들어두고 재사용하는 "연결 묶음".
// 접속 정보(주소·비번 등)는 코드에 직접 안 쓰고 환경변수로 받는다 → 안전.
//   로컬: docker-compose가 db 컨테이너 주소를 넣어줌
//   배포: Vercel이 관리형 Postgres(Neon) 주소를 환경변수로 넣어줌
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 서버가 켜질 때 호출: 표가 없으면 만들고, 비어 있으면 예시 데이터를 넣는다.
// (배포 환경처럼 init.sql을 못 쓰는 곳에서도 표가 보장되도록)
export async function ensureSchema() {
  // ── 표 ① expenses : 일회성 지출 (그날 한 번 쓴 돈) ──
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id         SERIAL PRIMARY KEY,             -- 자동 증가 고유 번호
      amount     INTEGER NOT NULL CHECK (amount > 0),  -- 금액(원). 0보다 커야 함
      category   TEXT NOT NULL,                  -- 분류(식비/교통/...)
      memo       TEXT NOT NULL DEFAULT '',       -- 메모
      spent_on   DATE NOT NULL DEFAULT CURRENT_DATE,   -- 지출한 날짜
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // ── 표 ② recurring_expenses : 정기(매달) 지출 = 구독 등 ──
  // start_month(시작월)부터 매달 자동으로 그 달 지출에 합산된다.
  // end_month가 NULL이면 "계속 유지", 값이 있으면 그 달까지만.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recurring_expenses (
      id           SERIAL PRIMARY KEY,
      amount       INTEGER NOT NULL CHECK (amount > 0),
      category     TEXT NOT NULL,
      memo         TEXT NOT NULL DEFAULT '',
      day_of_month INTEGER NOT NULL DEFAULT 1
                   CHECK (day_of_month BETWEEN 1 AND 31),  -- 매월 결제일
      start_month  DATE NOT NULL,                 -- 시작월의 1일 (예: 2026-06-01)
      end_month    DATE,                          -- 종료월(포함). NULL = 계속
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // ── 표 ③ incomes : 수입 (돈이 들어온 기록) ──
  // 지출과 대칭 구조. 그 달 수입을 합산해 "잔액 = 수입 − 지출"을 계산한다.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS incomes (
      id          SERIAL PRIMARY KEY,
      amount      INTEGER NOT NULL CHECK (amount > 0),  -- 금액(원)
      category    TEXT NOT NULL,                        -- 분류(월급/용돈/...)
      memo        TEXT NOT NULL DEFAULT '',             -- 메모
      received_on DATE NOT NULL DEFAULT CURRENT_DATE,   -- 받은 날짜
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 비어 있으면 데모 데이터를 넣는다 (날짜는 "오늘" 기준 → 항상 이번 달에 보임)
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM expenses");
  const r2 = await pool.query("SELECT COUNT(*)::int AS n FROM recurring_expenses");
  const r3 = await pool.query("SELECT COUNT(*)::int AS n FROM incomes");
  if (rows[0].n === 0) {
    await pool.query(`
      INSERT INTO expenses (amount, category, memo, spent_on) VALUES
        (9000,  '식비', '점심 김밥천국', CURRENT_DATE),
        (1500,  '교통', '지하철',        CURRENT_DATE),
        (45000, '쇼핑', '운동화',        CURRENT_DATE - INTERVAL '2 day');
    `);
  }
  if (r2.rows[0].n === 0) {
    await pool.query(`
      INSERT INTO recurring_expenses (amount, category, memo, day_of_month, start_month) VALUES
        (17000, '구독', '넷플릭스',   15, date_trunc('month', CURRENT_DATE)),
        (10900, '구독', '유튜브 프리미엄', 1, date_trunc('month', CURRENT_DATE));
    `);
  }
  if (r3.rows[0].n === 0) {
    await pool.query(`
      INSERT INTO incomes (amount, category, memo, received_on) VALUES
        (2500000, '월급', '6월 급여', date_trunc('month', CURRENT_DATE) + INTERVAL '24 day');
    `);
  }
}
