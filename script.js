// Dados do dashboard (edite manualmente aqui)
const data = {
  ultimoRestartTimestamp: '2025-05-28T07:15:00', // formato ISO
  recordTempoSemRestartHoras: 72,
  restartsHoje: 3,
  recordRestartsDia: 7,
  ultimoOutageTexto: 'Timeout na API de autenticação em 26/05 às 14:12',
};

// Função para calcular tempo desde o último restart
function tempoDesde(timestampISO) {
  const now = new Date();
  const last = new Date(timestampISO);
  const diffMs = now - last;

  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${horas}h ${minutos}min`;
}

// Preencher os campos no DOM
document.getElementById('tempoSemRestart').textContent = tempoDesde(data.ultimoRestartTimestamp);
document.getElementById('recordTempoSemRestart').textContent = `${data.recordTempoSemRestartHoras}h`;
document.getElementById('ultimoRestart').textContent = new Date(data.ultimoRestartTimestamp).toLocaleString('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});
document.getElementById('restartsHoje').textContent = data.restartsHoje;
document.getElementById('recordRestarts').textContent = data.recordRestartsDia;
document.getElementById('ultimoOutage').textContent = data.ultimoOutageTexto;
