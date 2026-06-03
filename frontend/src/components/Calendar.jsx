// ┌─────────────────────────────────────────────────────────┐
// │ Calendar.jsx — 그 달을 달력 격자로 그리고, 칸마다 일별 지출  │
// │ 총액을 표시한다.                                           │
// │                                                           │
// │ 핵심: 서버는 "일별 합계"를 따로 주지 않는다. 이미 받은       │
// │  expenses(날짜별) + recurring(결제일별)을 프론트에서        │
// │  useMemo로 한 번 집계해 day → 합계 맵으로 만든다 (파생 상태). │
// │  → 같은 데이터를 두 가지 화면(목록/달력)으로 재활용한다.     │
// └─────────────────────────────────────────────────────────┘
import { useMemo } from "react";
import { wonCal, daysInMonth, firstWeekday, todayOfMonth } from "../format.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// props:
//   month      : "2026-06"
//   expenses   : 일회성 지출 배열 (각 항목에 spent_on "YYYY-MM-DD", amount)
//   recurring  : 정기 지출 배열 (각 항목에 day_of_month, amount)
//   selectedDay: 지금 선택된 날짜(1~31). 칸을 강조 표시한다.
//   onPickDay  : 특정 날짜 칸을 눌렀을 때 실행 (그 날짜를 선택)
export default function Calendar({ month, expenses, recurring, selectedDay, onPickDay }) {
  const total = daysInMonth(month); // 그 달 날짜 수 (28~31)
  const lead = firstWeekday(month); // 1일 앞에 비워둘 칸 수 (요일 맞추기)
  const today = todayOfMonth(month); // 이번 달이면 오늘 날짜, 아니면 null

  // [파생 상태] day(1~31) → 그날 지출 합계.
  // expenses/recurring/month가 바뀔 때만 다시 계산(useMemo)해서 매 렌더 낭비를 막는다.
  const dailyTotal = useMemo(() => {
    const sums = {}; // { 1: 12000, 5: 17000, ... }
    const add = (day, amount) => {
      if (day < 1 || day > total) return;
      sums[day] = (sums[day] || 0) + amount;
    };
    // 일회성: 날짜 문자열 "YYYY-MM-DD"의 끝 2자리 = 일
    for (const e of expenses) {
      add(Number(e.spent_on.slice(8, 10)), e.amount);
    }
    // 정기: 결제일(day_of_month). 31일인데 그 달이 30일까지면 마지막 날로 당김
    for (const r of recurring) {
      add(Math.min(r.day_of_month, total), r.amount);
    }
    return sums;
  }, [expenses, recurring, total]);

  // 격자에 깔 칸 목록: 앞 빈칸(lead개) + 1..total일
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null); // 빈 칸
  for (let d = 1; d <= total; d++) cells.push(d);

  return (
    <section className="calendar">
      {/* 요일 머리글 */}
      <div className="cal-grid cal-head">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`cal-weekday${i === 0 ? " sun" : ""}${i === 6 ? " sat" : ""}`}>
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 칸들 */}
      <div className="cal-grid">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`b${idx}`} className="cal-cell empty" />;
          const sum = dailyTotal[day];
          const isToday = day === today;
          const isSelected = day === selectedDay;
          return (
            <button
              type="button"
              key={day}
              className={`cal-cell${isToday ? " today" : ""}${isSelected ? " selected" : ""}${sum ? " has-spent" : ""}`}
              onClick={onPickDay ? () => onPickDay(day) : undefined}
              aria-pressed={isSelected}
            >
              <span className="cal-day">{day}</span>
              {sum ? <span className="cal-amount">{wonCal(sum)}</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
