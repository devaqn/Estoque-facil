import { api } from '../api.js';
import { formatMoney, formatNumber, formatDate, escapeHtml, toast, openModal, closeModal, confirmAction } from '../ui.js';

export async function renderVendas(container, setActions) {
  setActions(`<button class="btn btn-primary" id="btn-nova-venda">+ Nova venda</button>`);
  container.innerHTML = `<div class="empty-state">Carregando...</div>`;

  const vendas = await api.vendas.listar();

  container.innerHTML = `
    <div class="panel">
      <div class="panel-header">🧾 Histórico de vendas</div>
      <div class="panel-body" style="padding:0">
        ${
          vendas.length
            ? `<table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th class="text-right">Itens</th>
                    <th class="text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${vendas
                    .map(
                      (v) => `
                    <tr>
                      <td>${formatDate(v.data)}</td>
                      <td class="text-right">${v.total_itens}</td>
                      <td class="text-right">${formatMoney(v.total)}</td>
                      <td>
                        <div class="row-actions">
                          <button class="btn btn-icon btn-ver" data-id="${v.id}" title="Ver detalhes">👁️</button>
                          <button class="btn btn-icon btn-cancelar" data-id="${v.id}" title="Cancelar venda">🗑️</button>
                        </div>
                      </td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>`
            : `<div class="empty-state"><span class="empty-icon">🧾</span>Nenhuma venda registrada ainda</div>`
        }
      </div>
    </div>
  `;

  document.getElementById('btn-nova-venda').addEventListener('click', async () => {
    const produtos = await api.produtos.listar();
    abrirFormVenda(produtos, () => renderVendas(container, setActions));
  });

  container.querySelectorAll('.btn-ver').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const venda = await api.vendas.obter(btn.dataset.id);
      verDetalhesVenda(venda);
    });
  });

  container.querySelectorAll('.btn-cancelar').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmAction('Cancelar esta venda? Os itens voltarão para o estoque.');
      if (!ok) return;
      try {
        await api.vendas.excluir(btn.dataset.id);
        toast('Venda cancelada');
        renderVendas(container, setActions);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function verDetalhesVenda(venda) {
  const linhas = venda.itens
    .map(
      (i) => `
      <tr>
        <td>${escapeHtml(i.produto_nome)}</td>
        <td class="text-right">${formatNumber(i.quantidade)} ${escapeHtml(i.unidade)}</td>
        <td class="text-right">${formatMoney(i.preco_unitario)}</td>
        <td class="text-right">${formatMoney(i.subtotal)}</td>
      </tr>`
    )
    .join('');

  openModal({
    title: `Venda #${venda.id} — ${formatDate(venda.data)}`,
    wide: true,
    bodyHtml: `
      <table>
        <thead><tr><th>Produto</th><th class="text-right">Qtd</th><th class="text-right">Preço</th><th class="text-right">Subtotal</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
      <div class="cart-total"><span>Total</span><span>${formatMoney(venda.total)}</span></div>
    `,
    footerHtml: `<button class="btn btn-secondary" id="btn-fechar" type="button">Fechar</button>`,
    onMount: () => {
      document.getElementById('btn-fechar').addEventListener('click', closeModal);
    },
  });
}

function abrirFormVenda(produtos, onSaved) {
  const carrinho = [];

  function renderCartLines() {
    const linesEl = document.getElementById('venda-cart-lines');
    const totalEl = document.getElementById('venda-total');
    if (!linesEl) return;

    if (carrinho.length === 0) {
      linesEl.innerHTML = `<div class="empty-state" style="padding:20px"><span class="empty-icon">🛒</span>Nenhum item adicionado</div>`;
    } else {
      linesEl.innerHTML = carrinho
        .map(
          (item, idx) => `
        <div class="cart-line">
          <span class="name">${escapeHtml(item.produto.nome)}</span>
          <input class="input qty-input" type="number" min="0.001" step="0.001" value="${item.quantidade}" data-idx="${idx}" />
          <span class="text-muted">${escapeHtml(item.produto.unidade)}</span>
          <span style="width:90px;text-align:right">${formatMoney(item.produto.preco_venda * item.quantidade)}</span>
          <button class="btn btn-icon btn-remover-item" data-idx="${idx}" title="Remover">✕</button>
        </div>`
        )
        .join('');

      linesEl.querySelectorAll('.qty-input').forEach((input) => {
        input.addEventListener('change', (e) => {
          const idx = Number(e.target.dataset.idx);
          const val = Number(e.target.value);
          if (val > 0) carrinho[idx].quantidade = val;
          renderCartLines();
        });
      });
      linesEl.querySelectorAll('.btn-remover-item').forEach((btn) => {
        btn.addEventListener('click', () => {
          carrinho.splice(Number(btn.dataset.idx), 1);
          renderCartLines();
        });
      });
    }

    const total = carrinho.reduce((sum, i) => sum + i.produto.preco_venda * i.quantidade, 0);
    if (totalEl) totalEl.textContent = formatMoney(total);
  }

  openModal({
    title: 'Nova venda',
    wide: true,
    bodyHtml: `
      <div class="form-grid">
        <div class="field span-2">
          <label>Produto</label>
          <select class="input" id="sel-venda-produto">
            <option value="">Selecione um produto...</option>
            ${produtos.map((p) => `<option value="${p.id}">${escapeHtml(p.nome)} — estoque: ${formatNumber(p.quantidade)} ${escapeHtml(p.unidade)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Quantidade</label>
          <input class="input" type="number" id="input-venda-qtd" min="0.001" step="0.001" value="1" />
        </div>
        <div class="field" style="justify-content:flex-end">
          <button class="btn btn-secondary" type="button" id="btn-add-item">+ Adicionar item</button>
        </div>
      </div>

      <div class="section-title">Itens da venda</div>
      <div id="venda-cart-lines"></div>
      <div class="cart-total"><span>Total</span><span id="venda-total">${formatMoney(0)}</span></div>
    `,
    footerHtml: `
      <button class="btn btn-secondary" type="button" id="btn-cancelar">Cancelar</button>
      <button class="btn btn-primary" type="button" id="btn-finalizar">Finalizar venda</button>
    `,
    onMount: () => {
      renderCartLines();

      document.getElementById('btn-cancelar').addEventListener('click', closeModal);

      document.getElementById('btn-add-item').addEventListener('click', () => {
        const sel = document.getElementById('sel-venda-produto');
        const qtdInput = document.getElementById('input-venda-qtd');
        const produtoId = Number(sel.value);
        const qtd = Number(qtdInput.value);

        if (!produtoId) return toast('Selecione um produto', 'error');
        if (!qtd || qtd <= 0) return toast('Informe uma quantidade válida', 'error');

        const produto = produtos.find((p) => p.id === produtoId);
        const existente = carrinho.find((i) => i.produto.id === produtoId);
        const qtdNoCarrinho = (existente?.quantidade || 0) + qtd;

        if (qtdNoCarrinho > produto.quantidade) {
          return toast(`Estoque insuficiente. Disponível: ${formatNumber(produto.quantidade)} ${produto.unidade}`, 'error');
        }

        if (existente) {
          existente.quantidade += qtd;
        } else {
          carrinho.push({ produto, quantidade: qtd });
        }

        sel.value = '';
        qtdInput.value = '1';
        renderCartLines();
      });

      document.getElementById('btn-finalizar').addEventListener('click', async () => {
        if (carrinho.length === 0) return toast('Adicione ao menos um item', 'error');
        try {
          await api.vendas.criar({
            itens: carrinho.map((i) => ({ produto_id: i.produto.id, quantidade: i.quantidade })),
          });
          toast('Venda registrada com sucesso');
          closeModal();
          onSaved();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    },
  });
}
