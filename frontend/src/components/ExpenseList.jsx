// ┌─────────────────────────────────────────────────────────┐
// │ ExpenseList.jsx — 선택한 날의 일회성 지출 목록            │
// │ 각 항목은 "수정"을 누르면 그 자리에서 입력칸으로 바뀐다     │
// │ (인라인 편집). 저장하면 부모의 onUpdate가 PUT 요청을 보낸다. │
// └─────────────────────────────────────────────────────────┘
import { useState } from "react";
import { won, CATEGORIES } from "../format.js";

// props:
//   items    : 그 날짜의 일회성 지출 배열
//   onRemove : 삭제 버튼
//   onUpdate : 수정 저장 시 실행 (id, {amount, category, memo})
export default function ExpenseList({ items, onRemove, onUpdate }) {
  if (items.length === 0) {
    return <p className="hint">이 날짜의 지출이 없어요. 위에서 추가해보세요.</p>;
  }
  return (
    <ul className="list">
      {items.map((it) => (
        <ExpenseItem key={it.id} item={it} onRemove={onRemove} onUpdate={onUpdate} />
      ))}
    </ul>
  );
}

// 한 줄짜리 지출 항목 — 보기 모드 ↔ 편집 모드를 자체 state로 토글
function ExpenseItem({ item, onRemove, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(item.amount));
  const [category, setCategory] = useState(item.category);
  const [memo, setMemo] = useState(item.memo || "");

  function save() {
    const won = Number(amount);
    if (!Number.isInteger(won) || won <= 0) return; // 잘못된 금액이면 저장 안 함
    onUpdate(item.id, { amount: won, category, memo: memo.trim() });
    setEditing(false);
  }
  function cancel() {
    // 입력값을 원래 값으로 되돌리고 보기 모드로
    setAmount(String(item.amount));
    setCategory(item.category);
    setMemo(item.memo || "");
    setEditing(false);
  }

  // ── 편집 모드 ──────────────────────────────
  if (editing) {
    return (
      <li className="list-item editing">
        <div className="edit-fields">
          <div className="row">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
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
        </div>
        <div className="edit-actions">
          <button className="btn primary" onClick={save}>저장</button>
          <button className="btn" onClick={cancel}>취소</button>
        </div>
      </li>
    );
  }

  // ── 보기 모드 ──────────────────────────────
  return (
    <li className="list-item">
      <span className="cat-tag">{item.category}</span>
      <div className="item-main">
        <span className="memo">{item.memo || "(메모 없음)"}</span>
        <span className="date">{item.spent_on?.slice(5).replace("-", "/")}</span>
      </div>
      <span className="amount">{won(item.amount)}</span>
      <button className="btn-edit" onClick={() => setEditing(true)} title="수정">✎</button>
      <button className="btn-del" onClick={() => onRemove(item.id)} title="삭제">✕</button>
    </li>
  );
}
