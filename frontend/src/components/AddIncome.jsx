// ┌─────────────────────────────────────────────────────────┐
// │ AddIncome.jsx — 수입 추가 폼 (지출 폼의 수입 버전)         │
// │ 분류 목록만 다르고 구조는 AddExpense와 똑같다.             │
// └─────────────────────────────────────────────────────────┘
import { useState } from "react";
import { INCOME_CATEGORIES } from "../format.js";

// props:
//   selectedDate : 지금 선택된 날짜 "YYYY-MM-DD" — 수입을 이 날짜로 저장
//   onAddIncome(data) : 수입 추가 요청 (amount, category, memo, received_on)
export default function AddIncome({ selectedDate, onAddIncome }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [memo, setMemo] = useState("");

  function submit(e) {
    e.preventDefault();
    const won = Number(amount);
    if (!Number.isInteger(won) || won <= 0) return; // 잘못된 금액이면 무시
    onAddIncome({ amount: won, category, memo: memo.trim(), received_on: selectedDate });
    setAmount("");
    setMemo("");
  }

  return (
    <form className="add-expense add-income" onSubmit={submit}>
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
          {INCOME_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="btn primary">+ 수입</button>
      </div>
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="메모 (선택)"
      />
    </form>
  );
}
