async function request(method, url, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (res.status === 204) return null;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const msg = (data && data.erro) || `Erro ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  produtos: {
    listar: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/api/produtos${qs ? `?${qs}` : ''}`);
    },
    obter: (id) => request('GET', `/api/produtos/${id}`),
    categorias: () => request('GET', '/api/produtos/categorias'),
    criar: (dados) => request('POST', '/api/produtos', dados),
    atualizar: (id, dados) => request('PUT', `/api/produtos/${id}`, dados),
    excluir: (id) => request('DELETE', `/api/produtos/${id}`),
  },
  fornecedores: {
    listar: () => request('GET', '/api/fornecedores'),
    obter: (id) => request('GET', `/api/fornecedores/${id}`),
    criar: (dados) => request('POST', '/api/fornecedores', dados),
    atualizar: (id, dados) => request('PUT', `/api/fornecedores/${id}`, dados),
    excluir: (id) => request('DELETE', `/api/fornecedores/${id}`),
  },
  entradas: {
    listar: (produto_id) => request('GET', `/api/entradas${produto_id ? `?produto_id=${produto_id}` : ''}`),
    criar: (dados) => request('POST', '/api/entradas', dados),
    excluir: (id) => request('DELETE', `/api/entradas/${id}`),
  },
  vendas: {
    listar: () => request('GET', '/api/vendas'),
    obter: (id) => request('GET', `/api/vendas/${id}`),
    criar: (dados) => request('POST', '/api/vendas', dados),
    excluir: (id) => request('DELETE', `/api/vendas/${id}`),
  },
  dashboard: {
    resumo: () => request('GET', '/api/dashboard/resumo'),
  },
  license: {
    status: () => request('GET', '/api/license/status'),
    ativar: (chave) => request('POST', '/api/license/ativar', { chave }),
  },
};
