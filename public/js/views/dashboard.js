import { api } from '../api.js';
import { formatMoney, formatNumber, escapeHtml } from '../ui.js';

export async function renderDashboard(container, setActions) {
  setActions('');
  container.innerHTML = `<div class="empty-state">Carregando...</div>`;

  const resumo = await api.dashboard.resumo();

  const baixoRows = resumo.produtosEstoqueBaixo
    .map(
      (p) => `
      <tr>
        <td>${escapeHtml(p.nome)}</td>
        <td class="text-right">${formatNumber(p.quantidade)} ${escapeHtml(p.unidade)}</td>
        <td class="text-right">${formatNumber(p.estoque_minimo)} ${escapeHtml(p.unidade)}</td>
      </tr>`
    )
    .join('');

  const maisVendidosRows = resumo.maisVendidos
    .map(
      (p) => `
      <tr>
        <td>${escapeHtml(p.nome)}</td>
        <td class="text-right">${formatNumber(p.total_vendido)} ${escapeHtml(p.unidade)}</td>
      </tr>`
    )
    .join('');

  container.innerHTML = `
    <div class="cards-grid">
      <div class="stat-card">
        <div class="stat-label">🏷️ Produtos cadastrados</div>
        <div class="stat-value">${resumo.totalProdutos}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">💰 Valor em estoque (custo)</div>
        <div class="stat-value">${formatMoney(resumo.valorTotalEstoque)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🧾 Vendas hoje</div>
        <div class="stat-value">${formatMoney(resumo.vendasHoje.total)}</div>
        <div class="hint">${resumo.vendasHoje.qtd} venda(s)</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">📅 Vendas no mês</div>
        <div class="stat-value">${formatMoney(resumo.vendasMes.total)}</div>
        <div class="hint">${resumo.vendasMes.qtd} venda(s)</div>
      </div>
      <div class="stat-card ${resumo.produtosEstoqueBaixo.length ? 'warn' : ''}">
        <div class="stat-label">⚠️ Estoque baixo</div>
        <div class="stat-value">${resumo.produtosEstoqueBaixo.length}</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">⚠️ Produtos com estoque baixo</div>
      <div class="panel-body" style="padding:0">
        ${
          resumo.produtosEstoqueBaixo.length
            ? `<table>
                <thead><tr><th>Produto</th><th class="text-right">Estoque atual</th><th class="text-right">Mínimo</th></tr></thead>
                <tbody>${baixoRows}</tbody>
              </table>`
            : `<div class="empty-state"><span class="empty-icon">✅</span>Nenhum produto com estoque baixo</div>`
        }
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">🔥 Mais vendidos no mês</div>
      <div class="panel-body" style="padding:0">
        ${
          resumo.maisVendidos.length
            ? `<table>
                <thead><tr><th>Produto</th><th class="text-right">Quantidade vendida</th></tr></thead>
                <tbody>${maisVendidosRows}</tbody>
              </table>`
            : `<div class="empty-state"><span class="empty-icon">🧾</span>Nenhuma venda registrada este mês</div>`
        }
      </div>
    </div>
  `;
}
