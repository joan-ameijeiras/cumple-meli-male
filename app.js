// ---------------------------------------------------------------
// Supabase config — reemplazá estos dos valores con los de tu
// proyecto (Project Settings → API). Mientras digan "TU-PROYECTO"
// la app funciona igual, pero solo imprime el resultado en la
// consola en lugar de guardarlo.
// ---------------------------------------------------------------
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU-ANON-KEY";

let supabase = null;
if (!SUPABASE_URL.includes("TU-PROYECTO")) {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ---------------------------------------------------------------
// Datos de las encuestas
// ---------------------------------------------------------------
const SURVEYS = {
  meli: {
    id: "meli",
    name: "Meli",
    photo: "assets/meli.jpg",
    questions: [
      {
        id: "fecha",
        type: "text",
        prompt: "¿Cuándo es mi cumple?",
        placeholder: "dd/mm",
        correct: "28/08",
      },
      {
        id: "obra",
        type: "choice",
        prompt: "¿Cuál fue la primera obra que cantó en el coro de exalumnos?",
        options: ["Adiós Nonino", "Crece desde el pie", "Jagdlied"],
        correct: "Jagdlied",
      },
      {
        id: "hora",
        type: "choice",
        prompt: "¿A qué hora nací?",
        options: ["14:40", "00:35", "03:20"],
        correct: "14:40",
      },
      {
        id: "pianistas",
        type: "choice",
        prompt: "¿Cuántos pianistas pasaron por mi banda hasta ahora?",
        options: ["1", "2", "3"],
        correct: "2",
      },
      {
        id: "puertas",
        type: "choice",
        prompt: "¿Cuántas puertas tiene mi casa?",
        options: ["8", "5", "2"],
        correct: "8",
      },
      {
        id: "tatuajes",
        type: "choice",
        prompt: "¿Tengo tatuajes?",
        options: ["Sí", "No", "Uno, por accidente"],
        correct: "No",
      },
      {
        id: "primaria",
        type: "choice",
        prompt: "En la primaria, ¿era del A o del B?",
        options: ["A", "B"],
        correct: "B",
      },
      {
        id: "secundaria",
        type: "choice",
        prompt: "En la secundaria, ¿a qué división fui?",
        options: ["7", "5", "12"],
        correct: "7",
      },
      {
        id: "vestido",
        type: "choice",
        prompt: "¿De qué color veo <strong>el</strong> vestido?",
        options: ["Blanco y dorado", "Violeta y verde", "Azul y negro"],
        correct: "Blanco y dorado",
      },
    ],
  },
  male: {
    id: "male",
    name: "Male",
    photo: "assets/male.jpg",
    // TODO: reemplazar por las preguntas reales de Male, con la
    // misma forma que las de Meli (ver arriba).
    questions: [],
  },
};

// ---------------------------------------------------------------
// Estado
// ---------------------------------------------------------------
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const state = {
  screen: "reception", // reception | question | placeholder | thanks
  order: shuffle(["meli", "male"]), // cuál encuesta va primero
  surveyIdx: 0,
  questionIdx: 0,
  guesses: { meli: 50, male: 50 },
  answers: { meli: {}, male: {} },
  optionOrderCache: {}, // `${surveyId}-${questionId}` -> string[]
};

function currentSurvey() {
  return SURVEYS[state.order[state.surveyIdx]];
}

function shuffledOptionsFor(survey, question) {
  const key = `${survey.id}-${question.id}`;
  if (!state.optionOrderCache[key]) {
    state.optionOrderCache[key] = shuffle(question.options);
  }
  return state.optionOrderCache[key];
}

// ---------------------------------------------------------------
// Navegación
// ---------------------------------------------------------------
function goToNextSurveyOrThanks() {
  if (state.surveyIdx < state.order.length - 1) {
    state.surveyIdx += 1;
    state.questionIdx = 0;
    const next = currentSurvey();
    state.screen = next.questions.length ? "question" : "placeholder";
  } else {
    state.screen = "thanks";
    submitResults();
  }
  render();
}

function goNext() {
  const survey = currentSurvey();
  if (state.questionIdx < survey.questions.length - 1) {
    state.questionIdx += 1;
    render();
  } else {
    goToNextSurveyOrThanks();
  }
}

function goBack() {
  if (state.questionIdx > 0) {
    state.questionIdx -= 1;
    render();
  }
}

function startSurveys() {
  const first = currentSurvey();
  state.screen = first.questions.length ? "question" : "placeholder";
  render();
}

// ---------------------------------------------------------------
// Envío a Supabase
// ---------------------------------------------------------------
async function submitResults() {
  const payload = {
    orden_encuestas: state.order,
    puntaje_esperado_meli: state.guesses.meli,
    puntaje_esperado_male: state.guesses.male,
    respuestas_meli: state.answers.meli,
    respuestas_male: state.answers.male,
  };

  if (!supabase) {
    console.log("[demo] Resultado (configurá Supabase para guardarlo de verdad):", payload);
    return;
  }

  const { error } = await supabase.from("respuestas").insert(payload);
  if (error) console.error("Error guardando la respuesta en Supabase:", error);
}

// ---------------------------------------------------------------
// Render: pantalla de recepción
// ---------------------------------------------------------------
function renderReception() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="reception">
      <div class="blob">${blobSvg()}</div>
      <h1 class="headline">¿Qué tanto <em>conocés</em> a las cumpleañeras?</h1>
      <p class="subtext">Antes de arrancar, decinos qué puntaje esperás sacar en cada encuesta.</p>

      <div class="guess-list">
        <div class="guess-row" data-who="meli">
          <div class="guess-label"><span>Meli</span><span class="guess-value" id="val-meli">50%</span></div>
          <input type="range" id="range-meli" min="0" max="100" step="5" value="50" />
        </div>
        <div class="guess-row" data-who="male">
          <div class="guess-label"><span>Male</span><span class="guess-value" id="val-male">50%</span></div>
          <input type="range" id="range-male" min="0" max="100" step="5" value="50" />
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" id="start-btn">Empezar</button>
      </div>
    </div>
  `;

  const rangeMeli = document.getElementById("range-meli");
  const rangeMale = document.getElementById("range-male");

  const syncRange = (input, who) => {
    document.getElementById(`val-${who}`).textContent = `${input.value}%`;
    input.style.setProperty("--val", `${input.value}%`);
    state.guesses[who] = Number(input.value);
  };
  syncRange(rangeMeli, "meli");
  syncRange(rangeMale, "male");
  rangeMeli.addEventListener("input", () => syncRange(rangeMeli, "meli"));
  rangeMale.addEventListener("input", () => syncRange(rangeMale, "male"));

  document.getElementById("start-btn").addEventListener("click", startSurveys);
}

function blobSvg() {
  return `<svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M40 90 C 20 40, 90 10, 150 25 C 220 42, 230 5, 300 15 C 360 24, 385 70, 350 105 C 310 145, 220 140, 160 130 C 90 118, 55 130, 40 90 Z" fill="var(--meli-soft)"/>
    <path d="M120 110 C 100 70, 160 55, 210 65 C 270 77, 290 45, 330 60 C 365 73, 370 105, 340 120 C 300 140, 240 132, 190 125 C 150 119, 135 138, 120 110 Z" fill="var(--male-soft)" opacity="0.85"/>
  </svg>`;
}

// ---------------------------------------------------------------
// Render: encabezado de encuesta (foto + nombre + progreso)
// ---------------------------------------------------------------
function surveyHeaderHtml(survey) {
  const dots = survey.questions
    .map((_, i) => {
      const cls = i < state.questionIdx ? "is-done" : i === state.questionIdx ? "is-current" : "";
      return `<span class="dot ${cls}"></span>`;
    })
    .join("");

  return `
    <div class="survey-header">
      <div class="photo-wrap">
        <img src="${survey.photo}" alt="Foto de ${survey.name}"
             onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'photo-fallback',textContent:'${survey.name[0]}'}))" />
        <span class="photo-tag">${survey.name}</span>
      </div>
      <div class="progress-dots">${dots}</div>
    </div>
  `;
}

// ---------------------------------------------------------------
// Render: pregunta
// ---------------------------------------------------------------
function renderQuestion() {
  const survey = currentSurvey();
  const question = survey.questions[state.questionIdx];
  const saved = state.answers[survey.id][question.id];
  const app = document.getElementById("app");

  document.documentElement.style.setProperty(
    "--accent", `var(--${survey.id})`
  );
  document.documentElement.style.setProperty(
    "--accent-dark", `var(--${survey.id}-dark)`
  );
  document.documentElement.style.setProperty(
    "--accent-soft", `var(--${survey.id}-soft)`
  );

  let bodyHtml = "";
  if (question.type === "choice") {
    const options = shuffledOptionsFor(survey, question);
    bodyHtml = `
      <div class="options">
        ${options
          .map(
            (opt) => `
          <button class="option ${saved === opt ? "is-selected" : ""}" data-value="${opt}">
            ${opt}
          </button>`
          )
          .join("")}
      </div>
    `;
  } else {
    bodyHtml = `
      <input class="text-input" type="text" id="text-answer"
             placeholder="${question.placeholder || ""}" value="${saved || ""}" />
      <p class="field-hint">Escribila como te salga, no hace falta que sea exacta.</p>
    `;
  }

  const isLast =
    state.questionIdx === survey.questions.length - 1 &&
    state.surveyIdx === state.order.length - 1;

  app.innerHTML = `
    ${surveyHeaderHtml(survey)}
    <div class="question-wrap">
      <h2 class="question-text">${question.prompt}</h2>
      ${bodyHtml}
      <div class="btn-row">
        <button class="btn btn-ghost" id="back-btn" ${state.questionIdx === 0 ? "disabled style='visibility:hidden'" : ""}>Atrás</button>
        <button class="btn btn-primary" id="next-btn" disabled>${isLast ? "Terminar" : "Siguiente"}</button>
      </div>
    </div>
  `;

  const nextBtn = document.getElementById("next-btn");

  const enableIfReady = (value) => {
    nextBtn.disabled = !value;
  };

  if (question.type === "choice") {
    enableIfReady(saved);
    app.querySelectorAll(".option").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.answers[survey.id][question.id] = btn.dataset.value;
        app.querySelectorAll(".option").forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        enableIfReady(true);
      });
    });
  } else {
    const input = document.getElementById("text-answer");
    enableIfReady(input.value.trim());
    input.addEventListener("input", () => {
      state.answers[survey.id][question.id] = input.value.trim();
      enableIfReady(input.value.trim());
    });
  }

  document.getElementById("back-btn").addEventListener("click", goBack);
  nextBtn.addEventListener("click", goNext);
}

// ---------------------------------------------------------------
// Render: placeholder (encuesta sin preguntas todavía)
// ---------------------------------------------------------------
function renderPlaceholder() {
  const survey = currentSurvey();
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="centered-screen">
      <div class="big-emoji-free-mark">${survey.name[0]}</div>
      <h2 class="headline">Las preguntas de ${survey.name} llegan pronto</h2>
      <p class="subtext">Todavía se están armando. Volvé a escanear el QR más adelante.</p>
      <div class="btn-row">
        <button class="btn btn-primary" id="continue-btn">Continuar</button>
      </div>
    </div>
  `;
  document.getElementById("continue-btn").addEventListener("click", goToNextSurveyOrThanks);
}

// ---------------------------------------------------------------
// Render: agradecimiento final
// ---------------------------------------------------------------
function renderThanks() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="centered-screen">
      <div class="big-emoji-free-mark">✓</div>
      <h2 class="headline">Listo, gracias por jugar</h2>
      <p class="subtext">Ya guardamos tus respuestas. Nos vemos en la fiesta.</p>
    </div>
  `;
}

// ---------------------------------------------------------------
// Loop principal
// ---------------------------------------------------------------
function render() {
  if (state.screen === "reception") renderReception();
  else if (state.screen === "question") renderQuestion();
  else if (state.screen === "placeholder") renderPlaceholder();
  else if (state.screen === "thanks") renderThanks();
}

render();
