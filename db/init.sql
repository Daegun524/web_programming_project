-- ┌─────────────────────────────────────────────────────────┐
-- │ init.sql — 데이터베이스 초기 설정 (SQL 언어)              │
-- │ DB 컨테이너가 "처음" 만들어질 때 딱 한 번 자동 실행된다.    │
-- │ (docker-compose가 이 파일을 DB 안에 넣어둔다)             │
-- └─────────────────────────────────────────────────────────┘

-- ── 표 ① expenses : 일회성 지출 ──
CREATE TABLE IF NOT EXISTS expenses (
  id         SERIAL PRIMARY KEY,
  amount     INTEGER NOT NULL CHECK (amount > 0),  -- 금액(원)
  category   TEXT NOT NULL,                        -- 분류
  memo       TEXT NOT NULL DEFAULT '',             -- 메모
  spent_on   DATE NOT NULL DEFAULT CURRENT_DATE,   -- 지출 날짜
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 표 ② recurring_expenses : 정기(매달) 지출 = 구독 등 ──
-- 시작월(start_month)부터 매달 자동 합산. end_month가 NULL이면 계속 유지.
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id           SERIAL PRIMARY KEY,
  amount       INTEGER NOT NULL CHECK (amount > 0),
  category     TEXT NOT NULL,
  memo         TEXT NOT NULL DEFAULT '',
  day_of_month INTEGER NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 31),
  start_month  DATE NOT NULL,
  end_month    DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 표 ③ incomes : 수입 (돈이 들어온 기록) ──
-- 지출과 대칭. 그 달에 받은 수입을 합산해 "잔액 = 수입 − 지출"을 계산한다.
CREATE TABLE IF NOT EXISTS incomes (
  id          SERIAL PRIMARY KEY,
  amount      INTEGER NOT NULL CHECK (amount > 0),  -- 금액(원)
  category    TEXT NOT NULL,                        -- 분류(월급/용돈/...)
  memo        TEXT NOT NULL DEFAULT '',             -- 메모
  received_on DATE NOT NULL DEFAULT CURRENT_DATE,   -- 받은 날짜
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 화면이 비어 보이지 않도록 예시 데이터 (날짜는 "오늘" 기준 → 이번 달에 표시)
INSERT INTO expenses (amount, category, memo, spent_on) VALUES
  (9000,  '식비', '점심 김밥천국', CURRENT_DATE),
  (1500,  '교통', '지하철',        CURRENT_DATE),
  (45000, '쇼핑', '운동화',        CURRENT_DATE - INTERVAL '2 day');

INSERT INTO recurring_expenses (amount, category, memo, day_of_month, start_month) VALUES
  (17000, '구독', '넷플릭스',        15, date_trunc('month', 2024-01-01)),
  (10900, '구독', '유튜브 프리미엄',  1, date_trunc('month', CURRENT_DATE));

INSERT INTO incomes (amount, category, memo, received_on) VALUES
  (2500000, '월급', '6월 급여', date_trunc('month', CURRENT_DATE) + INTERVAL '24 day');
