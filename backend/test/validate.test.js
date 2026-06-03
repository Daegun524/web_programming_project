// ┌─────────────────────────────────────────────────────────┐
// │ validate.test.js — 자동 테스트                            │
// │ "npm test"로 실행. 코드가 의도대로 동작하는지 자동 확인.    │
// └─────────────────────────────────────────────────────────┘
import { test } from "node:test"; // Node에 내장된 테스트 도구
import assert from "node:assert/strict"; // 값이 맞는지 확인(assert)
import {
  CATEGORIES,
  INCOME_CATEGORIES,
  isValidAmount,
  isValidCategory,
  isValidIncomeCategory,
  isValidDay,
  isValidMonth,
} from "../validate.js";

test("isValidAmount: 0보다 큰 정수만 true", () => {
  assert.equal(isValidAmount(1000), true);
  assert.equal(isValidAmount(0), false);
  assert.equal(isValidAmount(-500), false);
  assert.equal(isValidAmount(1000.5), false);
  assert.equal(isValidAmount("1000"), false);
});

test("isValidCategory: 허용 분류만 true", () => {
  for (const c of CATEGORIES) assert.equal(isValidCategory(c), true);
  assert.equal(isValidCategory("월급"), false);
  assert.equal(isValidCategory(""), false);
});

test("isValidIncomeCategory: 수입 분류만 true (지출 분류와 분리)", () => {
  for (const c of INCOME_CATEGORIES) assert.equal(isValidIncomeCategory(c), true);
  assert.equal(isValidIncomeCategory("식비"), false); // 지출 분류는 수입에 못 씀
  assert.equal(isValidIncomeCategory(""), false);
});

test("isValidDay: 1~31 정수만 true", () => {
  assert.equal(isValidDay(1), true);
  assert.equal(isValidDay(31), true);
  assert.equal(isValidDay(0), false);
  assert.equal(isValidDay(32), false);
});

test("isValidMonth: YYYY-MM 형식만 true", () => {
  assert.equal(isValidMonth("2026-06"), true);
  assert.equal(isValidMonth("2026-13"), false);
  assert.equal(isValidMonth("2026-6"), false);
  assert.equal(isValidMonth("202606"), false);
});
