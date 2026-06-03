// ┌─────────────────────────────────────────────────────────┐
// │ MonthBar.jsx — 달 이동(◀ ▶) + 그 달 잔액/수입/지출 표시   │
// │ 큰 숫자는 "잔액(수입 − 지출)". 흑자=초록, 적자=빨강.        │
// └─────────────────────────────────────────────────────────┘
import { won, monthLabel } from "../format.js";

// props:
//   month          : "2026-06"
//   total          : 그 달 총 지출액
//   oneTimeTotal   : 일회성 지출 합계
//   recurringTotal : 정기 지출 합계
//   incomeTotal    : 그 달 총 수입
//   balance        : 잔액 = 수입 − 지출 (음수면 적자)
//   onPrev / onNext: 이전·다음 달 버튼 클릭 시 실행할 함수
export default function MonthBar({
  month, total, oneTimeTotal, recurringTotal, incomeTotal, balance, onPrev, onNext,
}) {
  // 잔액이 0 이상이면 흑자(초록), 음수면 적자(빨강) — CSS 클래스로 색을 바꾼다
  const surplus = balance >= 0;
  return (
    <section className="month-bar">
      <div className="month-nav">
        <button className="nav-btn" onClick={onPrev} aria-label="이전 달">◀</button>
        <span className="month-label">{monthLabel(month)}</span>
        <button className="nav-btn" onClick={onNext} aria-label="다음 달">▶</button>
      </div>

      {/* 화면 맨 위 큰 숫자: 이 달 잔액(수입 − 지출) */}
      <div className="balance-label">잔액</div>
      <div className={`total-amount ${surplus ? "surplus" : "deficit"}`}>
        {won(balance)}
      </div>

      {/* 수입 ↔ 지출 한눈에 (지출 세부는 한 줄 더 작게) */}
      <div className="io-row">
        <span className="io income">＋ 수입 {won(incomeTotal)}</span>
        <span className="io spend">－ 지출 {won(total)}</span>
      </div>
      <div className="total-sub">
        지출 내역 · 일회성 {won(oneTimeTotal)} · 정기 {won(recurringTotal)}
      </div>
    </section>
  );
}
