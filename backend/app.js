// ┌─────────────────────────────────────────────────────────┐
// │ app.js — Express "앱"의 본체(경로/규칙 정의)               │
// │                                                           │
// │ 왜 server.js와 나눴나?                                     │
// │  같은 앱을 두 군데서 재사용하기 위해서다.                    │
// │   · 로컬/도커: server.js가 이 app을 가져와 포트를 연다.      │
// │   · Vercel:   api/index.js가 이 app을 가져와 서버리스 함수로 │
// │     실행한다(포트를 직접 열지 않음).                         │
// └─────────────────────────────────────────────────────────┘
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, ensureSchema } from "./db.js"; // DB 연결
import { isValidAmount, isValidCategory, isValidIncomeCategory, isValidDay, isValidMonth } from "./validate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express(); // 서버 앱 생성
app.use(express.json()); // 들어오는 요청의 JSON 본문을 자동 해석

// 월 문자열("YYYY-MM")이 없으면 "이번 달"을 기본값으로 (서버 로컬 시간 기준)
function monthOrNow(q) {
  if (isValidMonth(q)) return q;
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ──────────────────────────────────────────────
// REST API — 각 경로가 DB(PostgreSQL)에 직접 질의한다.
// ──────────────────────────────────────────────

// 헬스체크: 서버가 살아있는지 확인 (배포 플랫폼·CI가 사용)
app.get("/api/health", (req, res) => res.json({ ok: true }));

// [요약] 한 달치 화면에 필요한 모든 것을 한 번에 돌려준다.
//  - 그 달의 일회성 지출 목록 + 그 달에 해당하는 정기 지출 목록
//  - 두 합계와 총 지출액
//  이게 이 앱의 핵심: "정기 지출"은 시작월 이후 모든 달에 자동 포함된다.
app.get("/api/summary", async (req, res, next) => {
  try {
    const month = monthOrNow(req.query.month); // "2026-06"
    const monthStart = `${month}-01`; // "2026-06-01"

    // 세 쿼리(지출·정기·수입)를 Promise.all로 "동시에" 던진다.
    //   - await를 3번 줄줄이 쓰면: 지출 끝 → 정기 끝 → 수입 끝 (왕복 3번, 합산)
    //   - Promise.all로 묶으면: 셋을 한꺼번에 보내고 다 올 때까지 한 번만 기다림 (왕복 1번)
    //   잔액 = 수입 − 지출이라 세 표가 모두 필요하므로 "개수"는 못 줄이지만,
    //   기다리는 시간을 3배 → 1배로 줄일 수 있다. (특히 DB가 멀수록 효과 큼)
    const [expenses, recurring, incomes] = await Promise.all([
      // ① 그 달에 쓴 일회성 지출 (해당 월 1일 ~ 다음 달 1일 직전)
      //    spent_on은 to_char로 "YYYY-MM-DD" 글자로 내려준다.
      //    (DATE를 그냥 보내면 시간대 때문에 타임스탬프로 변환돼 날짜가 하루 어긋날 수 있음)
      pool.query(
        `SELECT id, amount, category, memo,
                to_char(spent_on, 'YYYY-MM-DD') AS spent_on
           FROM expenses
          WHERE spent_on >= $1::date
            AND spent_on < ($1::date + INTERVAL '1 month')
          ORDER BY spent_on DESC, id DESC`,
        [monthStart]
      ),
      // ② 그 달에 "살아있는" 정기 지출
      //    시작월 <= 이번 달  AND  (종료 없음 OR 종료월 >= 이번 달)
      pool.query(
        `SELECT id, amount, category, memo, day_of_month,
                to_char(end_month, 'YYYY-MM') AS end_month
           FROM recurring_expenses
          WHERE start_month <= $1::date
            AND (end_month IS NULL OR end_month >= $1::date)
          ORDER BY day_of_month ASC, id ASC`,
        [monthStart]
      ),
      // ③ 그 달에 받은 수입 (일회성 지출과 같은 방식으로 그 달 범위만)
      pool.query(
        `SELECT id, amount, category, memo,
                to_char(received_on, 'YYYY-MM-DD') AS received_on
           FROM incomes
          WHERE received_on >= $1::date
            AND received_on < ($1::date + INTERVAL '1 month')
          ORDER BY received_on DESC, id DESC`,
        [monthStart]
      ),
    ]);

    const oneTimeTotal = expenses.rows.reduce((s, r) => s + r.amount, 0);
    const recurringTotal = recurring.rows.reduce((s, r) => s + r.amount, 0);
    const total = oneTimeTotal + recurringTotal;       // 그 달 총 지출
    const incomeTotal = incomes.rows.reduce((s, r) => s + r.amount, 0); // 그 달 총 수입

    res.json({
      month,
      total,                       // 총 지출
      oneTimeTotal,
      recurringTotal,
      incomeTotal,                 // 총 수입
      balance: incomeTotal - total, // 잔액 = 수입 − 지출 (음수면 적자)
      expenses: expenses.rows,
      recurring: recurring.rows,
      incomes: incomes.rows,
    });
  } catch (e) {
    next(e);
  }
});

// [생성] 일회성 지출 추가
app.post("/api/expenses", async (req, res, next) => {
  try {
    const { amount, category, memo = "", spent_on } = req.body ?? {};
    if (!isValidAmount(amount)) return res.status(400).json({ error: "invalid amount" });
    if (!isValidCategory(category)) return res.status(400).json({ error: "invalid category" });
    // spent_on이 없으면 DB가 오늘 날짜를 기본값으로 넣는다(COALESCE 대신 NULL→DEFAULT).
    const { rows } = await pool.query(
      `INSERT INTO expenses (amount, category, memo, spent_on)
       VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE))
       RETURNING *`,
      [amount, category, memo, spent_on || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// [수정] 일회성 지출 수정 (금액·분류·메모·날짜 변경)
app.put("/api/expenses/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { amount, category, memo = "", spent_on } = req.body ?? {};
    if (!isValidAmount(amount)) return res.status(400).json({ error: "invalid amount" });
    if (!isValidCategory(category)) return res.status(400).json({ error: "invalid category" });
    // spent_on이 없으면 기존 날짜 유지(COALESCE). 날짜는 to_char로 문자열 반환.
    const { rows, rowCount } = await pool.query(
      `UPDATE expenses
          SET amount = $1, category = $2, memo = $3,
              spent_on = COALESCE($4::date, spent_on)
        WHERE id = $5
      RETURNING id, amount, category, memo, to_char(spent_on, 'YYYY-MM-DD') AS spent_on`,
      [amount, category, memo, spent_on || null, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// [삭제] 일회성 지출 삭제
app.delete("/api/expenses/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await pool.query("DELETE FROM expenses WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────
// 수입(income) — 지출과 대칭. 그 달 잔액(수입−지출)을 만드는 데 쓰인다.
// ──────────────────────────────────────────────

// [생성] 수입 추가
app.post("/api/incomes", async (req, res, next) => {
  try {
    const { amount, category, memo = "", received_on } = req.body ?? {};
    if (!isValidAmount(amount)) return res.status(400).json({ error: "invalid amount" });
    if (!isValidIncomeCategory(category)) return res.status(400).json({ error: "invalid category" });
    const { rows } = await pool.query(
      `INSERT INTO incomes (amount, category, memo, received_on)
       VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE))
       RETURNING id, amount, category, memo, to_char(received_on, 'YYYY-MM-DD') AS received_on`,
      [amount, category, memo, received_on || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// [수정] 수입 수정 (금액·분류·메모·날짜)
app.put("/api/incomes/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { amount, category, memo = "", received_on } = req.body ?? {};
    if (!isValidAmount(amount)) return res.status(400).json({ error: "invalid amount" });
    if (!isValidIncomeCategory(category)) return res.status(400).json({ error: "invalid category" });
    const { rows, rowCount } = await pool.query(
      `UPDATE incomes
          SET amount = $1, category = $2, memo = $3,
              received_on = COALESCE($4::date, received_on)
        WHERE id = $5
      RETURNING id, amount, category, memo, to_char(received_on, 'YYYY-MM-DD') AS received_on`,
      [amount, category, memo, received_on || null, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// [삭제] 수입 삭제
app.delete("/api/incomes/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await pool.query("DELETE FROM incomes WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// [생성] 정기 지출(구독) 등록 — 지금 보고 있는 달부터 매달 합산된다.
app.post("/api/recurring", async (req, res, next) => {
  try {
    const { amount, category, memo = "", day_of_month = 1, start_month } = req.body ?? {};
    if (!isValidAmount(amount)) return res.status(400).json({ error: "invalid amount" });
    if (!isValidCategory(category)) return res.status(400).json({ error: "invalid category" });
    if (!isValidDay(day_of_month)) return res.status(400).json({ error: "invalid day" });
    // start_month("YYYY-MM")가 없으면 이번 달부터 시작
    const month = monthOrNow(start_month);
    const { rows } = await pool.query(
      `INSERT INTO recurring_expenses (amount, category, memo, day_of_month, start_month)
       VALUES ($1, $2, $3, $4, $5::date)
       RETURNING *`,
      [amount, category, memo, day_of_month, `${month}-01`]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// [해지] 정기 지출을 "보고 있는 달까지만" 유지하고 다음 달부터 중단.
//  - 행을 지우지 않고 end_month만 채운다 → 과거(+이번 달) 기록은 그대로 보존.
//  - 요약 쿼리의 (end_month >= 그달) 조건 때문에, end_month 다음 달부터 자동으로 빠진다.
//  - end_month를 null로 보내면 "해지 취소"(다시 무기한).
app.put("/api/recurring/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { end_month } = req.body ?? {};
    let endDate = null; // null이면 무기한(해지 취소)
    if (end_month !== null && end_month !== undefined) {
      if (!isValidMonth(end_month)) return res.status(400).json({ error: "invalid end_month" });
      endDate = `${end_month}-01`; // "2026-06" → 그 달 1일(DATE)
    }
    const { rows, rowCount } = await pool.query(
      `UPDATE recurring_expenses
          SET end_month = $1::date
        WHERE id = $2
      RETURNING id, amount, category, memo, day_of_month,
                to_char(start_month, 'YYYY-MM') AS start_month,
                to_char(end_month, 'YYYY-MM') AS end_month`,
      [endDate, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// [삭제] 정기 지출 완전 삭제 (모든 달에서 사라짐 — 잘못 등록한 경우용)
app.delete("/api/recurring/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await pool.query("DELETE FROM recurring_expenses WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────
// 정적 프론트엔드 서빙 — 로컬/도커에서 Express가 화면도 줄 때 사용.
// (Vercel에서는 화면을 Vercel CDN이 직접 주므로 여기까지 오지 않음)
// ──────────────────────────────────────────────
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// 공통 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

export { ensureSchema };
export default app;
