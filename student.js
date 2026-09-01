// ======================================================
// AIDEM TOKUTEI CBT - STUDENT
// メール認証 + LOGIN CHARACTER 版
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

  authorized: false,
  locked: false
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

function mascotFor(i) {
  return MASCOTS[
    Math.abs(Number(i) || 0) % MASCOTS.length
  ];
}

/*
 * Mỗi đề được gán một mascot dựa trên exam ID.
 * Vì vậy cùng một đề sẽ giữ cùng mascot ở:
 * danh sách đề → màn hình thi → kết quả.
 */
function mascotForExam(examId) {

  const text = String(examId || "");

  let hash = 0;

  for (let i = 0; i < text.length; i++) {

    hash =
      ((hash << 5) - hash)
      + text.charCodeAt(i);

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
        new Error(
          "Network error"
        )
      );
    };

    document.body.appendChild(
      script
    );
  });
}


// ======================================================
// LOGIN PAGE
// ======================================================

function loginPage() {

  clearTimer();

  state.locked = false;
  state.authorized = false;
  state.exam = null;

  app.innerHTML = `

    ${brandBar(CBT_CONFIG.siteTitle)}

    <main class="student-login-shell">

      <section class="student-login-hero">

        <img
          src="assets/mascots/mascot-D.2.png"
          class="student-login-mascot mascot-left"
          alt=""
        >

        <img
          src="assets/mascots/mascot-E.2.png"
          class="student-login-mascot mascot-right"
          alt=""
        >

        <div class="student-login-badge">
          CBT 模擬試験
        </div>

        <h1 class="student-login-title">
          飲食料品製造業<br>
          模擬試験
        </h1>

        <p class="student-login-lead">
          本番に近い形式で、試験に向けた実践練習ができます。
        </p>

        <div class="student-login-features">

          <span>⏱ 70分</span>

          <span>📝 CBT形式</span>

          <span>📊 分野別結果</span>

        </div>

      </section>


      <section class="student-login-card">

        <div class="login-main-character">

          <img
            src="assets/mascots/mascot-A.png"
            alt=""
          >

        </div>


        <div class="login-card-heading">

          <div class="login-card-icon">
            ✉
          </div>

          <div>

            <h2>
              受験者確認
            </h2>

            <p>
              登録されているメールアドレスを入力してください。
            </p>

          </div>

        </div>


        <div class="login-input-area">

          <label for="emailInput">
            メールアドレス
          </label>

          <input
            id="emailInput"
            type="email"
            autocomplete="email"
            placeholder="example@gmail.com"
          >


          <div
            id="emailMessage"
            class="login-error"
          ></div>


          <button
            id="emailLoginBtn"
            class="student-login-button"
            type="button"
            onclick="checkEmail()"
          >

            確認して試験一覧へ

            <span>
              →
            </span>

          </button>

        </div>


        <div class="login-security-note">
          登録済みの受験者のみ利用できます。
        </div>

      </section>


      <section class="student-login-message">

        <div class="student-footer-line"></div>

        <p class="student-footer-main">
          本番を想定した模擬試験で、実践力を身につけよう。
        </p>

        <p class="student-footer-sub">
          繰り返し練習して、自信を持って本番へ。
        </p>

      </section>

    </main>
  `;


  const input =
    $("emailInput");

  if (input) {

    input.addEventListener(
      "keydown",
      e => {

        if (
          e.key === "Enter"
        ) {

          checkEmail();

        }

      }
    );

    input.focus();

  }
}

      </div>


      <div class="form-card login-card">


        <div class="login-main-character">

          <img
            src="assets/mascots/mascot-A.png"
            alt=""
          >

        </div>


        <img
          src="assets/mascots/mascot-D.2.png"
          class="login-deco login-deco-left"
          alt=""
        >


        <img
          src="assets/mascots/mascot-E.2.png"
          class="login-deco login-deco-right"
          alt=""
        >


        <h2>
          受験者確認
        </h2>


        <p class="login-guide">
          登録されているメールアドレスを入力してください。
        </p>


        <div class="field">

          <label>
            メールアドレス
          </label>

          <input
            id="emailInput"
            type="email"
            autocomplete="email"
            placeholder="example@gmail.com"
          >

        </div>


        <button
          id="emailLoginBtn"
          class="btn primary full"
          onclick="checkEmail()"
        >
          確認する
        </button>


        <div
          id="emailMessage"
          class="note"
          style="margin-top:12px"
        ></div>


      </div>

    </div>
  `;


  const input =
    $("emailInput");

  if (input) {

    input.addEventListener(
      "keydown",
      e => {

        if (
          e.key === "Enter"
        ) {
          checkEmail();
        }

      }
    );

    input.focus();
  }
}


// ======================================================
// CHECK EMAIL
// ======================================================

window.checkEmail =
async function() {

  const input =
    $("emailInput");

  const button =
    $("emailLoginBtn");

  const message =
    $("emailMessage");

  const email =
    String(
      input?.value || ""
    )
      .trim()
      .toLowerCase();


  if (!email) {

    if (message) {
      message.textContent =
        "メールアドレスを入力してください。";
    }

    return;
  }


  if (
    !email.includes("@")
  ) {

    if (message) {
      message.textContent =
        "正しいメールアドレスを入力してください。";
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
      "受験資格を確認しています...";
  }


  try {

    const data =
      await jsonp({

        action:
          "checkStudent",

        email:
          email

      });


    if (
      !data ||
      data.ok !== true
    ) {

      throw new Error(
        data?.error ||
        "確認できませんでした。"
      );
    }


    if (
      data.allowed !== true
    ) {

      state.authorized =
        false;


      if (message) {

        message.innerHTML = `
          <span class="weak">
            ${
              esc(
                data.error ||
                "このメールアドレスは受験許可されていません。"
              )
            }
          </span>
        `;
      }


      if (button) {

        button.disabled =
          false;

        button.textContent =
          "確認する";
      }

      return;
    }


    state.email =
      data.email ||
      email;

    state.studentName =
      data.studentName ||
      "";

    state.company =
      data.company ||
      "";

    state.authorized =
      true;


    await home();


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

      button.disabled =
        false;

      button.textContent =
        "確認する";
    }
  }
};


// ======================================================
// HOME
// ======================================================

async function home() {

  clearTimer();

  state.locked =
    false;


  if (
    !state.authorized
  ) {

    loginPage();

    return;
  }


  app.innerHTML = `

    ${brandBar(
      CBT_CONFIG.siteTitle
    )}


    <div class="page">


      <div class="hero">

        <h1>
          飲食料品製造業 模擬試験
        </h1>

        <p>
          受験する模擬試験を選択してください。
        </p>

      </div>


      <div class="form-card">

        <h3>
          受験者情報
        </h3>


        <div class="student-info">

          <div>

            <small>
              メールアドレス
            </small>

            <br>

            <b>
              ${esc(state.email)}
            </b>

          </div>


          <br>


          <div>

            <small>
              氏名
            </small>

            <br>

            <b>
              ${esc(state.studentName)}
            </b>

          </div>


          <br>


          <div>

            <small>
              企業名
            </small>

            <br>

            <b>
              ${esc(state.company)}
            </b>

          </div>


        </div>


        <button
          class="btn secondary full"
          style="margin-top:15px"
          onclick="studentLogout()"
        >
          別のメールアドレスで確認する
        </button>

      </div>


      <div
        id="examList"
        class="exam-list"
      >

        <div class="panel">
          試験データを読み込んでいます...
        </div>

      </div>


    </div>
  `;


  try {

    const data =
      await jsonp({
        action:
          "publicExams"
      });


    if (
      !data.ok
    ) {

      throw new Error(
        data.error ||
        "Load failed"
      );
    }


    const exams =
      Array.isArray(
        data.exams
      )
        ? data.exams
        : [];


    $("examList").innerHTML =

      exams.map(
        (e, i) => `

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

              ${
                esc(
                  e.subtitle ||
                  "飲食料品製造業"
                )
              }

              <br>

              ${e.questionCount}問
              ・
              ${e.durationMinutes}分
              ・
              合格基準
              ${e.passPercent}%

            </div>


            <button
              class="btn primary full"
              onclick="openExam('${esc(e.id)}')"
            >
              試験を選択
            </button>

          </div>

        `
      ).join("")

      ||

      `
        <div class="panel">
          現在公開中の試験はありません。
        </div>
      `;


  } catch (error) {

    console.error(error);


    $("examList").innerHTML = `

      <div class="panel">

        試験を読み込めませんでした。
        管理者に連絡してください。

        <div class="note">
          ${esc(error.message)}
        </div>

      </div>
    `;
  }
}


// ======================================================
// LOGOUT
// ======================================================

window.studentLogout =
function() {

  clearTimer();

  state.email = "";
  state.company = "";
  state.studentName = "";
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

  if (
    !state.authorized
  ) {

    loginPage();

    return;
  }


  app.innerHTML = `

    ${brandBar(
      "試験データ読み込み中"
    )}

    <div class="form-card">
      試験を読み込んでいます...
    </div>
  `;


  try {

    const data =
      await jsonp({

        action:
          "getExam",

        id:
          id

      });


    if (
      !data.ok
    ) {

      throw new Error(
        data.error ||
        "Load failed"
      );
    }


    state.exam =
      data.exam;


    app.innerHTML = `

      ${brandBar(
        state.exam.title
      )}


      <div class="form-card">

        <h2>
          ${esc(state.exam.title)}
        </h2>


        <p>
          ${
            esc(
              state.exam.subtitle ||
              "飲食料品製造業"
            )
          }
        </p>


        <div class="student-box">

          <small>
            メールアドレス
          </small>

          <br>

          <b>
            ${esc(state.email)}
          </b>


          <br><br>


          <small>
            企業名
          </small>

          <br>

          <b>
            ${esc(state.company)}
          </b>


          <br><br>


          <small>
            氏名
          </small>

          <br>

          <b>
            ${esc(state.studentName)}
          </b>

        </div>


        <div class="rules">

          問題数：
          ${state.exam.questions.length}問

          <br>

          制限時間：
          ${state.exam.durationMinutes}分

          <br>

          合格基準：
          ${state.exam.passPercent}%

          <br><br>

          「試験を開始する」を押すと
          タイマーが開始されます。

          <br>

          時間が終了すると自動的に提出され、
          その後は回答できません。

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
          onclick="home()"
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

    home();
  }
};


// ======================================================
// START EXAM
// ======================================================

window.startExam =
function() {

  if (
    !state.authorized
  ) {

    alert(
      "受験者確認が必要です。"
    );

    loginPage();

    return;
  }


  if (
    !state.exam
  ) {
    return;
  }


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


  state.locked =
    false;


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
// ======================================================

function renderExam() {

  if (
    state.locked
  ) {
    return;
  }


  const q =
    state.exam.questions[
      state.current
    ];


  app.innerHTML = `

    ${brandBar(
      state.exam.title,
      true
    )}


    <div class="exam-layout">


      <aside class="sidebar">


        <div class="student-box">

          <small>
            企業名
          </small>

          <br>

          <b>
            ${esc(state.company)}
          </b>


          <br><br>


          <small>
            受験者
          </small>

          <br>

          <b>
            ${esc(state.studentName)}
          </b>

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
              state.marked[
                state.current
              ]
                ? "active"
                : ""
            }"
            onclick="toggleMark()"
          >

            ${
              state.marked[
                state.current
              ]
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
            q.choices.map(
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

  if (
    state.locked
  ) {
    return;
  }

  state.answers[
    state.current
  ] = i;

  renderExam();
};


window.toggleMark =
function() {

  if (
    state.locked
  ) {
    return;
  }

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

  if (
    state.locked
  ) {
    return;
  }

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

  if (
    !state.locked
  ) {

    state.current = i;

    renderExam();
  }
};


// ======================================================
// SUBMIT CONFIRM
// ======================================================

window.confirmSubmit =
function() {

  if (
    state.locked
  ) {
    return;
  }


  const unanswered =
    state.answers.filter(
      x => x === null
    ).length;


  const message =
    unanswered

      ? `未回答が ${unanswered} 問あります。提出しますか？`

      : "試験を提出しますか？";


  if (
    confirm(message)
  ) {

    submitExam(false);
  }
};


// ======================================================
// TIMER
// ======================================================

function tick() {

  if (
    state.locked
  ) {
    return;
  }


  state.remaining--;


  if (
    state.remaining <= 0
  ) {

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
    Math.floor(
      time / 60
    )
      .toString()
      .padStart(
        2,
        "0"
      );


  const seconds =
    (
      time % 60
    )
      .toString()
      .padStart(
        2,
        "0"
      );


  el.textContent =
    `${minutes}:${seconds}`;
}


// ======================================================
// SUBMIT
// ======================================================

async function submitExam(
  auto
) {

  if (
    !state.locked
  ) {

    state.locked = true;

    clearTimer();
  }


  app.innerHTML = `

    ${brandBar(
      "採点中"
    )}

    <div class="form-card">
      採点中です...
    </div>
  `;


  const payload = {

    action:
      "submit",

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


    if (
      !data.ok
    ) {

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

      ${brandBar(
        "送信エラー"
      )}

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
            auto
              ? "true"
              : "false"
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

      method:
        "POST",

      mode:
        "no-cors",

      headers: {

        "Content-Type":
          "text/plain;charset=utf-8"

      },

      body:
        JSON.stringify(
          payload
        )
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
// ======================================================

function renderResult(
  result,
  auto
) {

  app.innerHTML = `

    ${brandBar(
      state.exam.title
    )}


    <div class="result-wrap">


     <div class="result-mascot">

       <img
          src="${mascotForExam(state.exam.id)}"
          alt=""
      >

    </div>


      <h2 style="text-align:center">
        試験結果
      </h2>


      <div class="score">
        ${result.percent}%
      </div>


      <div
        class="${
          result.passed
            ? "pass"
            : "fail"
        }"
      >

        ${
          result.passed
            ? "合格"
            : "不合格"
        }

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
          result.categories.map(
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
          ).join("")
        }


      </div>


      <div class="note">

        学生画面では基本結果のみ表示されます。
        正答・詳細分析は管理者画面で確認できます。

      </div>


      <button
        class="btn primary full"
        style="margin-top:18px"
        onclick="home()"
      >
        試験一覧に戻る
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


          if (
            value === "C"
          ) {

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
                  .test(
                    calcExpr
                  )
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
              calcExpr ===
              "Error"
            ) {

              calcExpr = "";
            }


            calcExpr +=
              value;
          }


          if (
            calcDisplay
          ) {

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
