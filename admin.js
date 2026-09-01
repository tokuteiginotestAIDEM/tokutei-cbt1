// ======================================================
// AIDEM TOKUTEI CBT - ADMIN
// ======================================================

const app = document.getElementById("adminApp");

let ADMIN_KEY = "";
let currentTab = "results";
let resultsCache = [];
let examsCache = [];

const $ = (id) => document.getElementById(id);


// ======================================================
// COMMON
// ======================================================

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}


function adminBrand(title = "模擬試験 管理画面") {
  return `
    <div class="brandbar admin-brandbar">

      <div class="brand-logos">

        <img
          src="assets/aidem-logo.png"
          class="brand-logo aidem"
          alt="AIDEM"
        >

        <span class="brand-sep">›</span>

        <img
          src="assets/aidem-global-logo.png"
          class="brand-logo global"
          alt="アイデムグローバル"
        >

        <span class="brand-sep">›</span>

        <img
          src="assets/aitoku-logo.png"
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
// API - JSONP
// ======================================================

function jsonp(params) {

  return new Promise((resolve, reject) => {

    const script = document.createElement("script");

    // Apps Script側との互換性を優先して固定 callback を使用
    window.callback = function(data) {

      clearTimeout(timer);

      try {
        script.remove();
      } catch (e) {}

      delete window.callback;

      resolve(data);
    };


    const query = new URLSearchParams({
      ...params,
      callback: "callback",
      _: Date.now()
    });


    script.src =
      CBT_CONFIG.apiUrl +
      "?" +
      query.toString();


    const timer = setTimeout(() => {

      try {
        script.remove();
      } catch (e) {}

      delete window.callback;

      reject(new Error("API timeout"));

    }, 15000);


    script.onerror = function() {

      clearTimeout(timer);

      try {
        script.remove();
      } catch (e) {}

      delete window.callback;

      reject(new Error("API network error"));
    };


    document.body.appendChild(script);
  });
}


// ======================================================
// POST API
// ======================================================

async function postAdmin(payload) {

  payload.adminKey = ADMIN_KEY;

  await fetch(CBT_CONFIG.apiUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  // Apps Scriptへの保存待ち
  await new Promise((resolve) => setTimeout(resolve, 1200));
}


// ======================================================
// LOGIN
// ======================================================

function login() {

  ADMIN_KEY = "";
  sessionStorage.removeItem("cbt_admin_key");

  app.innerHTML = `

    ${adminBrand("管理者ログイン")}

    <div class="form-card">

      <h2>管理者ログイン</h2>

      <div class="field">
        <label>管理パスワード</label>

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
        onclick="doLogin()"
      >
        ログイン
      </button>

      <div id="loginMsg" class="note"></div>

    </div>
  `;


  const input = $("keyInput");

  if (input) {

    input.addEventListener("keydown", function(e) {

      if (e.key === "Enter") {
        doLogin();
      }

    });

    input.focus();
  }
}


window.doLogin = async function() {

  const input = $("keyInput");
  const btn = $("loginBtn");
  const msg = $("loginMsg");

  const key = input ? input.value.trim() : "";

  if (!key) {

    if (msg) {
      msg.textContent = "パスワードを入力してください。";
    }

    return;
  }


  if (btn) {
    btn.disabled = true;
    btn.textContent = "確認中...";
  }

  if (msg) {
    msg.textContent = "";
  }


  try {

    const data = await jsonp({
      action: "adminPing",
      key: key
    });


    console.log("adminPing result:", data);


    if (!data || data.ok !== true) {

      throw new Error(
        data && data.message
          ? data.message
          : "Password rejected"
      );
    }


    ADMIN_KEY = key;

    sessionStorage.setItem(
      "cbt_admin_key",
      key
    );


    dashboard();


  } catch (error) {

    console.error("Login error:", error);

    ADMIN_KEY = "";

    sessionStorage.removeItem("cbt_admin_key");


    if (msg) {

      msg.textContent =
        "ログインできませんでした。パスワードまたはAPI接続を確認してください。";

    } else {

      alert(
        "ログインできませんでした。"
      );
    }


    if (btn) {
      btn.disabled = false;
      btn.textContent = "ログイン";
    }
  }
};


// ======================================================
// LOGOUT
// ======================================================

window.logout = function() {

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
      "飲食料品製造業 模擬試験 管理画面"
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


  showTab(currentTab);
}


// ======================================================
// TABS
// ======================================================

window.showTab = async function(tab) {

  currentTab = tab;


  ["Results", "Exams", "Upload"].forEach((name) => {

    const element = $("tab" + name);

    if (element) {
      element.classList.remove("active");
    }

  });


  const cap =
    tab.charAt(0).toUpperCase() +
    tab.slice(1);


  const active = $("tab" + cap);

  if (active) {
    active.classList.add("active");
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
// RESULTS
// ======================================================

async function loadResults() {

  const content = $("content");

  if (!content) return;


  content.innerHTML =
    "結果を読み込んでいます...";


  try {

    const data = await jsonp({
      action: "adminResults",
      key: ADMIN_KEY
    });


    if (!data || data.ok !== true) {

      throw new Error(
        "adminResults failed"
      );
    }


    resultsCache =
      Array.isArray(data.results)
        ? data.results
        : [];


    renderResults();


  } catch (error) {

    console.error(error);

    content.innerHTML = `
      <div class="weak">
        受験結果の読み込みに失敗しました。
      </div>
    `;
  }
}


// ======================================================
// RESULTS TABLE
// ======================================================

function renderResults() {

  const content = $("content");

  if (!content) return;


  content.innerHTML = `

    <h2>受験結果</h2>


    <div class="toolbar">

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
          すべて
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


    <div id="resultTable"></div>
  `;


  filterResults();
}


window.filterResults = function() {

  const company =
    ($("fCompany")?.value || "")
      .toLowerCase();


  const name =
    ($("fName")?.value || "")
      .toLowerCase();


  const pass =
    $("fPass")?.value || "";


  const rows =
    resultsCache.filter((r) => {

      const companyOK =
        (r.company || "")
          .toLowerCase()
          .includes(company);


      const nameOK =
        (r.studentName || "")
          .toLowerCase()
          .includes(name);


      const passOK =
        pass === "" ||
        String(r.passed) === pass;


      return (
        companyOK &&
        nameOK &&
        passOK
      );
    });


  const table = $("resultTable");

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

          ${rows.map((r) => `

            <tr>

              <td>
                ${esc(r.timestamp)}
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
                  (r.categories || [])
                    .map((c) =>

                      `${esc(c.category)}:
                       ${c.correct}/${c.total}
                       (${c.percent}%)`

                    )
                    .join("<br>")
                }

              </td>


              <td class="weak">

                ${
                  esc(
                    (r.weakCategories || [])
                      .join("・") || "-"
                  )
                }

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;
};


// ======================================================
// EXPORT CSV
// ======================================================

window.exportResults = function() {

  const rows = [[

    "Timestamp",
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


  resultsCache.forEach((r) => {

    rows.push([

      r.timestamp,
      r.company,
      r.studentName,
      r.examTitle,
      r.correct,
      r.total,
      r.percent,
      r.passed,

      (r.categories || [])
        .map((c) =>
          `${c.category}:${c.correct}/${c.total}(${c.percent}%)`
        )
        .join(" | "),

      (r.weakCategories || [])
        .join(" | ")

    ]);
  });


  const csv =
    rows.map((row) =>

      row.map((value) => {

        value = String(value ?? "");

        return /[",\n]/.test(value)

          ? `"${value.replace(/"/g, '""')}"`

          : value;

      }).join(",")

    ).join("\n");


  const blob =
    new Blob(
      ["\ufeff" + csv],
      {
        type:
          "text/csv;charset=utf-8"
      }
    );


  const link =
    document.createElement("a");


  link.href =
    URL.createObjectURL(blob);


  link.download =
    "cbt_results.csv";


  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(
    link.href
  );
};


// ======================================================
// EXAMS
// ======================================================

async function loadExams() {

  const content = $("content");

  if (!content) return;


  content.innerHTML =
    "試験を読み込んでいます...";


  try {

    const data = await jsonp({
      action: "adminExams",
      key: ADMIN_KEY
    });


    if (!data || data.ok !== true) {

      throw new Error(
        "adminExams failed"
      );
    }


    examsCache =
      Array.isArray(data.exams)
        ? data.exams
        : [];


    if (!examsCache.length) {

      content.innerHTML = `

        <h2>試験管理</h2>

        <div class="note">
          登録されている試験はありません。
        </div>
      `;

      return;
    }


    content.innerHTML = `

      <h2>試験管理</h2>


      <div class="table-wrap">

        <table class="data-table">

          <thead>

            <tr>

              <th>ID</th>

              <th>試験名</th>

              <th>問題数</th>

              <th>時間</th>

              <th>合格基準</th>

              <th>公開</th>

              <th>操作</th>

            </tr>

          </thead>


          <tbody>

            ${examsCache.map((e) => `

              <tr>

                <td>
                  ${esc(e.id)}
                </td>


                <td>
                  ${esc(e.title)}
                </td>


                <td>
                  ${e.questionCount ?? 0}
                </td>


                <td>
                  ${e.durationMinutes ?? 70}分
                </td>


                <td>
                  ${e.passPercent ?? 70}%
                </td>


                <td>

                  ${
                    e.published
                      ? "公開中"
                      : "非公開"
                  }

                </td>


                <td>

                  <button
                    class="btn secondary"
                    onclick="togglePublish(
                      '${esc(e.id)}',
                      ${!e.published}
                    )"
                  >

                    ${
                      e.published
                        ? "非公開にする"
                        : "公開する"
                    }

                  </button>


                  <button
                    class="btn danger"
                    onclick="deleteExam(
                      '${esc(e.id)}'
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


  } catch (error) {

    console.error(error);

    content.innerHTML = `
      <div class="weak">
        試験一覧の読み込みに失敗しました。
      </div>
    `;
  }
};


// ======================================================
// PUBLISH
// ======================================================

window.togglePublish =
async function(id, published) {

  try {

    await postAdmin({
      action: "setPublished",
      id: id,
      published: published
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

  const ok = confirm(
    "この試験を削除しますか？"
  );


  if (!ok) return;


  try {

    await postAdmin({
      action: "deleteExam",
      id: id
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

  const content = $("content");

  if (!content) return;


  content.innerHTML = `

    <h2>新しい試験を追加</h2>


    <div class="field">

      <label>試験名</label>

      <input
        id="examTitle"
        placeholder="例：模擬試験 第1回"
      >

    </div>


    <div class="field">

      <label>試験ID</label>

      <input
        id="examId"
        placeholder="例：exam01"
      >

    </div>


    <div class="field">

      <label>制限時間</label>

      <input
        id="duration"
        type="number"
        value="70"
        min="1"
      >

    </div>


    <div class="field">

      <label>合格基準 (%)</label>

      <input
        id="passPercent"
        type="number"
        value="70"
        min="0"
        max="100"
      >

    </div>


    <div class="field">

      <label>CSVファイル</label>

      <input
        id="csvFile"
        type="file"
        accept=".csv,text/csv"
      >

    </div>


    <div class="code-help">

CSV列：

No,Category,Question,A,B,C,D,Correct,Explanation

<br><br>

Correct は
A / B / C / D

<br><br>

例：<br>

1,衛生管理,手洗いについて正しいものはどれですか,選択肢A,選択肢B,選択肢C,選択肢D,B,解説

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
    ></div>
  `;
};


// ======================================================
// UPLOAD EXAM
// ======================================================

window.uploadExam =
async function() {

  const file =
    $("csvFile")?.files?.[0];


  if (!file) {

    alert(
      "CSVファイルを選択してください。"
    );

    return;
  }


  const title =
    $("examTitle")?.value.trim();


  const id =
    $("examId")?.value.trim();


  if (!title || !id) {

    alert(
      "試験名と試験IDを入力してください。"
    );

    return;
  }


  const duration =
    Number(
      $("duration")?.value
    ) || 70;


  const passPercent =
    Number(
      $("passPercent")?.value
    ) || 70;


  const button =
    $("uploadBtn");


  const message =
    $("uploadMsg");


  try {

    if (button) {
      button.disabled = true;
    }


    const text =
      await file.text();


    const questions =
      parseCSV(text);


    if (!questions.length) {

      throw new Error(
        "CSVに問題がありません。"
      );
    }


    if (message) {

      message.textContent =
        `${questions.length}問を送信中...`;

    }


    await postAdmin({

      action: "saveExam",

      exam: {

        id: id,

        title: title,

        subtitle:
          "飲食料品製造業",

        durationMinutes:
          duration,

        passPercent:
          passPercent,

        published:
          false,

        questions:
          questions
      }
    });


    if (message) {

      message.textContent =
        `✅ ${questions.length}問を保存しました。試験管理から公開してください。`;

    }


  } catch (error) {

    console.error(error);


    if (message) {

      message.textContent =
        "❌ 保存に失敗しました。CSVファイルを確認してください。";
    }


  } finally {

    if (button) {
      button.disabled = false;
    }
  }
};


// ======================================================
// CSV PARSER
// ======================================================

function parseCSV(text) {

  // Excel UTF-8 BOM対策
  text = text.replace(
    /^\uFEFF/,
    ""
  );


  const rows = [];

  let row = [];
  let cell = "";
  let quoted = false;


  for (
    let i = 0;
    i < text.length;
    i++
  ) {

    const char =
      text[i];

    const next =
      text[i + 1];


    if (
      char === '"' &&
      quoted &&
      next === '"'
    ) {

      cell += '"';

      i++;

    }

    else if (
      char === '"'
    ) {

      quoted = !quoted;

    }

    else if (
      char === "," &&
      !quoted
    ) {

      row.push(cell);

      cell = "";

    }

    else if (
      (char === "\n" ||
       char === "\r") &&
      !quoted
    ) {

      if (
        char === "\r" &&
        next === "\n"
      ) {
        i++;
      }


      row.push(cell);


      if (
        row.some(
          (value) =>
            value.trim() !== ""
        )
      ) {

        rows.push(row);
      }


      row = [];
      cell = "";

    }

    else {

      cell += char;

    }
  }


  row.push(cell);


  if (
    row.some(
      (value) =>
        value.trim() !== ""
    )
  ) {

    rows.push(row);
  }


  if (rows.length < 2) {

    return [];
  }


  const headers =
    rows[0].map(
      (value) =>
        value.trim().toLowerCase()
    );


  const index =
    (name) =>
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
    "D",
    "Correct"
  ];


  for (const name of required) {

    if (index(name) === -1) {

      console.error(
        "Missing CSV column:",
        name
      );

      return [];
    }
  }


  return rows
    .slice(1)
    .map((r, i) => {

      const correctLetter =
        (
          r[index("Correct")] || ""
        )
          .trim()
          .toUpperCase();


      const correctIndex =
        ["A", "B", "C", "D"]
          .indexOf(
            correctLetter
          );


      return {

        id:
          Number(
            r[index("No")]
          ) || i + 1,


        category:
          r[index("Category")] || "",


        question:
          r[index("Question")] || "",


        choices: [

          r[index("A")] || "",

          r[index("B")] || "",

          r[index("C")] || "",

          r[index("D")] || ""

        ],


        correct:
          correctIndex,


        explanation:

          index("Explanation") >= 0

            ? (
                r[
                  index("Explanation")
                ] || ""
              )

            : ""
      };

    })

    .filter(
      (q) =>
        q.question.trim() !== "" &&
        q.correct >= 0
    );
}


// ======================================================
// START
// ======================================================

function startAdmin() {

  if (
    typeof CBT_CONFIG === "undefined"
  ) {

    app.innerHTML = `
      <div class="form-card">

        <h2>設定エラー</h2>

        <p>
          config.js を読み込めません。
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

        <h2>API URLが設定されていません</h2>

        <p>
          config.js の apiUrl を確認してください。
        </p>

      </div>
    `;

    return;
  }


  // 安全のため管理画面を開くたびにログイン
  ADMIN_KEY = "";

  sessionStorage.removeItem(
    "cbt_admin_key"
  );


  login();
}


startAdmin();
