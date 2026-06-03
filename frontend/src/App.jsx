// ┌─────────────────────────────────────────────────────────┐
// │ App.jsx — 앱의 두뇌                                        │
// │ "지금 보고 있는 달"을 들고 있고, 그 달 요약을 불러오고,      │
// │ 지출 추가/삭제를 처리하고, 테마를 관리한다.                  │
// └─────────────────────────────────────────────────────────┘
import { useCallback, useEffect, useState } from "react";
import { API } from "./api.js";
import { Theme, ViewMonth, SummaryCache } from "./storage.js";
import { shiftMonth, thisMonth, todayOfMonth, monthLabel } from "./format.js";
import MonthBar from "./components/MonthBar.jsx";
import Calendar from "./components/Calendar.jsx";
import AddExpense from "./components/AddExpense.jsx";
import ExpenseList from "./components/ExpenseList.jsx";
import RecurringList from "./components/RecurringList.jsx";
import AddIncome from "./components/AddIncome.jsx";
import IncomeList from "./components/IncomeList.jsx";

export default function App() {
  // 처음 볼 달: sessionStorage에 저장된 게 있으면 그걸, 없으면 이번 달
  const [month, setMonth] = useState(ViewMonth.get() || thisMonth());
  const [data, setData] = useState(null); // 서버에서 받은 한 달 요약
  const [theme, setTheme] = useState(Theme.get());
  // 달력에서 선택한 날(1~31). 이번 달이면 오늘, 아니면 1일로 시작
  const [selectedDay, setSelectedDay] = useState(todayOfMonth(month) || 1);

  // [효과] 테마가 바뀌면 → <html>에 표시하고 localStorage에 저장
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    Theme.set(theme);
  }, [theme]);

  // 한 달 요약 불러오기: 서버 성공이면 화면+캐시 저장, 실패면 캐시에서 대체
  const load = useCallback(async (m) => {
    try {
      const summary = await API.summary(m);
      setData(summary);
      await SummaryCache.save(summary); // 오프라인 대비 캐시에 저장
    } catch {
      const cached = await SummaryCache.get(m);
      setData(cached || { month: m, total: 0, oneTimeTotal: 0, recurringTotal: 0, incomeTotal: 0, balance: 0, expenses: [], recurring: [], incomes: [] });
    }
  }, []);

  // [효과] 보는 달이 바뀔 때마다: 그 달을 sessionStorage에 저장 + 요약 로드
  //  + 선택한 날을 그 달의 오늘(없으면 1일)로 재설정
  useEffect(() => {
    ViewMonth.set(month);
    load(month);
    setSelectedDay(todayOfMonth(month) || 1);
  }, [month, load]);

  // 일회성 지출 추가 → 끝나면 그 달 요약을 다시 불러와 총액·목록 갱신
  async function addExpense(payload) {
    await API.addExpense(payload);
    load(month);
  }
  // 정기 지출 등록: "지금 보고 있는 달"부터 시작하도록 start_month를 붙여 보냄
  async function addRecurring(payload) {
    await API.addRecurring({ ...payload, start_month: month });
    load(month);
  }
  // 일회성 지출 수정 → 저장 후 그 달 요약 다시 로드
  async function updateExpense(id, payload) {
    await API.updateExpense(id, payload);
    load(month);
  }
  async function removeExpense(id) {
    await API.removeExpense(id);
    load(month);
  }
  // 정기 지출 해지: 보고 있는 달까지만 유지(end_month=month), 다음 달부터 중단
  // (가계부라 과거 기록을 지우면 안 되므로 "완전 삭제"는 두지 않고 해지만 제공)
  async function cancelRecurring(id) {
    await API.cancelRecurring(id, month);
    load(month);
  }

  // ── 수입 (지출과 대칭) ───────────────────────────────
  async function addIncome(payload) {
    await API.addIncome(payload);
    load(month);
  }
  async function updateIncome(id, payload) {
    await API.updateIncome(id, payload);
    load(month);
  }
  async function removeIncome(id) {
    await API.removeIncome(id);
    load(month);
  }

  // 데이터가 아직 안 왔으면 잠깐 빈 값으로
  const d = data || { month, total: 0, oneTimeTotal: 0, recurringTotal: 0, incomeTotal: 0, balance: 0, expenses: [], recurring: [], incomes: [] };

  // 선택한 날짜 "YYYY-MM-DD" + 그 날짜의 일회성 지출만 추려서 패널에 보여준다
  const selectedDate = `${d.month}-${String(selectedDay).padStart(2, "0")}`;
  const dayExpenses = d.expenses.filter(
    (e) => Number(e.spent_on.slice(8, 10)) === selectedDay
  );

  return (
    <>
      <header className="topbar">
        <h1>💰 가계부</h1>
        <button className="btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? "☀️ 라이트" : "🌙 다크"}
        </button>
      </header>

      <main className="content">
        {/* 달 이동 + 총 지출액(큰 숫자) */}
        <MonthBar
          month={d.month}
          total={d.total}
          oneTimeTotal={d.oneTimeTotal}
          recurringTotal={d.recurringTotal}
          incomeTotal={d.incomeTotal}
          balance={d.balance}
          onPrev={() => setMonth((m) => shiftMonth(m, -1))}
          onNext={() => setMonth((m) => shiftMonth(m, +1))}
        />

        {/* 넓은 화면에서는 왼쪽 달력 + 오른쪽 패널 2단 배치 (스크롤 최소화) */}
        <div className="day-layout">
          {/* 왼쪽: 달력 — 날짜를 누르면 그 날이 선택된다 */}
          <Calendar
            month={d.month}
            expenses={d.expenses}
            recurring={d.recurring}
            incomes={d.incomes}
            selectedDay={selectedDay}
            onPickDay={setSelectedDay}
          />

          {/* 오른쪽: 선택한 날짜의 입력 폼 + 그날 지출 목록 */}
          <aside className="day-panel">
            <h2 className="section-title">
              {monthLabel(d.month)} {selectedDay}일 ({dayExpenses.length})
            </h2>
            <AddExpense
              selectedDate={selectedDate}
              selectedDay={selectedDay}
              onAddExpense={addExpense}
              onAddRecurring={addRecurring}
            />
            <ExpenseList items={dayExpenses} onRemove={removeExpense} onUpdate={updateExpense} />
          </aside>
        </div>

        {/* 정기 지출(구독) — 다음 달로 넘어가도 유지됨 */}
        <h2 className="section-title">정기 지출 · 구독 ({d.recurring.length})</h2>
        <RecurringList items={d.recurring} month={d.month} onCancel={cancelRecurring} />

        {/* 수입 — 그 달에 들어온 돈. 잔액(맨 위 큰 숫자) = 수입 − 지출 */}
        <h2 className="section-title">수입 ({d.incomes.length})</h2>
        <AddIncome selectedDate={selectedDate} onAddIncome={addIncome} />
        <IncomeList items={d.incomes} onRemove={removeIncome} onUpdate={updateIncome} />
      </main>
    </>
  );
}
