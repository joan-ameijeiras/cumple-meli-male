import { supabase } from "./supabase-client.js";

// ---------------------------------------------------------------
// Datos de las encuestas
//
// Cada pregunta vive dentro de la encuesta de su cumpleañera
// (SURVEYS.meli o SURVEYS.male). La foto de encabezado que se
// muestra en cada pregunta sale automáticamente de `photo` en el
// objeto de esa encuesta — no hace falta indicarla pregunta por
// pregunta. Para poner las fotos reales, guardá los archivos como
// assets/meli.jpg y assets/male.jpg (ver README).
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
        format: "ddmm",
        prompt: "¿Cuándo es mi cumple?",
        placeholder: "dd/mm",
        correct: "28/08",
      },
      {
        id: "obra",
        type: "choice",
        prompt: "¿Cuál fue la primera obra que canté en el coro de exalumnos?",
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
        prompt: "¿Cuántos pianistas tuve en TUFAI?",
        options: ["2", "3", "1"],
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
        prompt: "¿De qué color veo el vestido?",
        options: ["Blanco y dorado", "Violeta y verde", "Azul y negro"],
        correct: "Blanco y dorado",
      },
      {
        id: "alergia",
        type: "choice",
        prompt: "¿A qué soy alérgica?",
        options: ["Todas las uvas", "Uvas moradas", "Uvas verdes"],
        correct: "Uvas moradas",
      },
    ],
  },
  male: {
    id: "male",
    name: "Male",
    photo: "assets/male.jpg",
    questions: [
      {
        id: "fecha",
        type: "text",
        format: "ddmm",
        prompt: "¿Cuándo es mi cumple?",
        placeholder: "dd/mm",
        correct: "31/08",
      },
      {
        id: "vestido",
        type: "choice",
        prompt: "¿De qué color veo el vestido?",
        options: ["Blanco y dorado", "Azul y negro", "Celeste y marrón"],
        correct: "Blanco y dorado",
      },
      {
        id: "division",
        type: "choice",
        prompt: "¿A qué división iba?",
        options: ["12º", "Primero a la 8º y después a la 14º", "6º"],
        correct: "12º",
      },
      {
        id: "coro",
        type: "choice",
        prompt: "¿Cuál fue la primera obra que canté en el coro de exalumnos?",
        options: ["Northern Lights", "Cantate Domino", "Guayaboso"],
        correct: "Northern Lights",
      },
      {
        id: "tigres_pumas",
        type: "choice",
        prompt: "¿Prefiero los tigres o los pumas?",
        options: ["Tigres", "Pumas", "Yaguaretés"],
        correct: "Yaguaretés",
      },
      {
        id: "ventanas",
        type: "choice",
        prompt: "¿Cuántas ventanas tiene mi casa?",
        options: ["11", "15", "7"],
        correct: "11",
      },
      {
        id: "estacion",
        type: "choice",
        prompt: "¿Cuál es mi estación favorita del año?",
        options: ["Primavera", "Verano", "Otoño"],
        correct: "Primavera",
      },
      {
        id: "transporte",
        type: "choice",
        prompt: "¿Cuál es mi medio de transporte favorito?",
        options: ["Bondi", "Didi moto", "Subte"],
        correct: "Bondi",
      },
      {
        id: "autos",
        type: "choice",
        prompt: "Me gustan los autos.",
        options: ["Verdadero", "Falso"],
        correct: "Falso",
      },
      {
        id: "quijote",
        type: "choice",
        prompt: "Leí el Quijote a los 10 años.",
        options: ["Verdadero", "Falso"],
        correct: "Falso",
      },
    ],
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

// Convierte lo que se va tipeando en un campo de fecha (solo
// números) al formato dd/mm, igual que un campo de vencimiento de
// tarjeta: "2808" -> "28/08".
function formatDDMM(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// Intercala las preguntas de las dos encuestas (una de cada
// cumpleañera por turno) en vez de mostrar una encuesta entera
// seguida de la otra. Quién arranca se sortea una sola vez; si una
// lista es más larga que la otra, al final sigue solo con las que
// quedan.
function buildSequence(order) {
  const [firstId, secondId] = order;
  const firstQs = SURVEYS[firstId].questions.map((q) => ({ ...q, owner: firstId }));
  const secondQs = SURVEYS[secondId].questions.map((q) => ({ ...q, owner: secondId }));
  const sequence = [];
  const maxLen = Math.max(firstQs.length, secondQs.length);
  for (let i = 0; i < maxLen; i++) {
    if (firstQs[i]) sequence.push(firstQs[i]);
    if (secondQs[i]) sequence.push(secondQs[i]);
  }
  return sequence;
}

const state = {
  screen: "reception", // reception | question | thanks
  order: shuffle(["meli", "male"]), // quién arranca
  sequence: [],
  index: 0,
  name: "",
  guesses: { meli: 50, male: 50 },
  answers: { meli: {}, male: {} },
  scores: { meli: 0, male: 0 }, // se calculan al terminar, ver computeScores()
  optionOrderCache: {}, // `${surveyId}-${questionId}` -> string[]
};
state.sequence = buildSequence(state.order);

function shuffledOptionsFor(question) {
  const key = `${question.owner}-${question.id}`;
  if (!state.optionOrderCache[key]) {
    state.optionOrderCache[key] = shuffle(question.options);
  }
  return state.optionOrderCache[key];
}

// Compara cada respuesta guardada contra `correct` y cuenta los
// aciertos por encuesta. Se llama una sola vez, al terminar.
function computeScores() {
  ["meli", "male"].forEach((surveyId) => {
    const survey = SURVEYS[surveyId];
    let correct = 0;
    survey.questions.forEach((q) => {
      const given = state.answers[surveyId][q.id];
      if (given && given.trim().toLowerCase() === q.correct.trim().toLowerCase()) {
        correct += 1;
      }
    });
    state.scores[surveyId] = correct;
  });
}

// ---------------------------------------------------------------
// Navegación
// ---------------------------------------------------------------
function goNext() {
  if (state.index < state.sequence.length - 1) {
    state.index += 1;
    render();
  } else {
    computeScores();
    state.screen = "thanks";
    submitResults();
    render();
  }
}

function goBack() {
  if (state.index > 0) {
    state.index -= 1;
    render();
  }
}

function startSurveys() {
  state.screen = "question";
  render();
}

// ---------------------------------------------------------------
// Envío a Supabase
// ---------------------------------------------------------------
async function submitResults() {
  const payload = {
    nombre: state.name,
    orden_encuestas: state.order,
    puntaje_esperado_meli: state.guesses.meli,
    puntaje_esperado_male: state.guesses.male,
    puntaje_meli: state.scores.meli,
    puntaje_male: state.scores.male,
    puntaje_total: state.scores.meli + state.scores.male,
    total_preguntas_meli: SURVEYS.meli.questions.length,
    total_preguntas_male: SURVEYS.male.questions.length,
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
      <h1 class="headline"> QUIZ ¿Qué tanto <em>conocés</em> a las cumpleañeras?</h1>
      <p class="subtext"> ¿Qué puntaje esperás sacar en cada encuesta?</p>

      <input class="text-input" type="text" id="name-input" placeholder="Tu nombre" value="${state.name}" style="margin-top: 24px;" />

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

  const nameInput = document.getElementById("name-input");
  const startBtn = document.getElementById("start-btn");
  const syncStartBtn = () => {
    startBtn.disabled = !nameInput.value.trim();
  };
  nameInput.addEventListener("input", () => {
    state.name = nameInput.value.trim();
    syncStartBtn();
  });
  syncStartBtn();

  startBtn.addEventListener("click", startSurveys);
}

function blobSvg() {
  return `<svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M40 90 C 20 40, 90 10, 150 25 C 220 42, 230 5, 300 15 C 360 24, 385 70, 350 105 C 310 145, 220 140, 160 130 C 90 118, 55 130, 40 90 Z" fill="var(--meli-soft)"/>
    <path d="M120 110 C 100 70, 160 55, 210 65 C 270 77, 290 45, 330 60 C 365 73, 370 105, 340 120 C 300 140, 240 132, 190 125 C 150 119, 135 138, 120 110 Z" fill="var(--male-soft)" opacity="0.85"/>
  </svg>`;
}

// ---------------------------------------------------------------
// Render: encabezado de encuesta (foto + nombre + progreso)
//
// `survey` es la encuesta dueña de la pregunta actual (question.owner),
// así que la foto y el nombre cambian solos a medida que se alternan
// las preguntas de Meli y de Male.
// ---------------------------------------------------------------
function surveyHeaderHtml(survey) {
  const dots = state.sequence
    .map((_, i) => {
      const cls = i < state.index ? "is-done" : i === state.index ? "is-current" : "";
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
  const question = state.sequence[state.index];
  const survey = SURVEYS[question.owner];
  const saved = state.answers[survey.id][question.id];
  const app = document.getElementById("app");

  document.documentElement.style.setProperty("--accent", `var(--${survey.id})`);
  document.documentElement.style.setProperty("--accent-dark", `var(--${survey.id}-dark)`);
  document.documentElement.style.setProperty("--accent-soft", `var(--${survey.id}-soft)`);

  let bodyHtml = "";
  if (question.type === "choice") {
    const options = shuffledOptionsFor(question);
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
             placeholder="${question.placeholder || ""}" value="${saved || ""}"
             ${question.format === "ddmm" ? 'inputmode="numeric" maxlength="5"' : ""} />
    `;
  }

  const isLast = state.index === state.sequence.length - 1;

  app.innerHTML = `
    ${surveyHeaderHtml(survey)}
    <div class="question-wrap">
      <h2 class="question-text">${question.prompt}</h2>
      ${bodyHtml}
      <div class="btn-row">
        <button class="btn btn-ghost" id="back-btn" ${state.index === 0 ? "disabled style='visibility:hidden'" : ""}>Atrás</button>
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
      if (question.format === "ddmm") {
        input.value = formatDDMM(input.value);
      }
      state.answers[survey.id][question.id] = input.value.trim();
      enableIfReady(input.value.trim());
    });
  }

  document.getElementById("back-btn").addEventListener("click", goBack);
  nextBtn.addEventListener("click", goNext);
}

// ---------------------------------------------------------------
// Render: agradecimiento final
// ---------------------------------------------------------------
function renderThanks() {
  const app = document.getElementById("app");
  const totalMeli = SURVEYS.meli.questions.length;
  const totalMale = SURVEYS.male.questions.length;
  const totalAll = totalMeli + totalMale;

  const actualPct = {
    meli: totalMeli ? Math.round((state.scores.meli / totalMeli) * 100) : 0,
    male: totalMale ? Math.round((state.scores.male / totalMale) * 100) : 0,
    total: totalAll ? Math.round(((state.scores.meli + state.scores.male) / totalAll) * 100) : 0,
  };
  const expectedPct = {
    meli: state.guesses.meli,
    male: state.guesses.male,
    total: Math.round((state.guesses.meli + state.guesses.male) / 2),
  };

  const rows = [
    { key: "meli", label: "Meli", fraction: `${state.scores.meli}/${totalMeli}` },
    { key: "male", label: "Male", fraction: `${state.scores.male}/${totalMale}` },
    { key: "total", label: "Total", fraction: `${state.scores.meli + state.scores.male}/${totalAll}` },
  ];

  const rowsHtml = rows
    .map(
      (r) => `
    <div class="compare-row" data-who="${r.key}">
      <div class="compare-label">${r.label}</div>
      <div class="compare-values">
        <span>Esperabas ${expectedPct[r.key]}%</span>
        <span class="compare-actual">Sacaste ${actualPct[r.key]}% (${r.fraction})</span>
      </div>
    </div>`
    )
    .join("");

  app.innerHTML = `
    <div class="centered-screen">
      <div class="big-emoji-free-mark">✓</div>
      <h2 class="headline">Listo, gracias por jugar</h2>
      <div class="score-compare">${rowsHtml}</div>
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
  else if (state.screen === "thanks") renderThanks();
}

render();
