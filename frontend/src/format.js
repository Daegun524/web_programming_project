// ┌─────────────────────────────────────────────────────────┐
// │ format.js — 분류 목록 + 화면 표시용 변환 함수              │
// └─────────────────────────────────────────────────────────┘

// 지출 분류 (백엔드 validate.js의 CATEGORIES와 동일해야 함)
export const CATEGORIES = [
  "식비", "교통", "주거", "통신", "쇼핑", "여가", "구독", "기타",
];

// 수입 분류 (백엔드 validate.js의 INCOME_CATEGORIES와 동일해야 함)
export const INCOME_CATEGORIES = [
  "월급", "용돈", "이자", "환급", "기타",
];

// 숫자 → "₩1,234,567" 처럼 콤마 붙은 글자로 (toLocaleString = 천 단위 콤마)
export function won(n) {
  return "₩" + (n ?? 0).toLocaleString("ko-KR");
}

// 달력 칸용 — 원(₩) 기호 대신 앞에 '-'(지출=돈 나감)를 붙인다.
//  예: 1,010,500 → "-1,010,500"  (기호 폭을 아껴 좁은 칸에 더 잘 들어감)
export function wonCal(n) {
  return "-" + (n ?? 0).toLocaleString("ko-KR");
}

// 달력 칸용 수입 — 앞에 '+'(수입=돈 들어옴)를 붙인다.
//  예: 2,500,000 → "+2,500,000"  (지출 줄과 한눈에 구분됨)
export function wonCalIncome(n) {
  return "+" + (n ?? 0).toLocaleString("ko-KR");
}

// "2026-06" → "2026년 6월" 처럼 사람이 읽기 좋게
export function monthLabel(month) {
  const [y, m] = month.split("-");
  return `${y}년 ${Number(m)}월`;
}

// "2026-06"에서 한 달 이동 (delta: -1 이전달 / +1 다음달)
export function shiftMonth(month, delta) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1); // 자바스크립트가 연도 넘김을 자동 처리
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// 오늘이 속한 월을 "YYYY-MM"으로 (내 컴퓨터의 로컬 시간 기준)
export function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// "2026-06"의 날짜 수 (그 달이 며칠까지 있나). new Date(y, m, 0)의 day = 그 달 마지막 날
export function daysInMonth(month) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

// "2026-06"의 1일이 무슨 요일인지 (0=일 … 6=토). 달력 첫 칸 들여쓰기에 사용
export function firstWeekday(month) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).getDay();
}

// 오늘이 며칠인지 ("2026-06"이 이번 달일 때만 의미). 이번 달이 아니면 null
export function todayOfMonth(month) {
  if (month !== thisMonth()) return null;
  return new Date().getDate();
}
