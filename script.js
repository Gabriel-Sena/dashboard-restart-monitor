// Mapeia os elementos HTML que vamos atualizar
const DOM = {
  tempoSemRestart: document.getElementById('tempoSemRestart'),
  recordTempoSemRestart: document.getElementById('recordTempoSemRestart'),
  ultimoRestart: document.getElementById('ultimoRestart'),
  restartsHoje: document.getElementById('restartsHoje'),
  recordRestarts: document.getElementById('recordRestarts'),
  ultimoOutage: document.getElementById('ultimoOutage'),
};

// Nome da chave para salvar os dados no localStorage
const STORAGE_KEY = 'dashboard_app';

// Função que carrega os dados do localStorage ou inicializa com valores padrão
function getStoredData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return {
      ultimoRestartTimestamp: new Date().toISOString(),
      recordTempoSemRestartHoras: 0,
      restartLog: [],
      recordRestartsDia: 0,
      ultimoOutageTexto: 'Nenhum registrado.',
      outageLog: [], // novo campo
    };
  }

  // Dados já existem, mas podem estar incompletos
  const parsed = JSON.parse(data);

  // Preenche campos faltantes se necessário
  if (!parsed.outageLog) {
    parsed.outageLog = [];
  }

  return parsed;
}


// Salva os dados no localStorage
function salvarDados(dados) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

// Calcula o tempo (em horas e minutos) desde o último restart
function calcularTempoDesde(timestampISO) {
  const now = new Date();
  const last = new Date(timestampISO);
  const diffMs = now - last;

  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return { texto: `${horas}h ${minutos}min`, horasTotais: horas };
}

// Formata uma data ISO para o formato dd/mm hh:mm
function formatarData(timestampISO) {
  const dt = new Date(timestampISO);
  return dt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Conta quantos restarts foram realizados hoje
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

// Renderiza o histórico de outages no painel inferior
function renderizarHistoricoOutages(logs) {
  const container = document.getElementById('historicoOutages');
  container.innerHTML = '';

  if (!logs || logs.length === 0) {
    container.innerHTML = '<p class="empty">Nenhum outage registrado.</p>';
    return;
  }

  // Exibe do mais recente para o mais antigo
  logs.slice().reverse().forEach(outage => {
    const item = document.createElement('div');
    item.className = 'outage-item';
    item.innerHTML = `
      <strong>${new Date(outage.data).toLocaleString('pt-BR')}</strong><br />
      <span>${outage.descricao}</span>
    `;
    container.appendChild(item);
  });
}

// Atualiza todos os elementos do dashboard
function atualizarDashboard() {
  const dados = getStoredData();

  const { texto, horasTotais } = calcularTempoDesde(dados.ultimoRestartTimestamp);
  const restartsHoje = calcularRestartsHoje(dados.restartLog);

  // Atualiza recorde de tempo sem restart, se aplicável
  if (horasTotais > dados.recordTempoSemRestartHoras) {
    dados.recordTempoSemRestartHoras = horasTotais;
  }

  // Atualiza recorde de restarts no mesmo dia
  if (restartsHoje > dados.recordRestartsDia) {
    dados.recordRestartsDia = restartsHoje;
  }

  // Atualiza os valores exibidos na tela
  DOM.tempoSemRestart.textContent = texto;
  DOM.recordTempoSemRestart.textContent = `${dados.recordTempoSemRestartHoras}h`;
  DOM.ultimoRestart.textContent = formatarData(dados.ultimoRestartTimestamp);
  DOM.restartsHoje.textContent = restartsHoje;
  DOM.recordRestarts.textContent = dados.recordRestartsDia;
  DOM.ultimoOutage.textContent = dados.ultimoOutageTexto;

  // Atualiza histórico de outages
  renderizarHistoricoOutages(dados.outageLog);

  // Salva tudo novamente
  salvarDados(dados);
}

// Registra um novo restart com o timestamp atual
function registrarNovoRestart() {
  const dados = getStoredData();
  const now = new Date().toISOString();

  dados.ultimoRestartTimestamp = now;
  dados.restartLog.push(now);

  salvarDados(dados);
  atualizarDashboard();
}

// Abre ou fecha os modais (popup)
function toggleModal(id, show = true) {
  const modal = document.getElementById(id);
  if (show) modal.classList.remove('hidden');
  else modal.classList.add('hidden');
}

// EVENTOS

// Botão: registrar restart automaticamente (agora)
document.getElementById('registrarRestart').addEventListener('click', registrarNovoRestart);

// Botões: abrir modais
document.getElementById('abrirRestartManual').addEventListener('click', () => toggleModal('modalRestartManual'));
document.getElementById('abrirOutage').addEventListener('click', () => toggleModal('modalOutage'));

// Botões de fechar modais (ícones X)
document.querySelectorAll('.close').forEach(btn =>
  btn.addEventListener('click', () => toggleModal(btn.getAttribute('data-close'), false))
);

// Formulário: registrar outage manualmente
document.getElementById('formOutage').addEventListener('submit', (e) => {
  e.preventDefault();

  const input = document.getElementById('inputOutage').value.trim();
  if (!input) return;

  const dados = getStoredData();

  dados.ultimoOutageTexto = input;

  // Adiciona no histórico corretamente
  dados.outageLog.push({
    data: new Date().toISOString(),
    descricao: input,
  });

  salvarDados(dados);
  atualizarDashboard();
  e.target.reset();
  toggleModal('modalOutage', false);
  alert('Outage registrado com sucesso!');
});


// Formulário: registrar restart manualmente com dados informados
document.getElementById('formRestartManual').addEventListener('submit', (e) => {
  e.preventDefault();

  const recordTempo = parseInt(document.getElementById('inputRecordTempo').value, 10);
  const ultimoRestartInput = document.getElementById('inputUltimoRestart').value;
  const recordRestarts = parseInt(document.getElementById('inputRecordRestarts').value, 10);

  if (!ultimoRestartInput || isNaN(recordTempo) || isNaN(recordRestarts)) {
    alert('Preencha todos os campos corretamente.');
    return;
  }

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

// Inicializa o dashboard assim que a página carregar
atualizarDashboard();
