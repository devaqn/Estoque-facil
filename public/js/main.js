import { renderDashboard } from './views/dashboard.js';
import { renderProdutos } from './views/produtos.js';
import { renderEstoque } from './views/estoque.js';
import { renderVendas } from './views/vendas.js';
import { renderFornecedores } from './views/fornecedores.js';
import { checkLicenseAndRender } from './license.js';
import { toast } from './ui.js';

const routes = {
  dashboard: { title: 'Início', render: renderDashboard },
  produtos: { title: 'Produtos', render: renderProdutos },
  estoque: { title: 'Entrada de mercadoria', render: renderEstoque },
  vendas: { title: 'Vendas', render: renderVendas },
  fornecedores: { title: 'Fornecedores', render: renderFornecedores },
};

const viewEl = document.getElementById('view');
const titleEl = document.getElementById('page-title');
const actionsEl = document.getElementById('page-actions');

function setActions(html) {
  actionsEl.innerHTML = html;
}

async function router() {
  const hash = window.location.hash.replace('#/', '') || 'dashboard';
  const route = routes[hash] || routes.dashboard;

  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.route === hash);
  });

  titleEl.textContent = route.title;

  try {
    await route.render(viewEl, setActions);
  } catch (err) {
    console.error(err);
    viewEl.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span>Não foi possível carregar esta tela.</div>`;
    toast('Erro ao carregar dados. Verifique se o servidor está rodando.', 'error');
  }
}

async function bootstrap() {
  const ativado = await checkLicenseAndRender();
  if (!ativado) return;
  router();
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', bootstrap);

document.addEventListener('focusin', (e) => {
  if (e.target.matches('input[type="number"]')) {
    e.target.select();
  }
});
