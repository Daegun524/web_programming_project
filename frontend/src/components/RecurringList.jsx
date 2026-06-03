// ┌─────────────────────────────────────────────────────────┐
// │ RecurringList.jsx — 정기 지출(구독) 목록                  │
// │ 여기 있는 항목은 "다음 달로 넘어가도" 그 달 지출에 계속 포함. │
// │                                                           │
// │ 정리는 "해지" 한 가지뿐:                                    │
// │   보고 있는 달까지만 유지하고 다음 달부터 중단                │
// │   (end_month만 채움 → 과거·이번 달 기록은 보존)              │
// │ ※ 가계부라 과거 지출 기록을 지우면 안 되므로,                 │
// │   "모든 달에서 통째로 지우는" 완전 삭제 버튼은 두지 않는다.    │
// └─────────────────────────────────────────────────────────┘
import { won } from "../format.js";

// props:
//   items    : 이번 달에 해당하는 정기 지출 배열 (end_month: "YYYY-MM" | null 포함)
//   month    : 지금 보고 있는 달 "YYYY-MM"
//   onCancel : 해지 (이번 달까지만 유지)
export default function RecurringList({ items, month, onCancel }) {
  if (items.length === 0) {
    return <p className="hint">등록된 정기 지출이 없어요. "매달 반복(구독)"으로 추가해보세요.</p>;
  }
  return (
    <ul className="list">
      {items.map((it) => {
        // end_month가 지금 보는 달과 같으면 = 이번 달이 마지막(다음 달부터 빠짐)
        const endingThisMonth = it.end_month === month;
        return (
          <li className="list-item recurring" key={it.id}>
            <span className="cat-tag">{it.category}</span>
            <div className="item-main">
              <span className="memo">{it.memo || "(메모 없음)"}</span>
              <span className="date">
                매월 {it.day_of_month}일
                {endingThisMonth && <em className="ending"> · 이번 달까지</em>}
              </span>
            </div>
            <span className="amount">{won(it.amount)}</span>
            {/* 아직 해지 예정이 아닐 때만 "해지" 버튼 노출 */}
            {!endingThisMonth && (
              <button
                className="btn-cancel"
                onClick={() => onCancel(it.id)}
                title="이번 달까지만 유지하고 다음 달부터 해지 (과거 기록 보존)"
              >
                해지
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
