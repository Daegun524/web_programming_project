// ┌─────────────────────────────────────────────────────────┐
// │ storage.js — 브라우저에 데이터를 저장하는 3가지 방법        │
// │ (과제 필수 요건: Web Storage 3종 시연)                     │
// └─────────────────────────────────────────────────────────┘
//
//   1) localStorage   : 브라우저를 꺼도 남는 영구 서랍   → 테마(다크/라이트)
//   2) sessionStorage : 그 탭을 닫으면 비워지는 서랍      → 지금 보고 있는 달
//   3) IndexedDB      : 큰 데이터를 담는 브라우저 내장 DB → 월별 요약 캐시

// ── 1) localStorage : 테마 ──────────────────────────────
export const Theme = {
  get() {
    return localStorage.getItem("theme") || "light"; // 없으면 기본 'light'
  },
  set(value) {
    localStorage.setItem("theme", value);
  },
};

// ── 2) sessionStorage : 지금 보고 있는 달 ───────────────
// 새로고침해도 그 탭 안에서는 보던 달이 유지된다(탭 닫으면 초기화).
export const ViewMonth = {
  get() {
    return sessionStorage.getItem("view.month") || ""; // 없으면 빈 값
  },
  set(month) {
    sessionStorage.setItem("view.month", month);
  },
};

// ── 3) IndexedDB : 월별 요약 캐시 ───────────────────────
// 서버에서 받은 한 달치 요약을 보관 → 인터넷이 끊겨도 마지막 화면을 보여준다.
const DB_NAME = "budget-db";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // "summary" 표: month("2026-06")를 기본키로 그 달 요약을 통째 저장
      if (!db.objectStoreNames.contains("summary")) {
        db.createObjectStore("summary", { keyPath: "month" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const result = fn(transaction.objectStore(store));
        transaction.oncomplete = () => resolve(result?.result ?? result);
        transaction.onerror = () => reject(transaction.error);
      })
  );
}

export const SummaryCache = {
  async save(summary) {
    await tx("summary", "readwrite", (store) => store.put(summary));
  },
  get(month) {
    return tx("summary", "readonly", (store) => store.get(month));
  },
};
