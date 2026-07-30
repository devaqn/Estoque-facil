export function formatMoney(v) {
  return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatNumber(v) {
  return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

export function formatDate(v) {
  if (!v) return '';
  const [datePart, timePart] = String(v).split(' ');
  const [y, m, d] = datePart.split('-');
  return `${d}/${m}/${y}${timePart ? ' ' + timePart.slice(0, 5) : ''}`;
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function toast(message, type = 'success') {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.2s ease';
    setTimeout(() => el.remove(), 200);
  }, 3200);
}

let modalStack = [];

export function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  modalStack = [];
}

export function openModal({ title, bodyHtml, footerHtml, wide = false, onMount }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal ${wide ? 'wide' : ''}">
        <div class="modal-header">
          <h2>${escapeHtml(title)}</h2>
          <button class="btn btn-icon" id="modal-close" type="button" aria-label="Fechar">✕</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    </div>
  `;

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  if (onMount) onMount(root);
}

export function confirmAction(message) {
  return new Promise((resolve) => {
    openModal({
      title: 'Confirmar',
      bodyHtml: `<p>${escapeHtml(message)}</p>`,
      footerHtml: `
        <button class="btn btn-secondary" id="confirm-no" type="button">Cancelar</button>
        <button class="btn btn-danger" id="confirm-yes" type="button">Confirmar</button>
      `,
      onMount: () => {
        document.getElementById('confirm-no').addEventListener('click', () => {
          closeModal();
          resolve(false);
        });
        document.getElementById('confirm-yes').addEventListener('click', () => {
          closeModal();
          resolve(true);
        });
      },
    });
  });
}
