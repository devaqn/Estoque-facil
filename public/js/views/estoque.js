import { api } from '../api.js';
import { formatMoney, formatNumber, formatDate, escapeHtml, toast, openModal, closeModal, confirmAction } from '../ui.js';

export async function renderEstoque(container, setActions) {
  setActions(`<button class="btn btn-primary" id="btn-nova-entrada">+ Registrar entrada</button>`);
  container.innerHTML = `<div class="empty-state">Carregando...</div>`;

  const [entradas, produtos, fornecedores] = await Promise.all([
    api.entradas.listar(),
    api.produtos.listar(),
    api.fornecedores.listar(),
  ]);

  container.innerHTML = `
    <div class="panel">
      <div class="panel-header">📥 Histórico de entradas</div>
      <div class="panel-body" style="padding:0">
        ${
          entradas.length
            ? `<table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Produto</th>
                    <th>Fornecedor</th>
                    <th class="text-right">Quantidade</th>
                    <th class="text-right">Custo unitário</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${entradas
                    .map(
                      (e) => `
                    <tr>
                      <td>${formatDate(e.data)}</td>
                      <td>${escapeHtml(e.produto_nome)}</td>
                      <td>${escapeHtml(e.fornecedor_nome || '-')}</td>
                      <td class="text-right">${formatNumber(e.quantidade)} ${escapeHtml(e.unidade)}</td>
                      <td class="text-right">${formatMoney(e.preco_custo_unitario)}</td>
                      <td>
                        <div class="row-actions">
                          <button class="btn btn-icon btn-excluir" data-id="${e.id}" title="Estornar entrada">🗑️</button>
                        </div>
                      </td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>`
            : `<div class="empty-state"><span class="empty-icon">📥</span>Nenhuma entrada registrada ainda</div>`
        }
      </div>
    </div>
  `;

  document.getElementById('btn-nova-entrada').addEventListener('click', () => {
    abrirFormEntrada(produtos, fornecedores, () => renderEstoque(container, setActions));
  });

  container.querySelectorAll('.btn-excluir').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmAction('Estornar esta entrada? A quantidade será removida do estoque do produto.');
      if (!ok) return;
      try {
        await api.entradas.excluir(btn.dataset.id);
        toast('Entrada estornada');
        renderEstoque(container, setActions);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function abrirFormEntrada(produtos, fornecedores, onSaved) {
  openModal({
    title: 'Registrar entrada de mercadoria',
    bodyHtml: `
      <form id="form-entrada">
        <div class="form-grid">
          <div class="field span-2">
            <label>Produto *</label>
            <select class="input" name="produto_id" id="sel-produto" required>
              <option value="">Selecione...</option>
              ${produtos.map((p) => `<option value="${p.id}" data-custo="${p.preco_custo}">${escapeHtml(p.nome)} ${p.sku ? `(${escapeHtml(p.sku)})` : ''}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Fornecedor</label>
            <select class="input" name="fornecedor_id">
              <option value="">Nenhum</option>
              ${fornecedores.map((f) => `<option value="${f.id}">${escapeHtml(f.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Quantidade *</label>
            <input class="input" type="number" step="0.001" min="0.001" name="quantidade" required />
          </div>
          <div class="field">
            <label>Custo unitário (R$)</label>
            <input class="input" type="number" step="0.01" min="0" name="preco_custo_unitario" id="input-custo" />
          </div>
          <div class="field span-2">
            <label>Observações</label>
            <input class="input" name="observacoes" placeholder="Nota fiscal, lote, etc. (opcional)" />
          </div>
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" type="button" id="btn-cancelar">Cancelar</button>
      <button class="btn btn-primary" type="submit" form="form-entrada">Registrar</button>
    `,
    onMount: () => {
      document.getElementById('btn-cancelar').addEventListener('click', closeModal);
      document.getElementById('sel-produto').addEventListener('change', (e) => {
        const opt = e.target.selectedOptions[0];
        if (opt && opt.dataset.custo) {
          document.getElementById('input-custo').value = opt.dataset.custo;
        }
      });
      document.getElementById('form-entrada').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const dados = {
          produto_id: Number(fd.get('produto_id')),
          fornecedor_id: fd.get('fornecedor_id') ? Number(fd.get('fornecedor_id')) : null,
          quantidade: Number(fd.get('quantidade')),
          preco_custo_unitario: fd.get('preco_custo_unitario') ? Number(fd.get('preco_custo_unitario')) : null,
          observacoes: fd.get('observacoes'),
        };
        try {
          await api.entradas.criar(dados);
          toast('Entrada registrada');
          closeModal();
          onSaved();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    },
  });
}
