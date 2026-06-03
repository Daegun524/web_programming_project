// ┌─────────────────────────────────────────────────────────┐
// │ AddExpense.jsx — 지출 추가 폼                             │
// │ "매달 반복(구독)" 체크 여부에 따라 일회성/정기로 나뉜다.    │
// └─────────────────────────────────────────────────────────┘
import { useState } from "react";
import { CATEGORIES } from "../format.js";

// props:
//   selectedDate : 지금 선택된 날짜 "YYYY-MM-DD" — 일회성 지출을 이 날짜로 저장
//   selectedDay  : 선택된 날(1~31) — 정기 지출 결제일 기본값으로도 사용
//   onAddExpense(data)  : 일회성 지출 추가 요청
//   onAddRecurring(data): 정기 지출 등록 요청
export default function AddExpense({ selectedDate, selectedDay, onAddExpense, onAddRecurring }) {
  const [amount, setAmount] = useState(""); // 금액(글자로 입력받아 숫자로 변환)
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [memo, setMemo] = useState("");
  const [recurring, setRecurring] = useState(false); // 매달 반복?

  function submit(e) {
    e.preventDefault();
    const won = Number(amount); // "10000" → 10000
    if (!Number.isInteger(won) || won <= 0) return; // 잘못된 금액이면 무시

    if (recurring) {
      // 정기 지출: 선택한 날을 결제일로, 보고 있는 달부터 매달 합산
      onAddRecurring({ amount: won, category, memo: memo.trim(), day_of_month: selectedDay });
    } else {
      // 일회성: 달력에서 선택한 날짜(selectedDate)에 저장
      onAddExpense({ amount: won, category, memo: memo.trim(), spent_on: selectedDate });
    }
    setAmount("");
    setMemo("");
  }

  return (
    <form className="add-expense" onSubmit={submit}>
      <div className="row">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="금액(원)"
          min="1"
          required
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="메모 (선택)"
      />

      <div className="row recurring-row">
        <label className="check">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
          />
          매달 반복(구독)
        </label>
        {/* 반복을 켜면 선택한 날이 결제일이 된다(조건부 렌더링) */}
        {recurring && <span className="day-pick">매월 {selectedDay}일 결제</span>}
        <button type="submit" className="btn primary">+ 추가</button>
      </div>
    </form>
  );
}
