// Dados do dashboard (edite manualmente aqui)
const data = {
  restartsHoje: 3,
  maxRestarts: 7,
  tempoDesdeUltimo: '2h 43min',
};

// Preenche os valores no DOM
document.getElementById('restartsHoje').textContent = data.restartsHoje;
document.getElementById('maxRestarts').textContent = data.maxRestarts;
document.getElementById('tempoUltimo').textContent = data.tempoDesdeUltimo;
