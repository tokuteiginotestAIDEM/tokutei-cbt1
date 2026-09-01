// ======================================================
// AIDEM TOKUTEI CBT - STUDENT
// 飲食料品製造業 + 外食業
// ======================================================

const app = document.getElementById("app");
const $ = id => document.getElementById(id);

let state = {
  exam: null,
  current: 0,
  answers: [],
  marked: [],
  remaining: 0,
  timerId: null,

  email: "",
  company: "",
  studentName: "",

  industry: "",
  authorized: false,
  locked: false
};


// ======================================================
// INDUSTRIES
// ======================================================

const INDUSTRIES = {
  manufacturing: {
    id: "飲食料品製造業",
    name: "飲食料品製造業",
    english: "FOOD MANUFACTURING",
    description: "飲食料品製造分野の模擬試験",
    icon: "🏭"
  },

  restaurant: {
    id: "外食業",
    name: "外食業",
    english: "FOOD SERVICE",
    description: "外食分野の模擬試験",
    icon: "🍽️"
  }
};


// ======================================================
// MASCOTS
// ======================================================

const MASCOTS = [
  "assets/mascots/mascot-A.png",
  "assets/mascots/mascot-A.1.png",
  "assets/mascots/mascot-A.2.png",

  "assets/mascots/mascot-B.png",
  "assets/mascots/mascot-B.2.png",

  "assets/mascots/mascot-C.png",
  "assets/mascots/mascot-C.1.png",

  "assets/mascots/mascot-D.png",
  "assets/mascots/mascot-D.1.png",
  "assets/mascots/mascot-D.2.png",

  "assets/mascots/mascot-E.png",
  "assets/mascots/mascot-E.1.png",
  "assets/mascots/mascot-E.2.png"
];


function mascotForExam(examId) {
  const text = String(examId || "");

  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash =
      ((hash << 5) - hash) +
      text.charCodeAt(i);

    hash |= 0;
  }

  return MASCOTS[
    Math.abs(hash) % MASCOTS.length
  ];
}


// ======================================================
// BRAND
// ======================================================

function brandBar(title = "", timer = false) {
  return `
    <div class="brandbar">

      <div class="brand-logos">

        <img
          src="assets/logos/aidem-logo.png"
          class="brand-logo aidem"
          alt="AIDEM"
        >

        <span class="brand-sep">›</span>

        <img
          src="assets/logos/aidem-global-logo.png"
          class="brand-logo global"
          alt="アイデムグローバル"
        >

        <span class="brand-sep">›</span>

        <img
          src="assets/logos/aitoku-logo.png"
          class="brand-logo aitoku"
          alt="アイトク"
        >

      </div>

      <div class="brand-title">
        ${esc(title)}
      </div>

      ${
        timer
          ? '<div id="timer" class="timer">--:--</div>'
          : ""
      }

    </div>
  `;
}


// ======================================================
// COMMON
// ======================================================

function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );
}


function clearTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}


// ======================================================
// JSONP
// ======================================================

function jsonp(params) {
  return new Promise((resolve, reject) => {

    if (!CBT_CONFIG.apiUrl) {
      reject(
        new Error("API URLが設定されていません。")
      );
      return;
    }

    const cb =
      "cb_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2);

    const script =
      document.createElement("script");

    const timer =
      setTimeout(() => {
        cleanup();
        reject(new Error("Timeout"));
      }, 15000);

    function cleanup() {
      clearTimeout(timer);

      try {
        delete window[cb];
      } catch (e) {}

      try {
        script.remove();
      } catch (e) {}
    }

    window[cb] = data => {
      cleanup();
      resolve(data);
    };

    const qs =
      new URLSearchParams({
        ...params,
        callback: cb,
        _: Date.now()
      });

    script.src =
      CBT_CONFIG.apiUrl +
      "?" +
      qs.toString();

    script.onerror = () => {
      cleanup();
      reject(new Error("Network error"));
    };

    document.body.appendChild(script);
  });
}


// ======================================================
// LOGIN
// ======================================================

function loginPage() {
  clearTimer();

  state.locked = false;
  state.authorized = false;
  state.exam = null;
  state.industry = "";

  app.innerHTML = `

    ${brandBar("特定技能 模擬試験")}

    <main class="cbt-login-page">

      <section class="cbt-login-stage">

        <div class="cbt-login-title-area">

          <div class="cbt-industry-label">
            特定技能
          </div>

          <h1 class="cbt-main-title">
            模擬試験
          </h1>

          <div class="cbt-title-sub">
            <span></span>
            TOKUTEI CBT
            <span></span>
          </div>

        </div>

        <img
          src="assets/mascots/mascot-D.2.png"
          class="cbt-mascot cbt-mascot-left"
          alt=""
        >

        <img
          src="assets/mascots/mascot-E.2.png"
          class="cbt-mascot cbt-mascot-right"
          alt=""
        >

        <section class="cbt-login-card">

          <div class="cbt-mail-circle">
            ✉
          </div>

          <h2>
            受験者確認
          </h2>

          <p class="cbt-login-description">
            登録されているメールアドレスを入力してください。
          </p>

          <div class="cbt-email-box">

            <div class="cbt-email-icon">
              ✉
            </div>

            <div class="cbt-email-content">

              <label for="emailInput">
                メールアドレス
              </label>

              <input
                id="emailInput"
                type="email"
                autocomplete="email"
                placeholder="example@gmail.com"
              >

            </div>

          </div>

          <div
            id="emailMessage"
            class="cbt-login-message"
          ></div>

          <button
            id="emailLoginBtn"
            class="cbt-confirm-button"
            type="button"
            onclick="checkEmail()"
          >
            <span class="cbt-button-arrow">→</span>
            <span>確認する</span>
          </button>

          <div class="cbt-login-note">
            <span class="cbt-info-icon">i</span>
            <span>
              登録されているメールアドレスのみ、受験が可能です。
            </span>
          </div>

        </section>

      </section>


      <section class="cbt-login-features">

        <div class="cbt-feature">
          <div class="cbt-feature-icon">✓</div>

          <div>
            <strong>本番形式で練習</strong>
            <p>実際の試験に近い形式で学習できます</p>
          </div>
        </div>

        <div class="cbt-feature-divider"></div>

        <div class="cbt-feature">
          <div class="cbt-feature-icon">◷</div>

          <div>
            <strong>時間管理</strong>
            <p>制限時間内で集中して取り組めます</p>
          </div>
        </div>

        <div class="cbt-feature-divider"></div>

        <div class="cbt-feature">
          <div class="cbt-feature-icon">▥</div>

          <div>
            <strong>実力チェック</strong>
            <p>自分の理解度を確認できます</p>
          </div>
        </div>

      </section>


      <footer class="cbt-login-footer">
        © 2026 AIDEM Global
        <span>|</span>
        AITOKU CBT System
      </footer>

    </main>
  `;

  const input = $("emailInput");

  if (input) {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        checkEmail();
      }
    });

    input.focus();
  }
}


// ======================================================
// CHECK EMAIL
// ======================================================

window.checkEmail =
async function() {

  const input = $("emailInput");
  const button = $("emailLoginBtn");
  const message = $("emailMessage");

  const email =
    String(input?.value || "")
      .trim()
      .toLowerCase();

  if (!email) {
    if (message) {
      message.textContent =
        "メールアドレスを入力してください。";
    }
    return;
  }

  if (!email.includes("@")) {
    if (message) {
      message.textContent =
        "正しいメールアドレスを入力してください。";
    }
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "確認中...";
  }

  if (message) {
    message.textContent =
      "受験資格を確認しています...";
  }

  try {

    const data =
      await jsonp({
        action: "checkStudent",
        email: email
      });

    if (!data || data.ok !== true) {
      throw new Error(
        data?.error ||
        "確認できませんでした。"
      );
    }

    if (data.allowed !== true) {

      state.authorized = false;

      if (message) {
        message.textContent =
          data.error ||
          "このメールアドレスは受験許可されていません。";
      }

      if (button) {
        button.disabled = false;
        button.textContent = "確認する";
      }

      return;
    }

    state.email =
      data.email || email;

    state.studentName =
      data.studentName || "";

    state.company =
      data.company || "";

    state.authorized = true;

    home();

  } catch (error) {

    console.error(
      "Email check error:",
      error
    );

    if (message) {
      message.textContent =
        "メールアドレスを確認できませんでした。もう一度お試しください。";
    }

    if (button) {
      button.disabled = false;
      button.textContent = "確認する";
    }
  }
};


// ======================================================
// INDUSTRY HOME
// ======================================================

window.home =
function() {

  clearTimer();

  state.locked = false;
  state.exam = null;
  state.industry = "";

  if (!state.authorized) {
    loginPage();
    return;
  }

  app.innerHTML = `

    ${brandBar("特定技能 模擬試験")}

    <style>

      .industry-page {
        max-width:1050px;
        margin:auto;
        padding:42px 20px 60px;
      }

      .industry-heading {
        text-align:center;
        margin-bottom:28px;
      }

      .industry-heading h1 {
        margin:0 0 10px;
        font-size:31px;
      }

      .industry-heading p {
        color:#64748b;
      }

      .industry-user-box {
        max-width:760px;
        margin:0 auto 32px;
        background:white;
        border:1px solid #e2e8f0;
        border-radius:18px;
        padding:17px 22px;
        display:flex;
        gap:30px;
        box-shadow:0 8px 28px rgba(0,0,0,.05);
      }

      .industry-user-box > div {
        flex:1;
      }

      .industry-user-box small {
        color:#64748b;
      }

      .industry-grid {
        max-width:880px;
        margin:auto;
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:24px;
      }

      .industry-card {
        background:white;
        border:2px solid #e2e8f0;
        border-radius:26px;
        padding:32px 25px;
        text-align:center;
        cursor:pointer;
        transition:.2s;
        box-shadow:0 8px 25px rgba(0,0,0,.04);
      }

      .industry-card:hover {
        transform:translateY(-5px);
        border-color:#22c55e;
        box-shadow:0 18px 40px rgba(0,0,0,.10);
      }

      .industry-icon {
        width:82px;
        height:82px;
        margin:0 auto 17px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#f0fdf4;
        border-radius:24px;
        font-size:40px;
      }

      .industry-tag {
        display:inline-block;
        background:#eff6ff;
        color:#2563eb;
        padding:5px 12px;
        border-radius:999px;
        font-size:11px;
        font-weight:bold;
      }

      .industry-card h2 {
        font-size:27px;
        margin:11px 0 8px;
      }

      .industry-card p {
        color:#64748b;
        margin-bottom:22px;
      }

      .industry-green-btn {
        width:100%;
        border:0;
        padding:14px;
        border-radius:13px;
        background:linear-gradient(
          135deg,
          #22c55e,
          #16a34a
        );
        color:white;
        font-weight:bold;
        cursor:pointer;
      }

      .industry-logout {
        max-width:420px;
        margin:28px auto 0;
      }

      @media(max-width:700px) {

        .industry-page {
          padding:28px 14px 45px;
        }

        .industry-heading h1 {
          font-size:25px;
        }

        .industry-grid {
          grid-template-columns:1fr;
        }

        .industry-user-box {
          display:block;
        }

        .industry-user-box > div + div {
          margin-top:12px;
        }
      }

    </style>


    <main class="industry-page">

      <div class="industry-heading">

        <h1>
          受験する分野を選択してください
        </h1>

        <p>
          模擬試験を受験する分野を選んでください。
        </p>

      </div>


      <div class="industry-user-box">

        <div>
          <small>受験者</small><br>
          <b>${esc(state.studentName)}</b>
        </div>

        <div>
          <small>企業名</small><br>
          <b>${esc(state.company)}</b>
        </div>

      </div>


      <div class="industry-grid">

        <div
          class="industry-card"
          onclick="selectIndustry('飲食料品製造業')"
        >

          <div class="industry-icon">
            🏭
          </div>

          <div class="industry-tag">
            FOOD MANUFACTURING
          </div>

          <h2>
            飲食料品製造業
          </h2>

          <p>
            飲食料品製造分野の模擬試験
          </p>

          <button class="industry-green-btn">
            この分野を選択 →
          </button>

        </div>


        <div
          class="industry-card"
          onclick="selectIndustry('外食業')"
        >

          <div class="industry-icon">
            🍽️
          </div>

          <div class="industry-tag">
            FOOD SERVICE
          </div>

          <h2>
            外食業
          </h2>

          <p>
            外食分野の模擬試験
          </p>

          <button class="industry-green-btn">
            この分野を選択 →
          </button>

        </div>

      </div>


      <div class="industry-logout">

        <button
          class="btn secondary full"
          onclick="studentLogout()"
        >
          別のメールアドレスで確認する
        </button>

      </div>

    </main>
  `;
};


// ======================================================
// SELECT INDUSTRY
// ======================================================

window.selectIndustry =
async function(industry) {

  if (!state.authorized) {
    loginPage();
    return;
  }

  if (
    industry !== "飲食料品製造業" &&
    industry !== "外食業"
  ) {
    return;
  }

  state.industry = industry;

  await showIndustryExams();
};


// ======================================================
// EXAM INDUSTRY
// ======================================================

function getExamIndustry(exam) {

  const explicit =
    String(
      exam.industry ||
      exam.業種 ||
      exam.field ||
      ""
    ).trim();

  if (explicit === "外食業") {
    return "外食業";
  }

  if (explicit === "飲食料品製造業") {
    return "飲食料品製造業";
  }

  const text =
    String(
      (exam.title || "") +
      " " +
      (exam.subtitle || "")
    );

  if (text.includes("外食")) {
    return "外食業";
  }

  // dữ liệu cũ mặc định là ngành thực phẩm
  return "飲食料品製造業";
}


// ======================================================
// EXAM LIST
// ======================================================

window.showIndustryExams =
async function() {

  clearTimer();

  state.locked = false;
  state.exam = null;

  if (!state.authorized) {
    loginPage();
    return;
  }

  if (!state.industry) {
    home();
    return;
  }

  const selectedIndustry =
    state.industry;

  const info =
    selectedIndustry === "外食業"
      ? INDUSTRIES.restaurant
      : INDUSTRIES.manufacturing;

  app.innerHTML = `

    ${brandBar(
      selectedIndustry + " 模擬試験"
    )}

    <div class="page">

      <div class="hero">

        <div style="font-size:42px">
          ${info.icon}
        </div>

        <h1>
          ${esc(selectedIndustry)}
        </h1>

        <p>
          本日の模擬試験
        </p>

      </div>


      <div
        id="examList"
        class="exam-list"
      >

        <div class="panel">
          試験データを読み込んでいます...
        </div>

      </div>


      <button
        class="btn secondary full"
        style="margin-top:20px"
        onclick="home()"
      >
        ← 分野選択に戻る
      </button>

    </div>
  `;

  try {

    const data =
      await jsonp({
        action: "publicExams"
      });

    if (!data.ok) {
      throw new Error(
        data.error || "Load failed"
      );
    }

    const allExams =
      Array.isArray(data.exams)
        ? data.exams
        : [];

    // tối đa 2 đề/ngành
    const exams =
      allExams
        .filter(
          e =>
            getExamIndustry(e) ===
            selectedIndustry
        )
        .slice(0, 2);

    const examList =
      $("examList");

    if (!examList) return;

    examList.innerHTML =
      exams.map(e => `

        <div class="exam-card">

          <div class="exam-card-visual">

            <img
              src="${mascotForExam(e.id)}"
              alt=""
              class="exam-mascot"
            >

          </div>

          <h2>
            ${esc(e.title)}
          </h2>

          <div class="meta">

            ${esc(selectedIndustry)}

            <br>

            ${e.questionCount ?? "-"}問

            ・

            ${
              e.durationMinutes ??
              CBT_CONFIG.defaultDurationMinutes ??
              70
            }分

            ・

            合格基準
            ${e.passPercent ?? 70}%

          </div>

          <button
            class="btn primary full"
            onclick="openExam('${esc(e.id)}')"
          >
            受験する →
          </button>

        </div>

      `).join("")

      ||

      `

        <div class="panel">

          <div style="
            text-align:center;
            padding:25px;
          ">

            <div style="font-size:38px">
              📭
            </div>

            <br>

            <b>
              現在受験できる模擬試験はありません。
            </b>

          </div>

        </div>
      `;

  } catch (error) {

    console.error(error);

    $("examList").innerHTML = `

      <div class="panel">

        試験を読み込めませんでした。

        <div class="note">
          ${esc(error.message)}
        </div>

      </div>
    `;
  }
};


// ======================================================
// LOGOUT
// ======================================================

window.studentLogout =
function() {

  clearTimer();

  state.email = "";
  state.company = "";
  state.studentName = "";
  state.industry = "";

  state.authorized = false;
  state.exam = null;
  state.locked = false;

  loginPage();
};


// ======================================================
// OPEN EXAM
// ======================================================

window.openExam =
async function(id) {

  if (!state.authorized) {
    loginPage();
    return;
  }

  app.innerHTML = `

    ${brandBar("試験データ読み込み中")}

    <div class="form-card">
      試験を読み込んでいます...
    </div>
  `;

  try {

    const data =
      await jsonp({
        action: "getExam",
        id: id
      });

    if (!data.ok) {
      throw new Error(
        data.error || "Load failed"
      );
    }

    state.exam =
      data.exam;

    app.innerHTML = `

      ${brandBar(state.exam.title)}

      <div class="form-card">

        <h2>
          ${esc(state.exam.title)}
        </h2>

        <p>
          ${esc(state.industry)}
        </p>

        <div class="student-box">

          <small>企業名</small><br>
          <b>${esc(state.company)}</b>

          <br><br>

          <small>氏名</small><br>
          <b>${esc(state.studentName)}</b>

        </div>


        <div class="rules">

          問題数：
          ${state.exam.questions.length}問

          <br>

          制限時間：
          ${
            state.exam.durationMinutes ||
            CBT_CONFIG.defaultDurationMinutes ||
            70
          }分

          <br>

          合格基準：
          ${state.exam.passPercent || 70}%

          <br><br>

          「試験を開始する」を押すと
          タイマーが開始されます。

          <br>

          時間が終了すると自動的に提出されます。

        </div>


        <button
          class="btn primary full"
          onclick="startExam()"
        >
          試験を開始する
        </button>


        <button
          class="btn secondary full"
          style="margin-top:8px"
          onclick="showIndustryExams()"
        >
          戻る
        </button>

      </div>
    `;

  } catch (error) {

    console.error(error);

    alert(
      "試験を読み込めませんでした。"
    );

    showIndustryExams();
  }
};


// ======================================================
// START EXAM
// ======================================================

window.startExam =
function() {

  if (!state.authorized) {

    alert(
      "受験者確認が必要です。"
    );

    loginPage();

    return;
  }

  if (!state.exam) return;

  state.current = 0;

  state.answers =
    Array(
      state.exam.questions.length
    ).fill(null);

  state.marked =
    Array(
      state.exam.questions.length
    ).fill(false);

  state.remaining =
    (
      state.exam.durationMinutes ||
      CBT_CONFIG.defaultDurationMinutes ||
      70
    ) * 60;

  state.locked = false;

  renderExam();

  state.timerId =
    setInterval(
      tick,
      1000
    );

  updateTimer();
};


// ======================================================
// RENDER EXAM
// 3 OR 4 ANSWERS
// ======================================================

function renderExam() {

  if (state.locked) return;

  const q =
    state.exam.questions[
      state.current
    ];

  /*
   * Tự động:
   * 3 lựa chọn → A/B/C
   * 4 lựa chọn → A/B/C/D
   */
  const choices =
    Array.isArray(q.choices)
      ? q.choices.filter(
          c =>
            String(c ?? "").trim() !== ""
        )
      : [];

  app.innerHTML = `

    ${brandBar(
      state.exam.title,
      true
    )}

    <div class="exam-layout">


      <aside class="sidebar">

        <div class="student-box">

          <small>分野</small><br>
          <b>${esc(state.industry)}</b>

          <br><br>

          <small>企業名</small><br>
          <b>${esc(state.company)}</b>

          <br><br>

          <small>受験者</small><br>
          <b>${esc(state.studentName)}</b>

        </div>


        <b>
          問題一覧
        </b>

        <div
          id="questionGrid"
          class="question-grid"
        ></div>


        <div class="legend">
          青：現在　
          緑：回答済み　
          黄線：見直し
        </div>


        <div class="sidebar-mascot">

          <img
            src="${mascotForExam(state.exam.id)}"
            alt=""
          >

        </div>


        <button
          class="submit"
          onclick="confirmSubmit()"
        >
          試験を終了する
        </button>

      </aside>


      <section class="exam-main">


        <div class="q-head">

          <div>

            <span class="badge">
              ${esc(q.category || "")}
            </span>

            　

            <b>
              問題
              ${state.current + 1}
              /
              ${state.exam.questions.length}
            </b>

          </div>


          <button
            class="mark ${
              state.marked[state.current]
                ? "active"
                : ""
            }"
            onclick="toggleMark()"
          >

            ${
              state.marked[state.current]
                ? "★"
                : "☆"
            }

            見直し

          </button>

        </div>


        <div class="q-card">

          <div class="question">
            ${esc(q.question)}
          </div>

          ${
            choices.map(
              (choice, i) => `

                <div
                  class="choice ${
                    state.answers[
                      state.current
                    ] === i
                      ? "selected"
                      : ""
                  }"
                  onclick="choose(${i})"
                >

                  <span class="letter">
                    ${
                      String.fromCharCode(
                        65 + i
                      )
                    }
                  </span>

                  <span>
                    ${esc(choice)}
                  </span>

                </div>
              `
            ).join("")
          }

        </div>


        <div class="nav">

          <button
            class="secondary"
            onclick="prevQ()"
            ${
              state.current === 0
                ? "disabled"
                : ""
            }
          >
            ← 前の問題
          </button>


          <button
            class="primary"
            onclick="nextQ()"
          >

            ${
              state.current ===
              state.exam.questions.length - 1

                ? "確認する"

                : "次の問題 →"
            }

          </button>

        </div>

      </section>

    </div>
  `;

  renderGrid();
  updateTimer();
}


// ======================================================
// QUESTION GRID
// ======================================================

function renderGrid() {

  const grid =
    $("questionGrid");

  if (!grid) return;

  grid.innerHTML =
    state.exam.questions.map(
      (_, i) => `

        <button
          class="
            q-btn

            ${
              i === state.current
                ? "current"
                : ""
            }

            ${
              state.answers[i] !== null
                ? "answered"
                : ""
            }

            ${
              state.marked[i]
                ? "marked"
                : ""
            }
          "
          onclick="jumpQ(${i})"
        >
          ${i + 1}
        </button>

      `
    ).join("");
}


// ======================================================
// ANSWERS
// ======================================================

window.choose =
function(i) {

  if (state.locked) return;

  state.answers[
    state.current
  ] = i;

  renderExam();
};


window.toggleMark =
function() {

  if (state.locked) return;

  state.marked[
    state.current
  ] =
    !state.marked[
      state.current
    ];

  renderExam();
};


window.prevQ =
function() {

  if (
    !state.locked &&
    state.current > 0
  ) {

    state.current--;

    renderExam();
  }
};


window.nextQ =
function() {

  if (state.locked) return;

  if (
    state.current <
    state.exam.questions.length - 1
  ) {

    state.current++;

    renderExam();

  } else {

    confirmSubmit();
  }
};


window.jumpQ =
function(i) {

  if (!state.locked) {

    state.current = i;

    renderExam();
  }
};


// ======================================================
// SUBMIT CONFIRM
// ======================================================

window.confirmSubmit =
function() {

  if (state.locked) return;

  const unanswered =
    state.answers.filter(
      x => x === null
    ).length;

  const message =
    unanswered
      ? `未回答が ${unanswered} 問あります。提出しますか？`
      : "試験を提出しますか？";

  if (confirm(message)) {
    submitExam(false);
  }
};


// ======================================================
// TIMER
// ======================================================

function tick() {

  if (state.locked) return;

  state.remaining--;

  if (state.remaining <= 0) {

    state.remaining = 0;

    updateTimer();

    state.locked = true;

    clearTimer();

    alert(
      "試験時間が終了しました。自動的に提出します。"
    );

    submitExam(true);

    return;
  }

  updateTimer();
}


function updateTimer() {

  const el =
    $("timer");

  if (!el) return;

  const time =
    Math.max(
      0,
      state.remaining
    );

  const minutes =
    Math.floor(time / 60)
      .toString()
      .padStart(2, "0");

  const seconds =
    (time % 60)
      .toString()
      .padStart(2, "0");

  el.textContent =
    `${minutes}:${seconds}`;
}


// ======================================================
// SUBMIT
// ======================================================

async function submitExam(auto) {

  if (!state.locked) {

    state.locked = true;

    clearTimer();
  }

  app.innerHTML = `

    ${brandBar("採点中")}

    <div class="form-card">
      採点中です...
    </div>
  `;


  const payload = {

    action: "submit",

    examId:
      state.exam.id,

    email:
      state.email,

    answers:
      state.answers,

    autoSubmitted:
      auto
  };


  try {

    const data =
      await postOpaqueThenJsonp(
        payload
      );

    if (!data.ok) {
      throw new Error(
        data.error ||
        "Submit failed"
      );
    }

    renderResult(
      data.result,
      auto
    );

  } catch (error) {

    console.error(
      "Submit error:",
      error
    );

    app.innerHTML = `

      ${brandBar("送信エラー")}

      <div class="form-card">

        <h2>
          送信エラー
        </h2>

        <p>
          結果を送信できませんでした。
          ネットワークを確認して、
          もう一度送信してください。
        </p>

        <button
          class="btn primary full"
          onclick="retrySubmit(${
            auto ? "true" : "false"
          })"
        >
          再送信
        </button>

      </div>
    `;
  }
}


window.retrySubmit =
submitExam;


// ======================================================
// POST + POLLING
// ======================================================

async function postOpaqueThenJsonp(
  payload
) {

  const submissionId =
    "s_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2);

  payload.submissionId =
    submissionId;

  await fetch(
    CBT_CONFIG.apiUrl,
    {
      method: "POST",

      mode: "no-cors",

      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },

      body:
        JSON.stringify(payload)
    }
  );


  for (
    let i = 0;
    i < 15;
    i++
  ) {

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          600
        )
    );

    const data =
      await jsonp({

        action:
          "submissionResult",

        submissionId:
          submissionId
      });

    if (
      data &&
      data.ready
    ) {
      return data;
    }
  }

  throw new Error(
    "Result timeout"
  );
}


// ======================================================
// RESULT
// PASS = CONFETTI
// ======================================================

function renderResult(
  result,
  auto
) {

  const passed =
    result.passed === true ||
    Number(result.percent) >= 70;


  // ==================================================
  // PASSED
  // ==================================================

  if (passed) {

    app.innerHTML = `

      ${brandBar(state.exam.title)}

      <style>

        .celebration-page {
          position:relative;
          overflow:hidden;
          min-height:calc(100vh - 80px);
          display:flex;
          align-items:center;
          justify-content:center;
          padding:40px 20px 70px;
          background:
            radial-gradient(
              circle at top,
              #dcfce7 0%,
              #f0fdf4 28%,
              #ffffff 68%
            );
        }

        .celebration-card {
          position:relative;
          z-index:10;
          width:100%;
          max-width:650px;
          padding:36px 30px;
          border-radius:32px;
          background:white;
          text-align:center;
          border:1px solid #dcfce7;
          box-shadow:
            0 25px 70px
            rgba(15,23,42,.15);
        }

        .celebration-mascot img {
          width:145px;
          max-height:165px;
          object-fit:contain;
          animation:
            mascotBounce
            1.2s
            ease-in-out
            infinite;
        }

        @keyframes mascotBounce {

          0%,100% {
            transform:
              translateY(0)
              rotate(-2deg);
          }

          50% {
            transform:
              translateY(-13px)
              rotate(2deg);
          }
        }

        .celebration-industry {
          margin-top:8px;
          color:#16a34a;
          font-weight:bold;
        }

        .celebration-title {
          margin:10px 0 15px;
          color:#166534;
          font-size:34px;
          line-height:1.35;
        }

        .celebration-score {
          width:170px;
          height:170px;
          margin:20px auto;
          border-radius:50%;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          color:white;
          background:
            linear-gradient(
              135deg,
              #22c55e,
              #15803d
            );
          box-shadow:
            0 15px 40px
            rgba(34,197,94,.35);
        }

        .celebration-score strong {
          font-size:48px;
          line-height:1;
        }

        .celebration-score span {
          font-size:12px;
          margin-top:8px;
          opacity:.9;
        }

        .celebration-pass {
          display:inline-block;
          padding:9px 25px;
          border-radius:999px;
          background:#dcfce7;
          color:#15803d;
          font-size:21px;
          font-weight:800;
        }

        .celebration-message {
          margin:20px 0;
          color:#475569;
          line-height:1.8;
        }

        .celebration-summary {
          display:grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(140px,1fr)
            );
          gap:11px;
          margin-top:22px;
        }

        .celebration-summary-card {
          background:#f8fafc;
          border:1px solid #e2e8f0;
          border-radius:15px;
          padding:13px;
        }

        .celebration-summary-card b {
          display:block;
          margin-top:5px;
        }

        .confetti {
          position:absolute;
          top:-30px;
          z-index:3;
          opacity:.9;
          animation:
            confettiFall
            linear
            infinite;
        }

        @keyframes confettiFall {

          0% {
            transform:
              translateY(-10vh)
              rotate(0deg);
          }

          100% {
            transform:
              translateY(120vh)
              rotate(720deg);
          }
        }

        .celebration-flower {
          position:absolute;
          z-index:4;
          font-size:30px;
          animation:
            flowerFloat
            2s
            ease-in-out
            infinite;
        }

        @keyframes flowerFloat {

          0%,100% {
            transform:
              translateY(0)
              rotate(-8deg);
          }

          50% {
            transform:
              translateY(-15px)
              rotate(8deg);
          }
        }

        @media(max-width:600px) {

          .celebration-card {
            padding:27px 17px;
          }

          .celebration-title {
            font-size:27px;
          }

          .celebration-score {
            width:145px;
            height:145px;
          }

          .celebration-score strong {
            font-size:41px;
          }
        }

      </style>


      <main class="celebration-page">

        <div id="confettiArea"></div>


        <div
          class="celebration-flower"
          style="left:5%;top:15%;"
        >
          🌸
        </div>

        <div
          class="celebration-flower"
          style="
            right:6%;
            top:20%;
            animation-delay:.4s;
          "
        >
          🌼
        </div>

        <div
          class="celebration-flower"
          style="
            left:8%;
            bottom:15%;
            animation-delay:.8s;
          "
        >
          ✨
        </div>

        <div
          class="celebration-flower"
          style="
            right:8%;
            bottom:17%;
            animation-delay:1.1s;
          "
        >
          🎉
        </div>


        <section class="celebration-card">

          <div class="celebration-mascot">

            <img
              src="${mascotForExam(state.exam.id)}"
              alt=""
            >

          </div>


          <div class="celebration-industry">
            ${esc(state.industry)}
          </div>


          <h1 class="celebration-title">
            🎊 合格おめでとうございます！ 🎊
          </h1>


          <div class="celebration-score">

            <strong>
              ${result.percent}%
            </strong>

            <span>
              SCORE
            </span>

          </div>


          <div class="celebration-pass">

            合格

            ${
              auto
                ? "（時間切れ）"
                : ""
            }

          </div>


          <div class="celebration-message">

            よく頑張りました！<br>

            この調子で本番の試験も
            頑張りましょう！

          </div>


          <div class="celebration-summary">

            <div class="celebration-summary-card">

              正解数

              <b>
                ${result.correct}
                /
                ${result.total}
              </b>

            </div>


            ${
              (result.categories || [])
                .map(
                  c => `

                    <div class="celebration-summary-card">

                      ${esc(c.category)}

                      <b>
                        ${c.correct}
                        /
                        ${c.total}
                        =
                        ${c.percent}%
                      </b>

                    </div>
                  `
                )
                .join("")
            }

          </div>


          <button
            class="btn primary full"
            style="margin-top:20px"
            onclick="showIndustryExams()"
          >
            同じ分野の試験一覧に戻る
          </button>


          <button
            class="btn secondary full"
            style="margin-top:8px"
            onclick="home()"
          >
            別の分野を選択する
          </button>


          <button
            class="btn secondary full"
            style="margin-top:8px"
            onclick="studentLogout()"
          >
            終了・ログアウト
          </button>

        </section>

      </main>
    `;


    createConfetti();

    return;
  }


  // ==================================================
  // FAILED
  // ==================================================

  app.innerHTML = `

    ${brandBar(state.exam.title)}

    <div class="result-wrap">

      <div class="result-mascot">

        <img
          src="${mascotForExam(state.exam.id)}"
          alt=""
        >

      </div>


      <div
        style="
          text-align:center;
          color:#64748b;
          margin-bottom:8px;
        "
      >
        ${esc(state.industry)}
      </div>


      <h2 style="text-align:center">
        試験結果
      </h2>


      <div class="score">
        ${result.percent}%
      </div>


      <div class="fail">

        不合格

        ${
          auto
            ? "（時間切れ）"
            : ""
        }

      </div>


      <div class="summary-grid">

        <div class="summary-card">

          正解数

          <b>
            ${result.correct}/${result.total}
          </b>

        </div>


        ${
          (result.categories || [])
            .map(
              c => `

                <div class="summary-card">

                  ${esc(c.category)}

                  <b>
                    ${c.correct}/${c.total}
                    =
                    ${c.percent}%
                  </b>

                </div>
              `
            )
            .join("")
        }

      </div>


      <div class="note">

        合格基準は70％です。<br>

        間違えた分野を復習して、
        もう一度チャレンジしましょう。

      </div>


      <button
        class="btn primary full"
        style="margin-top:18px"
        onclick="showIndustryExams()"
      >
        同じ分野の試験一覧に戻る
      </button>


      <button
        class="btn secondary full"
        style="margin-top:8px"
        onclick="home()"
      >
        別の分野を選択する
      </button>


      <button
        class="btn secondary full"
        style="margin-top:8px"
        onclick="studentLogout()"
      >
        終了・ログアウト
      </button>

    </div>
  `;
}


// ======================================================
// CONFETTI
// ======================================================

function createConfetti() {

  const area =
    document.getElementById(
      "confettiArea"
    );

  if (!area) return;


  const colors = [
    "#ef4444",
    "#f59e0b",
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#ec4899"
  ];


  for (
    let i = 0;
    i < 80;
    i++
  ) {

    const piece =
      document.createElement(
        "div"
      );

    piece.className =
      "confetti";

    piece.style.left =
      Math.random() * 100 + "%";

    piece.style.background =
      colors[
        Math.floor(
          Math.random() *
          colors.length
        )
      ];

    piece.style.width =
      (
        6 +
        Math.random() * 8
      ) + "px";

    piece.style.height =
      (
        10 +
        Math.random() * 12
      ) + "px";

    piece.style.animationDuration =
      (
        3 +
        Math.random() * 4
      ) + "s";

    piece.style.animationDelay =
      (
        Math.random() * 2
      ) + "s";

    area.appendChild(piece);
  }
}


// ======================================================
// CALCULATOR
// ======================================================

let calcExpr = "";


const calcFab =
  document.getElementById(
    "calcFab"
  );


const calculator =
  document.getElementById(
    "calculator"
  );


const calcClose =
  document.getElementById(
    "calcClose"
  );


const calcDisplay =
  document.getElementById(
    "calcDisplay"
  );


if (
  calcFab &&
  calculator
) {

  calcFab.onclick =
    () => {

      calculator.classList.toggle(
        "hidden"
      );
    };
}


if (
  calcClose &&
  calculator
) {

  calcClose.onclick =
    () => {

      calculator.classList.add(
        "hidden"
      );
    };
}


document
  .querySelectorAll(
    "[data-calc]"
  )
  .forEach(
    button => {

      button.onclick =
        () => {

          const value =
            button.dataset.calc;


          if (value === "C") {

            calcExpr = "";

          }


          else if (
            value === "DEL"
          ) {

            calcExpr =
              calcExpr.slice(
                0,
                -1
              );

          }


          else if (
            value === "="
          ) {

            try {

              if (
                !/^[0-9+\-*/%.() ]+$/
                  .test(calcExpr)
              ) {

                throw new Error(
                  "Invalid"
                );
              }

              calcExpr =
                String(
                  Function(
                    '"use strict";return (' +
                    calcExpr +
                    ')'
                  )()
                );

            } catch (e) {

              calcExpr =
                "Error";
            }

          }


          else {

            if (
              calcExpr === "Error"
            ) {
              calcExpr = "";
            }

            calcExpr += value;
          }


          if (calcDisplay) {

            calcDisplay.value =
              calcExpr || "0";
          }
        };
    }
  );


// ======================================================
// START
// ======================================================

loginPage();
