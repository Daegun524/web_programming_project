// ┌─────────────────────────────────────────────────────────┐
// │ validate.js — 입력 검증 헬퍼                              │
// └─────────────────────────────────────────────────────────┘
//
// "순수 함수"(같은 입력이면 항상 같은 출력, 외부에 영향 X)로 떼어두면
// 자동 테스트(test/validate.test.js)로 쉽게 검사할 수 있다.

// 지출 분류 목록 (화면 드롭다운과 동일하게 한 곳에서 관리)
export const CATEGORIES = [
  "식비", "교통", "주거", "통신", "쇼핑", "여가", "구독", "기타",
];

// 수입 분류 목록 (지출과 별개로 관리 — 돈이 "들어오는" 쪽)
export const INCOME_CATEGORIES = [
  "월급", "용돈", "이자", "환급", "기타",
];

// 금액: 0보다 큰 정수(원 단위)인가?
export function isValidAmount(amount) {
  return Number.isInteger(amount) && amount > 0;
}

// 분류: 허용 목록에 있는가?
export function isValidCategory(category) {
  return CATEGORIES.includes(category);
}

// 수입 분류: 허용 목록에 있는가?
export function isValidIncomeCategory(category) {
  return INCOME_CATEGORIES.includes(category);
}

// 결제일: 1~31 사이 정수인가? (정기 지출의 "매월 며칠")
export function isValidDay(day) {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

// 월 문자열: "YYYY-MM" 형식인가? (예: "2026-06")
export function isValidMonth(month) {
  return typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}
