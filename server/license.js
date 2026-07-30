const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execSync } = require('node:child_process');
const { SECRET } = require('./license-secret');

const LICENSE_FILE = path.join(__dirname, '..', 'data', 'license.key');

function readWindowsMachineGuid() {
  const output = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', {
    encoding: 'utf8',
    windowsHide: true,
  });
  const match = output.match(/MachineGuid\s+REG_SZ\s+([0-9a-fA-F-]+)/);
  if (!match) throw new Error('MachineGuid não encontrado');
  return match[1];
}

// O GUID fica gravado no Windows (não dentro da pasta do programa), então copiar
// a pasta para outro computador não copia esse identificador junto.
function getRawMachineId() {
  try {
    return readWindowsMachineGuid();
  } catch {
    return `${os.hostname()}-${os.cpus()[0]?.model || ''}-${os.totalmem()}`;
  }
}

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 16).toUpperCase();
}

function normalizeCode(code) {
  return (code || '').replace(/[\s-]/g, '').toUpperCase();
}

function formatCode(hex) {
  return hex.match(/.{1,4}/g).join('-').toUpperCase();
}

function getMachineCode() {
  const raw = getRawMachineId();
  const hash = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
  return formatCode(hash.slice(0, 16));
}

function buildLicenseKey(codes) {
  const payload = codes.map(normalizeCode).sort().join(',');
  const token = Buffer.from(payload, 'utf8').toString('base64url');
  return `${token}.${sign(payload)}`;
}

function verifyLicenseKey(key) {
  const [token, sig] = (key || '').trim().split('.');
  if (!token || !sig) {
    return { valid: false, motivo: 'Chave em formato inválido' };
  }

  let payload;
  try {
    payload = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    return { valid: false, motivo: 'Chave em formato inválido' };
  }

  if (sign(payload) !== sig.toUpperCase()) {
    return { valid: false, motivo: 'Chave inválida' };
  }

  const codigosAutorizados = payload.split(',');
  const meuCodigo = normalizeCode(getMachineCode());
  if (!codigosAutorizados.includes(meuCodigo)) {
    return { valid: false, motivo: 'Esta chave não é válida para este computador' };
  }

  return { valid: true };
}

function isActivated() {
  if (!fs.existsSync(LICENSE_FILE)) return false;
  return verifyLicenseKey(fs.readFileSync(LICENSE_FILE, 'utf8')).valid;
}

function activate(key) {
  const resultado = verifyLicenseKey(key);
  if (!resultado.valid) return resultado;
  fs.mkdirSync(path.dirname(LICENSE_FILE), { recursive: true });
  fs.writeFileSync(LICENSE_FILE, key.trim());
  return { valid: true };
}

module.exports = { getMachineCode, verifyLicenseKey, isActivated, activate, buildLicenseKey };
