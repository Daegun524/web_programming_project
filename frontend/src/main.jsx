// ┌─────────────────────────────────────────────────────────┐
// │ main.jsx — React 앱의 "시작 버튼"                          │
// │ 브라우저가 이 파일을 가장 먼저 실행한다.                     │
// └─────────────────────────────────────────────────────────┘
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx"; // 우리가 만든 메인 컴포넌트
import "./index.css"; // 디자인(CSS)도 함께 불러오기

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
