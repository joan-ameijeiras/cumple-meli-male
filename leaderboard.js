import { supabase } from "./supabase-client.js";

const CATEGORIES = {
  total: { label: "Total", column: "puntaje_total", accent: "gold" },
  meli: { label: "Meli", column: "puntaje_meli", accent: "meli" },
  male: { label: "Male", column: "puntaje_male", accent: "male" },
};

const state = {
  category: "total",
  rows: [],
  loading: true,
  errorMsg: "",
};

async function loadRanking() {
  if (!supabase) {
    state.loading = false;
    state.errorMsg = "Falta configurar Supabase en supabase-client.js.";
    render();
    return;
  }

  const { data, error } = await supabase
    .from("ranking")
    .select("*")
    .order("puntaje_total", { ascending: false });

  state.loading = false;
  if (error) {
    state.errorMsg = "No se pudo cargar el ranking. Probá recargar la página.";
    console.error("Error leyendo el ranking:", error);
  } else {
    state.rows = data || [];
  }
  render();
}

function totalsFor(rows) {
  const totalMeli = Math.max(0, ...rows.map((r) => r.total_preguntas_meli || 0));
  const totalMale = Math.max(0, ...rows.map((r) => r.total_preguntas_male || 0));
  return { meli: totalMeli, male: totalMale, total: totalMeli + totalMale };
}

function render() {
  const app = document.getElementById("app");

  if (state.loading) {
    app.innerHTML = `
      <div class="centered-screen">
        <p class="subtext">Cargando el ranking…</p>
      </div>
    `;
    return;
  }

  if (state.errorMsg) {
    app.innerHTML = `
      <div class="centered-screen">
        <h2 class="headline">No se pudo cargar</h2>
        <p class="subtext">${state.errorMsg}</p>
      </div>
    `;
    return;
  }

  const cat = CATEGORIES[state.category];
  document.documentElement.style.setProperty(
    "--accent",
    cat.accent === "gold" ? "var(--gold)" : `var(--${cat.accent})`
  );
  document.documentElement.style.setProperty(
    "--accent-dark",
    cat.accent === "gold" ? "var(--gold)" : `var(--${cat.accent}-dark)`
  );
  document.documentElement.style.setProperty(
    "--accent-soft",
    cat.accent === "gold" ? "var(--paper-dim)" : `var(--${cat.accent}-soft)`
  );

  const totals = totalsFor(state.rows);
  const denom = cat.column === "puntaje_meli" ? totals.meli : cat.column === "puntaje_male" ? totals.male : totals.total;

  const sorted = state.rows.slice().sort((a, b) => (b[cat.column] || 0) - (a[cat.column] || 0));

  const rowsHtml = sorted.length
    ? sorted
        .map(
          (row, i) => `
      <li class="rank-row">
        <span class="rank-number">${i + 1}</span>
        <span class="rank-name">${row.nombre || "Anónimo"}</span>
        <span class="rank-score">${row[cat.column] ?? 0}${denom ? ` / ${denom}` : ""}</span>
      </li>`
        )
        .join("")
    : `<li class="rank-row rank-empty">Todavía no hay respuestas.</li>`;

  app.innerHTML = `
    <div class="leaderboard">
      <h1 class="headline">Leaderboard</h1>
      <p class="subtext">Quién le achunta más a Meli, a Male, y quién gana en total.</p>

      <div class="tabs" role="tablist">
        ${Object.entries(CATEGORIES)
          .map(
            ([key, c]) => `
          <button class="tab ${key === state.category ? "is-active" : ""}" data-cat="${key}" role="tab">
            ${c.label}
          </button>`
          )
          .join("")}
      </div>

      <ol class="rank-list">${rowsHtml}</ol>
    </div>
  `;

  app.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.category = btn.dataset.cat;
      render();
    });
  });
}

render();
loadRanking();
