const DOM = {
  tempoSemRestart: document.getElementById('tempoSemRestart'),
  recordTempoSemRestart: document.getElementById('recordTempoSemRestart'),
  ultimoRestart: document.getElementById('ultimoRestart'),
  restartsHoje: document.getElementById('restartsHoje'),
  recordRestarts: document.getElementById('recordRestarts'),
  ultimoOutage: document.getElementById('ultimoOutage'),
};

const STORAGE_KEY = 'dashboard_app';

function getStoredData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) return JSON.parse(data);

  return {
    ultimoRestartTimestamp: new Date().toISOString(),
    recordTempoSemRestartHoras: 0,
    restartLog: [], // lista de timestamps
    recordRestartsDia: 0,
    ultimoOutageTexto: 'Nenhum registrado.',
  };
}

function salvarDados(dados) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

function calcularTempoDesde(ultimoRestart) {
  const now = new Date();
  const last = new Date(ultimoRestart);
  const diffMs = now - last;

  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return { texto: `${horas}h ${minutos}min`, horasTotais: horas };
}

function formatarData(timestampISO) {
  const dt = new Date(timestampISO);
  return dt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calcularRestartsHoje(restartLog) {
  const hoje = new Date();
  return restartLog.filter(ts => {
    const data = new Date(ts);
    return (
      data.getDate() === hoje.getDate() &&
      data.getMonth() === hoje.getMonth() &&
      data.getFullYear() === hoje.getFullYear()
    );
  }).length;
}

function atualizarDashboard() {
  const dados = getStoredData();

  const { texto, horasTotais } = calcularTempoDesde(dados.ultimoRestartTimestamp);

  const restartsHoje = calcularRestartsHoje(dados.restartLog);

  // Atualiza recorde de tempo sem restart
  if (horasTotais > dados.recordTempoSemRestartHoras) {
    dados.recordTempoSemRestartHoras = horasTotais;
  }

  // Atualiza recorde de restarts no mesmo dia
  if (restartsHoje > dados.recordRestartsDia) {
    dados.recordRestartsDia = restartsHoje;
  }

  // Atualiza DOM
  DOM.tempoSemRestart.textContent = texto;
  DOM.recordTempoSemRestart.textContent = `${dados.recordTempoSemRestartHoras}h`;
  DOM.ultimoRestart.textContent = formatarData(dados.ultimoRestartTimestamp);
  DOM.restartsHoje.textContent = restartsHoje;
  DOM.recordRestarts.textContent = dados.recordRestartsDia;
  DOM.ultimoOutage.textContent = dados.ultimoOutageTexto;

  // Salva
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

// Evento de clique
document.getElementById('registrarRestart').addEventListener('click', registrarNovoRestart);

// Inicializar
atualizarDashboard();
