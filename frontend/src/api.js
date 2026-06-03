// ┌─────────────────────────────────────────────────────────┐
// │ api.js — 백엔드 서버와 대화하는 함수 모음                   │
// └─────────────────────────────────────────────────────────┘
//
// 주소는 "/api/..." 처럼 앞부분 없이 쓴다(상대경로).
// 그러면 지금 보고 있는 사이트(Nginx)로 요청이 가고,
// Nginx가 그 요청을 백엔드 서버로 넘겨준다. → 출처가 같아 CORS 문제 없음.
export const API = {
  // 한 달치 요약 가져오기 (총액 + 일회성 목록 + 정기 목록)
  async summary(month) {
    const res = await fetch(`/api/summary?month=${month}`);
    if (!res.ok) throw new Error("summary failed");
    return res.json();
  },

  // 일회성 지출 추가
  async addExpense(data) {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("add expense failed");
    return res.json();
  },

  // 일회성 지출 수정 (금액·분류·메모·날짜)
  async updateExpense(id, data) {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("update expense failed");
    return res.json();
  },

  // 일회성 지출 삭제
  async removeExpense(id) {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("delete expense failed");
  },

  // 수입 추가
  async addIncome(data) {
    const res = await fetch("/api/incomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("add income failed");
    return res.json();
  },

  // 수입 수정 (금액·분류·메모·날짜)
  async updateIncome(id, data) {
    const res = await fetch(`/api/incomes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("update income failed");
    return res.json();
  },

  // 수입 삭제
  async removeIncome(id) {
    const res = await fetch(`/api/incomes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("delete income failed");
  },

  // 정기 지출(구독) 등록
  async addRecurring(data) {
    const res = await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("add recurring failed");
    return res.json();
  },

  // 정기 지출 해지 — endMonth("YYYY-MM")까지만 유지, 다음 달부터 중단
  // (endMonth를 null로 주면 해지 취소)
  async cancelRecurring(id, endMonth) {
    const res = await fetch(`/api/recurring/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ end_month: endMonth }),
    });
    if (!res.ok) throw new Error("cancel recurring failed");
    return res.json();
  },

  // 정기 지출 완전 삭제 (모든 달에서 제거 — 잘못 등록한 경우)
  async removeRecurring(id) {
    const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("delete recurring failed");
  },
};
