const DOM = {
  tempoSemRestart: document.getElementById("tempoSemRestart"),
  recordTempoSemRestart: document.getElementById("recordTempoSemRestart"),
  ultimoRestart: document.getElementById("ultimoRestart"),
  restartsHoje: document.getElementById("restartsHoje"),
  recordRestarts: document.getElementById("recordRestarts"),
  ultimoOutage: document.getElementById("ultimoOutage"),
};

const STORAGE_KEY = "dashboard_app";

// Garante que todos os campos existem (mesmo após atualizações)
function getStoredData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return {
      ultimoRestartTimestamp: new Date().toISOString(),
      recordTempoSemRestartHoras: 0,
      restartLog: [],
      recordRestartsDia: 0,
      ultimoOutageTexto: "Nenhum registrado.",
      outageLog: [],
    };
  }

  const parsed = JSON.parse(data);
  if (!parsed.outageLog) parsed.outageLog = [];
  return parsed;
}

function salvarDados(dados) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

// Formata tempo de forma adaptativa
function formatarTempo(horasTotais, minutos = 0) {
  if (horasTotais < 168) {
    return `${horasTotais}h ${minutos}min`;
  }

  const dias = Math.floor(horasTotais / 24);
  const horasRestantes = horasTotais % 24;

  if (dias < 40) {
    return `${dias} dias ${horasRestantes}h`;
  }

  const meses = Math.floor(dias / 30);
  const diasRestantes = dias % 30;
  return `${meses} ${meses === 1 ? "mês" : "meses"} ${diasRestantes} dias`;
}

function calcularTempoDesde(timestampISO) {
  const now = new Date();
  const last = new Date(timestampISO);
  const diffMs = now - last;

  const totalHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const totalMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    texto: formatarTempo(totalHoras, totalMinutos),
    horasTotais: totalHoras,
  };
}

function formatarData(timestampISO) {
  const dt = new Date(timestampISO);
  return dt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcularRestartsHoje(restartLog) {
  const hoje = new Date();
  return restartLog.filter((ts) => {
    const data = new Date(ts);
    return (
      data.getDate() === hoje.getDate() &&
      data.getMonth() === hoje.getMonth() &&
      data.getFullYear() === hoje.getFullYear()
    );
  }).length;
}

function renderizarHistoricoOutages(logs) {
  const container = document.getElementById("historicoOutages");
  container.innerHTML = "";

  if (!logs || logs.length === 0) {
    container.innerHTML = '<p class="empty">Nenhum outage registrado.</p>';
    return;
  }

  // Ordenar por data DESC (mais recente primeiro)
  const ordenados = logs
    .slice()
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  ordenados.forEach((outage) => {
    const item = document.createElement("div");
    item.className = "outage-item";
    item.innerHTML = `
      <strong>${new Date(outage.data).toLocaleDateString(
        "pt-BR"
      )}</strong><br />
      <span>${outage.descricao}</span>
    `;
    container.appendChild(item);
  });
}

function atualizarDashboard() {
  const dados = getStoredData();

  const { texto, horasTotais } = calcularTempoDesde(
    dados.ultimoRestartTimestamp
  );
  const restartsHoje = calcularRestartsHoje(dados.restartLog);

  if (horasTotais > dados.recordTempoSemRestartHoras) {
    dados.recordTempoSemRestartHoras = horasTotais;
  }

  if (restartsHoje > dados.recordRestartsDia) {
    dados.recordRestartsDia = restartsHoje;
  }

  DOM.tempoSemRestart.textContent = texto;
  DOM.recordTempoSemRestart.textContent = formatarTempo(
    dados.recordTempoSemRestartHoras
  );
  DOM.ultimoRestart.textContent = formatarData(dados.ultimoRestartTimestamp);
  DOM.restartsHoje.textContent = restartsHoje;
  DOM.recordRestarts.textContent = dados.recordRestartsDia;
  DOM.ultimoOutage.textContent = dados.ultimoOutageTexto;

  renderizarHistoricoOutages(dados.outageLog);

  salvarDados(dados);
}

function registrarNovoRestart() {
  const dados = getStoredData();
  const now = new Date().toISOString();

  dados.ultimoRestartTimestamp = now;
  dados.restartLog.push(now);

  salvarDados(dados);
  atualizarDashboard();
}

function toggleModal(id, show = true) {
  const modal = document.getElementById(id);
  if (show) modal.classList.remove("hidden");
  else modal.classList.add("hidden");
}

// Eventos
document
  .getElementById("registrarRestart")
  .addEventListener("click", registrarNovoRestart);
document
  .getElementById("abrirRestartManual")
  .addEventListener("click", () => toggleModal("modalRestartManual"));
document
  .getElementById("abrirOutage")
  .addEventListener("click", () => toggleModal("modalOutage"));
document
  .querySelectorAll(".close")
  .forEach((btn) =>
    btn.addEventListener("click", () =>
      toggleModal(btn.getAttribute("data-close"), false)
    )
  );

// Formulário: Outage
document.getElementById("formOutage").addEventListener("submit", (e) => {
  e.preventDefault();

  const inputDescricao = document.getElementById("inputOutage").value.trim();
  const inputData = document.getElementById("inputOutageDate").value;

  if (!inputDescricao || !inputData) {
    alert("Preencha todos os campos.");
    return;
  }

  const dados = getStoredData();

  // Atualiza campo principal com o texto
  dados.ultimoOutageTexto = inputDescricao;

  // Adiciona ao histórico com data fornecida pelo usuário
  dados.outageLog.push({
    data: inputData,
    descricao: inputDescricao,
  });

  salvarDados(dados);
  atualizarDashboard();
  e.target.reset();
  toggleModal("modalOutage", false);
  alert("Outage registrado com sucesso!");
});

// Formulário: Restart manual
document.getElementById("formRestartManual").addEventListener("submit", (e) => {
  e.preventDefault();

  // Pega o valor informado em dias e converte
  const recordDias = parseInt(
    document.getElementById("inputRecordTempo").value,
    10
  );
  const ultimoRestartInput =
    document.getElementById("inputUltimoRestart").value;
  const recordRestarts = parseInt(
    document.getElementById("inputRecordRestarts").value,
    10
  );

  if (!ultimoRestartInput || isNaN(recordDias) || isNaN(recordRestarts)) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  // Converte dias para horas
  const recordHoras = recordDias * 24;

  const dados = getStoredData();
  dados.ultimoRestartTimestamp = new Date(ultimoRestartInput).toISOString();
  dados.restartLog.push(dados.ultimoRestartTimestamp);
  
  // Atualiza recorde de tempo somente se for maior
  if (recordHoras > dados.recordTempoSemRestartHoras) {
    dados.recordTempoSemRestartHoras = recordHoras;
  }

  // Só atualiza se for maior que o atual
  if (recordRestarts > dados.recordRestartsDia) {
    dados.recordRestartsDia = recordRestarts;
  }

  salvarDados(dados);
  atualizarDashboard();
  e.target.reset();
  toggleModal("modalRestartManual", false);
  alert("Restart manual registrado com sucesso!");
});

// Inicialização
atualizarDashboard();
