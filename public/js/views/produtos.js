import { api } from '../api.js';
import { formatMoney, formatNumber, escapeHtml, toast, openModal, closeModal, confirmAction } from '../ui.js';

let filtros = { busca: '', categoria: '', baixo: false };

export async function renderProdutos(container, setActions) {
  setActions(`<button class="btn btn-primary" id="btn-novo-produto">+ Novo produto</button>`);

  container.innerHTML = `<div class="empty-state">Carregando...</div>`;

  const [produtos, categorias, fornecedores] = await Promise.all([
    api.produtos.listar({ busca: filtros.busca, categoria: filtros.categoria, ...(filtros.baixo ? { baixo: '1' } : {}) }),
    api.produtos.categorias(),
    api.fornecedores.listar(),
  ]);

  container.innerHTML = `
    <div class="toolbar">
      <input class="input search-input" id="f-busca" placeholder="Buscar por nome ou código..." value="${escapeHtml(filtros.busca)}" />
      <select class="input" id="f-categoria">
        <option value="">Todas as categorias</option>
        ${categorias.map((c) => `<option value="${escapeHtml(c)}" ${filtros.categoria === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
      </select>
      <label style="display:flex;align-items:center;gap:6px;font-size:14px;color:var(--color-text-muted)">
        <input type="checkbox" id="f-baixo" ${filtros.baixo ? 'checked' : ''} /> Só estoque baixo
      </label>
    </div>

    <div class="panel">
      <div class="panel-body" style="padding:0">
        ${
          produtos.length
            ? `<table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Fornecedor</th>
                    <th class="text-right">Estoque</th>
                    <th class="text-right">Preço venda</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${produtos
                    .map(
                      (p) => `
                    <tr>
                      <td>
                        <div style="font-weight:600">${escapeHtml(p.nome)}</div>
                        <div class="text-muted" style="font-size:12.5px">${escapeHtml(p.sku || '')}</div>
                      </td>
                      <td>${escapeHtml(p.categoria || '-')}</td>
                      <td>${escapeHtml(p.fornecedor_nome || '-')}</td>
                      <td class="text-right">
                        ${formatNumber(p.quantidade)} ${escapeHtml(p.unidade)}
                        ${p.estoque_baixo ? '<div><span class="badge badge-warn">baixo</span></div>' : ''}
                      </td>
                      <td class="text-right">${formatMoney(p.preco_venda)}</td>
                      <td>
                        <div class="row-actions">
                          <button class="btn btn-icon btn-editar" data-id="${p.id}" title="Editar">✏️</button>
                          <button class="btn btn-icon btn-excluir" data-id="${p.id}" title="Excluir">🗑️</button>
                        </div>
                      </td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>`
            : `<div class="empty-state"><span class="empty-icon">🏷️</span>Nenhum produto encontrado</div>`
        }
      </div>
    </div>
  `;

  document.getElementById('btn-novo-produto').addEventListener('click', () => abrirFormProduto(null, fornecedores, () => renderProdutos(container, setActions)));

  document.getElementById('f-busca').addEventListener('input', debounce((e) => {
    filtros.busca = e.target.value;
    renderProdutos(container, setActions);
  }, 300));

  document.getElementById('f-categoria').addEventListener('change', (e) => {
    filtros.categoria = e.target.value;
    renderProdutos(container, setActions);
  });

  document.getElementById('f-baixo').addEventListener('change', (e) => {
    filtros.baixo = e.target.checked;
    renderProdutos(container, setActions);
  });

  container.querySelectorAll('.btn-editar').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const produto = await api.produtos.obter(btn.dataset.id);
      abrirFormProduto(produto, fornecedores, () => renderProdutos(container, setActions));
    });
  });

  container.querySelectorAll('.btn-excluir').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmAction('Excluir este produto? Essa ação não pode ser desfeita.');
      if (!ok) return;
      try {
        await api.produtos.excluir(btn.dataset.id);
        toast('Produto excluído');
        renderProdutos(container, setActions);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function abrirFormProduto(produto, fornecedores, onSaved) {
  const editando = !!produto;

  openModal({
    title: editando ? 'Editar produto' : 'Novo produto',
    bodyHtml: `
      <form id="form-produto">
        <div class="form-grid">
          <div class="field span-2">
            <label>Nome *</label>
            <input class="input" name="nome" required value="${escapeHtml(produto?.nome || '')}" />
          </div>
          <div class="field">
            <label>Código / SKU</label>
            <input class="input" name="sku" value="${escapeHtml(produto?.sku || '')}" />
          </div>
          <div class="field">
            <label>Categoria</label>
            <input class="input" name="categoria" list="lista-categorias" value="${escapeHtml(produto?.categoria || '')}" />
          </div>
          <div class="field">
            <label>Unidade</label>
            <input class="input" name="unidade" placeholder="un, kg, cx..." value="${escapeHtml(produto?.unidade || 'un')}" />
          </div>
          <div class="field">
            <label>Fornecedor</label>
            <select class="input" name="fornecedor_id">
              <option value="">Nenhum</option>
              ${fornecedores.map((f) => `<option value="${f.id}" ${produto?.fornecedor_id === f.id ? 'selected' : ''}>${escapeHtml(f.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Preço de custo (R$)</label>
            <input class="input" type="number" step="0.01" min="0" placeholder="0" name="preco_custo" value="${produto?.preco_custo ?? ''}" />
          </div>
          <div class="field">
            <label>Preço de venda (R$)</label>
            <input class="input" type="number" step="0.01" min="0" placeholder="0" name="preco_venda" value="${produto?.preco_venda ?? ''}" />
          </div>
          <div class="field">
            <label>Quantidade em estoque${editando ? ' (ajuste manual)' : ''}</label>
            <input class="input" type="number" step="0.001" min="0" placeholder="0" name="quantidade" value="${produto?.quantidade ?? ''}" />
          </div>
          <div class="field">
            <label>Estoque mínimo</label>
            <input class="input" type="number" step="0.001" min="0" placeholder="0" name="estoque_minimo" value="${produto?.estoque_minimo ?? ''}" />
          </div>
        </div>
        ${editando ? '<p class="hint">Para registrar compras/reposições, use a tela "Entrada de mercadoria" — isso mantém o histórico.</p>' : ''}
      </form>
      <datalist id="lista-categorias"></datalist>
    `,
    footerHtml: `
      <button class="btn btn-secondary" type="button" id="btn-cancelar">Cancelar</button>
      <button class="btn btn-primary" type="submit" form="form-produto" id="btn-salvar">Salvar</button>
    `,
    onMount: () => {
      document.getElementById('btn-cancelar').addEventListener('click', closeModal);
      document.getElementById('form-produto').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const dados = {
          nome: fd.get('nome'),
          sku: fd.get('sku'),
          categoria: fd.get('categoria'),
          unidade: fd.get('unidade'),
          fornecedor_id: fd.get('fornecedor_id') ? Number(fd.get('fornecedor_id')) : null,
          preco_custo: Number(fd.get('preco_custo')) || 0,
          preco_venda: Number(fd.get('preco_venda')) || 0,
          quantidade: Number(fd.get('quantidade')) || 0,
          estoque_minimo: Number(fd.get('estoque_minimo')) || 0,
        };
        try {
          if (editando) {
            await api.produtos.atualizar(produto.id, dados);
            toast('Produto atualizado');
          } else {
            await api.produtos.criar(dados);
            toast('Produto criado');
          }
          closeModal();
          onSaved();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    },
  });
}

function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
