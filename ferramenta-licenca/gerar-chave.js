// Ferramenta PRIVADA para gerar chaves de ativação para clientes.
// NUNCA envie esta pasta (ferramenta-licenca/) para quem compra o sistema —
// ela usa o mesmo segredo que valida as chaves, então quem tiver este
// arquivo consegue gerar chaves para qualquer computador.
const { buildLicenseKey } = require('../server/license');

const codigos = process.argv.slice(2);

if (codigos.length === 0 || codigos.length > 2) {
  console.log('Uso: node gerar-chave.js "CODIGO-DA-MAQUINA-1" ["CODIGO-DA-MAQUINA-2"]');
  console.log('O(s) código(s) aparece(m) na tela de ativação do cliente.');
  process.exit(1);
}

const chave = buildLicenseKey(codigos);

console.log('');
console.log('Computador(es) autorizado(s):', codigos.join(', '));
console.log('Chave de ativação:');
console.log(chave);
console.log('');
