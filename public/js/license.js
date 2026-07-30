import { api } from './api.js';
import { toast, escapeHtml } from './ui.js';

export async function checkLicenseAndRender() {
  const status = await api.license.status();
  const appEl = document.querySelector('.app');
  const screenEl = document.getElementById('activation-screen');

  if (status.ativado) {
    screenEl.style.display = 'none';
    appEl.style.display = 'flex';
    return true;
  }

  appEl.style.display = 'none';
  screenEl.style.display = 'flex';
  renderActivationScreen(screenEl, status.codigoMaquina);
  return false;
}

function renderActivationScreen(el, codigoMaquina) {
  el.innerHTML = `
    <div class="activation-card">
      <div class="brand" style="padding:0 0 16px">
        <span class="brand-icon">📦</span>
        <span class="brand-name">Estoque Fácil</span>
      </div>
      <h2 style="margin:0 0 8px">Ativação necessária</h2>
      <p class="text-muted" style="margin-top:0">
        Envie o código abaixo para quem te vendeu este sistema e cole a chave de ativação que você receber.
      </p>

      <div class="field">
        <label>Código deste computador</label>
        <div style="display:flex;gap:8px">
          <input class="input" id="codigo-maquina" readonly value="${escapeHtml(codigoMaquina)}" style="font-family:monospace;font-weight:600" />
          <button class="btn btn-secondary" id="btn-copiar" type="button">Copiar</button>
        </div>
      </div>

      <div class="field" style="margin-top:16px">
        <label>Chave de ativação</label>
        <input class="input" id="input-chave" placeholder="Cole aqui a chave recebida" />
      </div>

      <button class="btn btn-primary" id="btn-ativar" type="button" style="margin-top:18px;width:100%;justify-content:center">Ativar</button>
    </div>
  `;

  el.querySelector('#btn-copiar').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codigoMaquina);
      toast('Código copiado');
    } catch {
      toast('Não foi possível copiar automaticamente. Selecione o texto manualmente.', 'error');
    }
  });

  const ativar = async () => {
    const chave = el.querySelector('#input-chave').value.trim();
    if (!chave) return toast('Cole a chave de ativação', 'error');
    try {
      await api.license.ativar(chave);
      toast('Sistema ativado com sucesso!');
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  el.querySelector('#btn-ativar').addEventListener('click', ativar);
  el.querySelector('#input-chave').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ativar();
  });
}
