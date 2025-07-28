// Mapeia os elementos do DOM (HTML) que serão atualizados dinamicamente
const DOM = {
  tempoSemRestart: document.getElementById('tempoSemRestart'),
  recordTempoSemRestart: document.getElementById('recordTempoSemRestart'),
  ultimoRestart: document.getElementById('ultimoRestart'),
  restartsHoje: document.getElementById('restartsHoje'),
  recordRestarts: document.getElementById('recordRestarts'),
  ultimoOutage: document.getElementById('ultimoOutage'),
};

const STORAGE_KEY = 'dashboard_app'; // chave usada para armazenar os dados no localStorage

// Recupera os dados do localStorage ou inicializa com valores padrão
function getStoredData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) return JSON.parse(data);

  // Valores padrão se não existir nada salvo ainda
  return {
    ultimoRestartTimestamp: new Date().toISOString(), // timestamp atual
    recordTempoSemRestartHoras: 0,
    restartLog: [], // lista de timestamps de restarts
    recordRestartsDia: 0,
    ultimoOutageTexto: 'Nenhum registrado.',
  };
}

// Salva os dados no localStorage como string JSON
function salvarDados(dados) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

// Calcula tempo (horas e minutos) desde o último restart
function calcularTempoDesde(timestampISO) {
  const now = new Date();
  const last = new Date(timestampISO);
  const diffMs = now - last;

  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return { texto: `${horas}h ${minutos}min`, horasTotais: horas };
}

// Formata a data no formato "dd/mm hh:mm" para exibição
function formatarData(timestampISO) {
  const dt = new Date(timestampISO);
  return dt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Conta quantos restarts ocorreram hoje com base na lista de logs
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

// Atualiza os valores do dashboard com base nos dados atuais
function atualizarDashboard() {
  const dados = getStoredData();

  // Cálculo do tempo desde o último restart
  const { texto, horasTotais } = calcularTempoDesde(dados.ultimoRestartTimestamp);

  // Quantidade de restarts realizados hoje
  const restartsHoje = calcularRestartsHoje(dados.restartLog);

  // Atualiza o recorde de tempo sem restart, se for maior que o anterior
  if (horasTotais > dados.recordTempoSemRestartHoras) {
    dados.recordTempoSemRestartHoras = horasTotais;
  }

  // Atualiza o recorde de restarts no mesmo dia, se for maior
  if (restartsHoje > dados.recordRestartsDia) {
    dados.recordRestartsDia = restartsHoje;
  }

  // Atualiza os elementos da interface com os valores atuais
  DOM.tempoSemRestart.textContent = texto;
  DOM.recordTempoSemRestart.textContent = `${dados.recordTempoSemRestartHoras}h`;
  DOM.ultimoRestart.textContent = formatarData(dados.ultimoRestartTimestamp);
  DOM.restartsHoje.textContent = restartsHoje;
  DOM.recordRestarts.textContent = dados.recordRestartsDia;
  DOM.ultimoOutage.textContent = dados.ultimoOutageTexto;

  // Salva novamente os dados atualizados
  salvarDados(dados);
}

// Função para registrar um novo restart com o timestamp atual
function registrarNovoRestart() {
  const dados = getStoredData();

  const now = new Date().toISOString();
  dados.ultimoRestartTimestamp = now;
  dados.restartLog.push(now); // adiciona o novo restart no log

  salvarDados(dados);
  atualizarDashboard();
}

// Exibe ou esconde modais (popups)
function toggleModal(id, show = true) {
  const modal = document.getElementById(id);
  if (show) modal.classList.remove('hidden');
  else modal.classList.add('hidden');
}

// Evento: botão para registrar restart automaticamente (timestamp atual)
document.getElementById('registrarRestart').addEventListener('click', registrarNovoRestart);

// Evento: abrir modal de restart manual
document.getElementById('abrirRestartManual').addEventListener('click', () => toggleModal('modalRestartManual'));

// Evento: abrir modal de outage
document.getElementById('abrirOutage').addEventListener('click', () => toggleModal('modalOutage'));

// Evento: fechar modais ao clicar no "X"
document.querySelectorAll('.close').forEach(btn =>
  btn.addEventListener('click', () => toggleModal(btn.getAttribute('data-close'), false))
);

// Evento: formulário de outage (salva texto no localStorage)
document.getElementById('formOutage').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('inputOutage').value.trim();

  if (input) {
    const dados = getStoredData();
    dados.ultimoOutageTexto = input;
    salvarDados(dados);
    atualizarDashboard();
    e.target.reset(); // limpa o formulário
    toggleModal('modalOutage', false);
    alert('Outage registrado com sucesso!');
  }
});

// Evento: formulário de restart manual (preenche dados específicos)
document.getElementById('formRestartManual').addEventListener('submit', (e) => {
  e.preventDefault();

  // Captura os valores dos inputs
  const recordTempo = parseInt(document.getElementById('inputRecordTempo').value, 10);
  const ultimoRestartInput = document.getElementById('inputUltimoRestart').value;
  const recordRestarts = parseInt(document.getElementById('inputRecordRestarts').value, 10);

  // Validação simples
  if (!ultimoRestartInput || isNaN(recordTempo) || isNaN(recordRestarts)) {
    alert('Preencha todos os campos corretamente.');
    return;
  }

  // Atualiza os dados salvos
  const dados = getStoredData();
  dados.recordTempoSemRestartHoras = recordTempo;
  dados.ultimoRestartTimestamp = new Date(ultimoRestartInput).toISOString();
  dados.restartLog.push(dados.ultimoRestartTimestamp);
  dados.recordRestartsDia = recordRestarts;

  salvarDados(dados);
  atualizarDashboard();
  e.target.reset();
  toggleModal('modalRestartManual', false);
  alert('Restart manual registrado com sucesso!');
});

// Inicializa o dashboard ao carregar a página
atualizarDashboard();
