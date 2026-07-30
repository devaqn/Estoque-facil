const express = require('express');
const path = require('node:path');

require('./db');
const license = require('./license');

const produtosRouter = require('./routes/produtos');
const fornecedoresRouter = require('./routes/fornecedores');
const entradasRouter = require('./routes/entradas');
const vendasRouter = require('./routes/vendas');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/license/status', (req, res) => {
  res.json({ ativado: license.isActivated(), codigoMaquina: license.getMachineCode() });
});

app.post('/api/license/ativar', (req, res) => {
  const { chave } = req.body;
  if (!chave) return res.status(400).json({ erro: 'Informe a chave de ativação' });
  const resultado = license.activate(chave);
  if (!resultado.valid) return res.status(400).json({ erro: resultado.motivo });
  res.json({ ativado: true });
});

function requireLicense(req, res, next) {
  if (license.isActivated()) return next();
  res.status(403).json({ erro: 'Sistema não ativado' });
}

app.use('/api/produtos', requireLicense, produtosRouter);
app.use('/api/fornecedores', requireLicense, fornecedoresRouter);
app.use('/api/entradas', requireLicense, entradasRouter);
app.use('/api/vendas', requireLicense, vendasRouter);
app.use('/api/dashboard', requireLicense, dashboardRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`SERVER_READY http://localhost:${PORT}`);
});
