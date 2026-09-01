// ======================================================
// AIDEM TOKUTEI CBT - ADMIN
// ======================================================

const app = document.getElementById("adminApp");
const $ = id => document.getElementById(id);

let ADMIN_KEY =
  sessionStorage.getItem("cbt_admin_key") || "";

let currentTab = "results";
let resultsCache = [];
let examsCache = [];


// ======================================================
// INDUSTRIES
// ======================================================

const INDUSTRIES = [
  "飲食料品製造業",
  "外食業"
];


// ======================================================
// ESCAPE
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


// ======================================================
// BRAND
// ======================================================

function adminBrand(
  title = "特定技能 模擬試験 管理画面"
) {

  return `

    <div class="brandbar admin-brandbar">

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

    </div>

  `;
}


// ======================================================
// JSONP
// ======================================================

function jsonp(params) {

  return new Promise((resolve, reject) => {

    if (
      typeof CBT_CONFIG === "undefined" ||
      !CBT_CONFIG.apiUrl
    ) {
      reject(
        new Error(
          "API URLが設定されていません。"
        )
      );
      return;
    }

    const cb =
      "cb_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2);

    const script =
      document.createElement("script");

    const timer =
      setTimeout(() => {
        cleanup();
        reject(
          new Error("Timeout")
        );
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
      reject(
        new Error("Network")
      );
    };

    document.body.appendChild(script);

  });
}


// ======================================================
// POST ADMIN
// ======================================================

async function postAdmin(payload) {

  if (
    typeof CBT_CONFIG === "undefined" ||
    !CBT_CONFIG.apiUrl
  ) {
    throw new Error(
      "API URLが設定されていません。"
    );
  }

  payload.adminKey =
    ADMIN_KEY;

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

  await new Promise(
    resolve =>
      setTimeout(resolve, 1200)
  );
}


// ======================================================
// LOGIN
// ======================================================

function login() {

  app.innerHTML = `

    ${adminBrand("管理者ログイン")}

    <div class="page">

      <div class="form-card">

        <h2>
          管理者ログイン
        </h2>

        <div class="field">

          <label for="keyInput">
            管理パスワード
          </label>

          <input
            id="keyInput"
            type="password"
            autocomplete="current-password"
            placeholder="パスワードを入力"
          >

        </div>

        <button
          id="loginBtn"
          class="btn primary full"
          type="button"
          onclick="doLogin()"
        >
          ログイン
        </button>

        <div
          id="loginMsg"
          class="note"
          style="margin-top:12px"
        ></div>

      </div>

    </div>

  `;

  const input =
    $("keyInput");

  if (input) {

    input.addEventListener(
      "keydown",
      e => {

        if (e.key === "Enter") {
          doLogin();
        }

      }
    );

    input.focus();
  }
}


// ======================================================
// DO LOGIN
// ======================================================

window.doLogin =
async function() {

  const input =
    $("keyInput");

  const button =
    $("loginBtn");

  const message =
    $("loginMsg");

  const key =
    String(
      input?.value || ""
    ).trim();

  if (!key) {

    if (message) {
      message.textContent =
        "パスワードを入力してください。";
    }

    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent =
      "確認中...";
  }

  if (message) {
    message.textContent =
      "パスワードを確認しています...";
  }

  try {

    const data =
      await jsonp({
        action: "adminPing",
        key
      });

    if (
      !data ||
      data.ok !== true
    ) {
      throw new Error(
        data?.error ||
        "ログインできませんでした。"
      );
    }

    ADMIN_KEY = key;

    sessionStorage.setItem(
      "cbt_admin_key",
      key
    );

    await dashboard();

  } catch (error) {

    console.error(
      "Admin login error:",
      error
    );

    if (message) {
      message.textContent =
        "パスワードが正しくないか、通信に失敗しました。";
    }

    if (button) {
      button.disabled = false;
      button.textContent =
        "ログイン";
    }
  }
};


// ======================================================
// LOGOUT
// ======================================================

window.logout =
function() {

  ADMIN_KEY = "";

  sessionStorage.removeItem(
    "cbt_admin_key"
  );

  login();
};


// ======================================================
// DASHBOARD
// ======================================================

async function dashboard() {

  app.innerHTML = `

    ${adminBrand(
      "特定技能 模擬試験 管理画面"
    )}

    <div class="admin-logout">

      <button
        class="btn secondary"
        onclick="logout()"
      >
        ログアウト
      </button>

    </div>

    <div class="page">

      <div class="admin-tabs">

        <button
          id="tabResults"
          class="btn secondary"
          onclick="showTab('results')"
        >
          受験結果
        </button>

        <button
          id="tabExams"
          class="btn secondary"
          onclick="showTab('exams')"
        >
          試験管理
        </button>

        <button
          id="tabUpload"
          class="btn secondary"
          onclick="showTab('upload')"
        >
          新しい試験を追加
        </button>

      </div>

      <div
        id="content"
        class="panel"
      >
        読み込み中...
      </div>

    </div>

  `;

  await showTab(
    currentTab
  );
}


// ======================================================
// TAB
// ======================================================

window.showTab =
async function(tab) {

  currentTab = tab;

  [
    "Results",
    "Exams",
    "Upload"

  ].forEach(name => {

    const el =
      $("tab" + name);

    if (el) {
      el.classList.remove(
        "active"
      );
    }

  });

  const cap =
    tab.charAt(0).toUpperCase() +
    tab.slice(1);

  const active =
    $("tab" + cap);

  if (active) {
    active.classList.add(
      "active"
    );
  }

  if (tab === "results") {
    await loadResults();
  }

  if (tab === "exams") {
    await loadExams();
  }

  if (tab === "upload") {
    uploadForm();
  }
};


// ======================================================
// GET INDUSTRY
// ======================================================

function getIndustry(item) {

  const value =
    String(
      item?.industry ||
      item?.業種 ||
      item?.subtitle ||
      ""
    ).trim();

  if (
    value.includes("外食")
  ) {
    return "外食業";
  }

  if (
    value.includes("飲食料品") ||
    value.includes("食品製造")
  ) {
    return "飲食料品製造業";
  }

  return value || "";
}


// ======================================================
// LOAD RESULTS
// ======================================================

async function loadResults() {

  const content =
    $("content");

  if (!content) return;

  content.innerHTML =
    "結果を読み込んでいます...";

  try {

    const data =
      await jsonp({
        action: "adminResults",
        key: ADMIN_KEY
      });

    if (
      !data ||
      data.ok !== true
    ) {
      throw new Error(
        data?.error ||
        "Load failed"
      );
    }

    resultsCache =
      Array.isArray(
        data.results
      )
        ? data.results
        : [];

    renderResults();

  } catch (error) {

    console.error(
      "Load results error:",
      error
    );

    content.innerHTML = `

      <div class="weak">
        結果の読み込みに失敗しました。
      </div>

      <div class="note">
        ${esc(error.message)}
      </div>

    `;
  }
}


// ======================================================
// RENDER RESULTS
// ======================================================

function renderResults() {

  const content =
    $("content");

  if (!content) return;

  content.innerHTML = `

    <h2>
      受験結果
    </h2>

    <div class="toolbar">

      <select
        id="fIndustry"
        onchange="filterResults()"
      >
        <option value="">
          すべての業種
        </option>

        <option value="飲食料品製造業">
          飲食料品製造業
        </option>

        <option value="外食業">
          外食業
        </option>
      </select>

      <input
        id="fCompany"
        placeholder="企業名"
        oninput="filterResults()"
      >

      <input
        id="fName"
        placeholder="氏名"
        oninput="filterResults()"
      >

      <select
        id="fPass"
        onchange="filterResults()"
      >
        <option value="">
          すべての結果
        </option>

        <option value="true">
          合格
        </option>

        <option value="false">
          不合格
        </option>
      </select>

      <button
        class="btn primary"
        onclick="exportResults()"
      >
        CSV出力
      </button>

    </div>

    <div
      id="resultTable"
    ></div>

  `;

  filterResults();
}


// ======================================================
// FILTER RESULTS
// ======================================================

window.filterResults =
function() {

  const industryFilter =
    $("fIndustry")?.value || "";

  const companyFilter =
    (
      $("fCompany")?.value ||
      ""
    ).toLowerCase();

  const nameFilter =
    (
      $("fName")?.value ||
      ""
    ).toLowerCase();

  const passFilter =
    $("fPass")?.value || "";

  const rows =
    resultsCache.filter(r => {

      const industry =
        getIndustry(r);

      const company =
        String(
          r.company || ""
        ).toLowerCase();

      const name =
        String(
          r.studentName || ""
        ).toLowerCase();

      const industryMatch =
        industryFilter === "" ||
        industry === industryFilter;

      const passMatch =
        passFilter === "" ||
        String(r.passed) ===
          passFilter;

      return (
        industryMatch &&
        company.includes(
          companyFilter
        ) &&
        name.includes(
          nameFilter
        ) &&
        passMatch
      );
    });

  const table =
    $("resultTable");

  if (!table) return;

  if (!rows.length) {

    table.innerHTML = `
      <div class="note">
        該当する受験結果はありません。
      </div>
    `;

    return;
  }

  table.innerHTML = `

    <div class="table-wrap">

      <table class="data-table">

        <thead>

          <tr>

            <th>日時</th>

            <th>業種</th>

            <th>企業名</th>

            <th>氏名</th>

            <th>試験</th>

            <th>得点</th>

            <th>判定</th>

            <th>分野別</th>

            <th>重点復習</th>

          </tr>

        </thead>

        <tbody>

          ${rows.map(r => `

            <tr>

              <td>
                ${esc(r.timestamp)}
              </td>

              <td>
                ${esc(
                  getIndustry(r) ||
                  "-"
                )}
              </td>

              <td>
                ${esc(r.company)}
              </td>

              <td>
                ${esc(r.studentName)}
              </td>

              <td>
                ${esc(r.examTitle)}
              </td>

              <td>

                <b>
                  ${r.correct}/${r.total}
                  (${r.percent}%)
                </b>

              </td>

              <td
                class="${
                  r.passed
                    ? "good"
                    : "weak"
                }"
              >
                ${
                  r.passed
                    ? "合格"
                    : "不合格"
                }
              </td>

              <td class="cat-mini">

                ${
                  (
                    r.categories ||
                    []
                  )
                  .map(
                    c =>
                      `${esc(c.category)}: ${c.correct}/${c.total} (${c.percent}%)`
                  )
                  .join("<br>")
                }

              </td>

              <td class="weak">

                ${esc(
                  (
                    r.weakCategories ||
                    []
                  ).join("・") ||
                  "-"
                )}

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>

  `;
};


// ======================================================
// EXPORT RESULTS
// ======================================================

window.exportResults =
function() {

  const rows = [[

    "Timestamp",

    "Industry",

    "Company",

    "Student",

    "Exam",

    "Correct",

    "Total",

    "Percent",

    "Passed",

    "Category Scores",

    "Weak Categories"

  ]];

  resultsCache.forEach(r => {

    rows.push([

      r.timestamp,

      getIndustry(r),

      r.company,

      r.studentName,

      r.examTitle,

      r.correct,

      r.total,

      r.percent,

      r.passed,

      (
        r.categories ||
        []
      )
      .map(
        c =>
          `${c.category}:${c.correct}/${c.total}(${c.percent}%)`
      )
      .join(" | "),

      (
        r.weakCategories ||
        []
      )
      .join(" | ")

    ]);

  });

  const csv =
    rows
    .map(
      row =>
        row
        .map(value => {

          value =
            String(
              value ?? ""
            );

          return /[",\n]/.test(value)
            ? `"${value.replace(
                /"/g,
                '""'
              )}"`
            : value;

        })
        .join(",")
    )
    .join("\n");

  const blob =
    new Blob(
      [
        "\ufeff" +
        csv
      ],
      {
        type:
          "text/csv;charset=utf-8"
      }
    );

  const link =
    document.createElement("a");

  link.href =
    URL.createObjectURL(
      blob
    );

  link.download =
    "cbt_results.csv";

  link.click();

  URL.revokeObjectURL(
    link.href
  );
};


// ======================================================
// LOAD EXAMS
// ======================================================

async function loadExams() {

  const content =
    $("content");

  if (!content) return;

  content.innerHTML =
    "試験を読み込んでいます...";

  try {

    const data =
      await jsonp({
        action: "adminExams",
        key: ADMIN_KEY
      });

    if (
      !data ||
      data.ok !== true
    ) {
      throw new Error(
        data?.error ||
        "Load failed"
      );
    }

    examsCache =
      Array.isArray(
        data.exams
      )
        ? data.exams
        : [];

    renderExams();

  } catch (error) {

    console.error(
      "Load exams error:",
      error
    );

    content.innerHTML = `

      <div class="weak">
        試験の読み込みに失敗しました。
      </div>

      <div class="note">
        ${esc(error.message)}
      </div>

    `;
  }
}


// ======================================================
// RENDER EXAMS
// ======================================================

function renderExams() {

  const content =
    $("content");

  if (!content) return;

  content.innerHTML = `

    <h2>
      試験管理
    </h2>

    <div class="toolbar">

      <select
        id="examIndustryFilter"
        onchange="filterAdminExams()"
      >

        <option value="">
          すべての業種
        </option>

        <option value="飲食料品製造業">
          飲食料品製造業
        </option>

        <option value="外食業">
          外食業
        </option>

      </select>

    </div>

    <div
      id="examTable"
    ></div>

  `;

  filterAdminExams();
}


// ======================================================
// FILTER EXAMS
// ======================================================

window.filterAdminExams =
function() {

  const filter =
    $("examIndustryFilter")
      ?.value || "";

  const exams =
    examsCache.filter(exam => {

      if (!filter) {
        return true;
      }

      return (
        getIndustry(exam) ===
        filter
      );
    });

  const table =
    $("examTable");

  if (!table) return;

  if (!exams.length) {

    table.innerHTML = `
      <div class="note">
        登録されている試験はありません。
      </div>
    `;

    return;
  }

  table.innerHTML = `

    <div class="table-wrap">

      <table class="data-table">

        <thead>

          <tr>

            <th>ID</th>

            <th>業種</th>

            <th>試験名</th>

            <th>問題数</th>

            <th>時間</th>

            <th>合格基準</th>

            <th>公開</th>

            <th>操作</th>

          </tr>

        </thead>

        <tbody>

          ${exams.map(exam => `

            <tr>

              <td>
                ${esc(exam.id)}
              </td>

              <td>
                ${esc(
                  getIndustry(exam) ||
                  "-"
                )}
              </td>

              <td>
                ${esc(exam.title)}
              </td>

              <td>
                ${Number(
                  exam.questionCount ||
                  exam.questions?.length ||
                  0
                )}
              </td>

              <td>
                ${Number(
                  exam.durationMinutes ||
                  70
                )}分
              </td>

              <td>
                ${Number(
                  exam.passPercent ??
                  70
                )}%
              </td>

              <td>

                ${
                  exam.published
                    ? "公開中"
                    : "非公開"
                }

              </td>

              <td>

                <button
                  class="btn secondary"
                  onclick="togglePublish(
                    '${esc(exam.id)}',
                    ${!exam.published}
                  )"
                >
                  ${
                    exam.published
                      ? "非公開にする"
                      : "公開する"
                  }
                </button>

                <button
                  class="btn danger"
                  onclick="deleteExam(
                    '${esc(exam.id)}'
                  )"
                >
                  削除
                </button>

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>

  `;
};


// ======================================================
// PUBLISH
// ======================================================

window.togglePublish =
async function(
  id,
  published
) {

  try {

    await postAdmin({

      action:
        "setPublished",

      id,

      published

    });

    await loadExams();

  } catch (error) {

    console.error(error);

    alert(
      "公開状態の変更に失敗しました。"
    );
  }
};


// ======================================================
// DELETE EXAM
// ======================================================

window.deleteExam =
async function(id) {

  if (
    !confirm(
      "この試験を削除しますか？"
    )
  ) {
    return;
  }

  try {

    await postAdmin({

      action:
        "deleteExam",

      id

    });

    await loadExams();

  } catch (error) {

    console.error(error);

    alert(
      "試験の削除に失敗しました。"
    );
  }
};


// ======================================================
// UPLOAD FORM
// ======================================================

function uploadForm() {

  const content =
    $("content");

  if (!content) return;

  content.innerHTML = `

    <h2>
      新しい試験を追加
    </h2>


    <div class="field">

      <label>
        業種
      </label>

      <select id="examIndustry">

        <option value="飲食料品製造業">
          飲食料品製造業
        </option>

        <option value="外食業">
          外食業
        </option>

      </select>

    </div>


    <div class="field">

      <label>
        試験名
      </label>

      <input
        id="examTitle"
        placeholder="例：模擬試験 第1回"
      >

    </div>


    <div class="field">

      <label>
        試験ID
      </label>

      <input
        id="examId"
        placeholder="例：food01 / restaurant01"
      >

    </div>


    <div class="field">

      <label>
        制限時間
      </label>

      <input
        id="duration"
        type="number"
        value="70"
        min="1"
      >

    </div>


    <div class="field">

      <label>
        合格基準 (%)
      </label>

      <input
        id="passPercent"
        type="number"
        value="70"
        min="0"
        max="100"
      >

    </div>


    <div class="field">

      <label>
        CSVファイル
      </label>

      <input
        id="csvFile"
        type="file"
        accept=".csv,text/csv"
      >

    </div>


    <div class="code-help">

CSV列:

No,Category,Question,A,B,C,D,Correct,Explanation

Correct は A / B / C / D

3択問題の場合は D を空欄にしてください。

例:

1,衛生管理,手洗いについて正しいものはどれですか,選択肢A,選択肢B,選択肢C,,B,解説

    </div>


    <button
      id="uploadBtn"
      class="btn primary"
      style="margin-top:15px"
      onclick="uploadExam()"
    >
      アップロードして保存
    </button>


    <div
      id="uploadMsg"
      class="note"
      style="margin-top:12px"
    ></div>

  `;
}


// ======================================================
// UPLOAD EXAM
// ======================================================

window.uploadExam =
async function() {

  const file =
    $("csvFile")
      ?.files
      ?.[0];

  const industry =
    String(
      $("examIndustry")
        ?.value ||
      ""
    ).trim();

  const title =
    String(
      $("examTitle")
        ?.value ||
      ""
    ).trim();

  const id =
    String(
      $("examId")
        ?.value ||
      ""
    ).trim();

  const durationMinutes =
    Number(
      $("duration")
        ?.value
    ) || 70;

  const passPercent =
    Number(
      $("passPercent")
        ?.value
    );

  if (
    !INDUSTRIES.includes(
      industry
    )
  ) {

    alert(
      "業種を選択してください。"
    );

    return;
  }

  if (
    !title ||
    !id
  ) {

    alert(
      "試験名と試験IDを入力してください。"
    );

    return;
  }

  if (!file) {

    alert(
      "CSVファイルを選択してください。"
    );

    return;
  }

  const text =
    await file.text();

  const questions =
    parseCSV(text);

  if (!questions.length) {

    alert(
      "CSVを読み込めませんでした。列名や内容を確認してください。"
    );

    return;
  }

  const message =
    $("uploadMsg");

  const button =
    $("uploadBtn");

  if (message) {

    message.textContent =
      `${industry}：${questions.length}問を送信中...`;
  }

  if (button) {

    button.disabled =
      true;

    button.textContent =
      "保存中...";
  }

  try {

    await postAdmin({

      action:
        "saveExam",

      exam: {

        id,

        industry,

        title,

        subtitle:
          industry,

        durationMinutes,

        passPercent:
          Number.isFinite(
            passPercent
          )
            ? passPercent
            : 70,

        published:
          false,

        questions

      }

    });

    if (message) {

      message.textContent =
        `保存しました（${industry}・${questions.length}問）。「試験管理」から公開できます。`;
    }

    if (button) {

      button.textContent =
        "保存しました";
    }

  } catch (error) {

    console.error(
      "Upload error:",
      error
    );

    if (message) {

      message.textContent =
        "保存に失敗しました。";
    }

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "アップロードして保存";
    }
  }
};


// ======================================================
// CSV PARSER
// ======================================================

function parseCSV(text) {

  const rows = [];

  let row = [];
  let cell = "";
  let quoted = false;

  for (
    let i = 0;
    i < text.length;
    i++
  ) {

    const ch =
      text[i];

    const next =
      text[i + 1];

    if (
      ch === '"' &&
      quoted &&
      next === '"'
    ) {

      cell += '"';
      i++;
    }

    else if (
      ch === '"'
    ) {

      quoted =
        !quoted;
    }

    else if (
      ch === "," &&
      !quoted
    ) {

      row.push(cell);
      cell = "";
    }

    else if (
      (
        ch === "\n" ||
        ch === "\r"
      ) &&
      !quoted
    ) {

      if (
        ch === "\r" &&
        next === "\n"
      ) {
        i++;
      }

      row.push(cell);

      if (
        row.some(
          value =>
            String(value)
              .trim() !== ""
        )
      ) {

        rows.push(row);
      }

      row = [];
      cell = "";
    }

    else {

      cell += ch;
    }
  }

  row.push(cell);

  if (
    row.some(
      value =>
        String(value)
          .trim() !== ""
    )
  ) {

    rows.push(row);
  }

  if (
    rows.length < 2
  ) {

    return [];
  }

  const headers =
    rows[0].map(
      value =>
        String(value)
          .replace(
            /^\uFEFF/,
            ""
          )
          .trim()
          .toLowerCase()
    );

  const idx =
    name =>
      headers.indexOf(
        name.toLowerCase()
      );

  const required = [
    "No",
    "Category",
    "Question",
    "A",
    "B",
    "C",
    "Correct"
  ];

  if (
    required.some(
      name =>
        idx(name) < 0
    )
  ) {

    return [];
  }

  const choiceIndex = {
    A: 0,
    B: 1,
    C: 2,
    D: 3
  };

  return rows
    .slice(1)

    .map(
      (r, i) => {

        const correctLetter =
          String(
            r[
              idx(
                "Correct"
              )
            ] ||
            ""
          )
          .trim()
          .toUpperCase();

        const choices = [

          r[
            idx("A")
          ] || "",

          r[
            idx("B")
          ] || "",

          r[
            idx("C")
          ] || "",

          idx("D") >= 0
            ? (
                r[
                  idx("D")
                ] || ""
              )
            : ""

        ];

        const correct =
          choiceIndex[
            correctLetter
          ];

        return {

          id:
            Number(
              r[
                idx("No")
              ]
            ) ||
            i + 1,

          category:
            r[
              idx("Category")
            ] || "",

          question:
            r[
              idx("Question")
            ] || "",

          choices,

          correct:
            Number.isInteger(
              correct
            )
              ? correct
              : -1,

          explanation:
            idx("Explanation") >= 0
              ? (
                  r[
                    idx(
                      "Explanation"
                    )
                  ] || ""
                )
              : ""

        };

      }
    )

    .filter(
      question => {

        if (
          !question.question ||
          question.correct < 0
        ) {
          return false;
        }

        const answer =
          question.choices[
            question.correct
          ];

        return (
          String(
            answer || ""
          ).trim() !== ""
        );

      }
    );
}


// ======================================================
// START ADMIN
// ======================================================

function startAdmin() {

  if (
    typeof CBT_CONFIG ===
    "undefined"
  ) {

    app.innerHTML = `

      <div class="form-card">

        <h2>
          config.js を読み込めません
        </h2>

        <p>
          admin.htmlでconfig.jsをadmin.jsより前に読み込んでください。
        </p>

      </div>

    `;

    return;
  }

  if (
    !CBT_CONFIG.apiUrl
  ) {

    app.innerHTML = `

      <div class="form-card">

        <h2>
          API URLが設定されていません
        </h2>

        <p>
          config.jsにGoogle Apps ScriptのURLを設定してください。
        </p>

      </div>

    `;

    return;
  }

  if (ADMIN_KEY) {

    dashboard();

  } else {

    login();
  }
}


// ======================================================
// START
// ======================================================

startAdmin();
