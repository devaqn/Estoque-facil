import { api } from '../api.js';
import { escapeHtml, toast, openModal, closeModal, confirmAction } from '../ui.js';

export async function renderFornecedores(container, setActions) {
  setActions(`<button class="btn btn-primary" id="btn-novo-fornecedor">+ Novo fornecedor</button>`);
  container.innerHTML = `<div class="empty-state">Carregando...</div>`;

  const fornecedores = await api.fornecedores.listar();

  container.innerHTML = `
    <div class="panel">
      <div class="panel-body" style="padding:0">
        ${
          fornecedores.length
            ? `<table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>E-mail</th>
                    <th class="text-right">Produtos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${fornecedores
                    .map(
                      (f) => `
                    <tr>
                      <td style="font-weight:600">${escapeHtml(f.nome)}</td>
                      <td>${escapeHtml(f.telefone || '-')}</td>
                      <td>${escapeHtml(f.email || '-')}</td>
                      <td class="text-right">${f.total_produtos}</td>
                      <td>
                        <div class="row-actions">
                          <button class="btn btn-icon btn-editar" data-id="${f.id}" title="Editar">✏️</button>
                          <button class="btn btn-icon btn-excluir" data-id="${f.id}" title="Excluir">🗑️</button>
                        </div>
                      </td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>`
            : `<div class="empty-state"><span class="empty-icon">🚚</span>Nenhum fornecedor cadastrado</div>`
        }
      </div>
    </div>
  `;

  document.getElementById('btn-novo-fornecedor').addEventListener('click', () => {
    abrirFormFornecedor(null, () => renderFornecedores(container, setActions));
  });

  container.querySelectorAll('.btn-editar').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const fornecedor = await api.fornecedores.obter(btn.dataset.id);
      abrirFormFornecedor(fornecedor, () => renderFornecedores(container, setActions));
    });
  });

  container.querySelectorAll('.btn-excluir').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmAction('Excluir este fornecedor?');
      if (!ok) return;
      try {
        await api.fornecedores.excluir(btn.dataset.id);
        toast('Fornecedor excluído');
        renderFornecedores(container, setActions);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function abrirFormFornecedor(fornecedor, onSaved) {
  const editando = !!fornecedor;

  openModal({
    title: editando ? 'Editar fornecedor' : 'Novo fornecedor',
    bodyHtml: `
      <form id="form-fornecedor">
        <div class="form-grid single">
          <div class="field">
            <label>Nome *</label>
            <input class="input" name="nome" required value="${escapeHtml(fornecedor?.nome || '')}" />
          </div>
          <div class="field">
            <label>Telefone</label>
            <input class="input" name="telefone" value="${escapeHtml(fornecedor?.telefone || '')}" />
          </div>
          <div class="field">
            <label>E-mail</label>
            <input class="input" type="email" name="email" value="${escapeHtml(fornecedor?.email || '')}" />
          </div>
          <div class="field">
            <label>Observações</label>
            <textarea class="input" name="observacoes" rows="3">${escapeHtml(fornecedor?.observacoes || '')}</textarea>
          </div>
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" type="button" id="btn-cancelar">Cancelar</button>
      <button class="btn btn-primary" type="submit" form="form-fornecedor">Salvar</button>
    `,
    onMount: () => {
      document.getElementById('btn-cancelar').addEventListener('click', closeModal);
      document.getElementById('form-fornecedor').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const dados = {
          nome: fd.get('nome'),
          telefone: fd.get('telefone'),
          email: fd.get('email'),
          observacoes: fd.get('observacoes'),
        };
        try {
          if (editando) {
            await api.fornecedores.atualizar(fornecedor.id, dados);
            toast('Fornecedor atualizado');
          } else {
            await api.fornecedores.criar(dados);
            toast('Fornecedor criado');
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
