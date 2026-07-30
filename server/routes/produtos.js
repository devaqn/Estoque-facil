const express = require('express');
const { db } = require('../db');

const router = express.Router();

function serialize(row) {
  return {
    ...row,
    estoque_baixo: row.quantidade <= row.estoque_minimo,
  };
}

router.get('/', (req, res) => {
  const { busca, categoria, baixo } = req.query;
  let sql = `
    SELECT p.*, f.nome AS fornecedor_nome
    FROM produtos p
    LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
    WHERE 1=1
  `;
  const params = [];

  if (busca) {
    sql += ' AND (p.nome LIKE ? OR p.sku LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }
  if (categoria) {
    sql += ' AND p.categoria = ?';
    params.push(categoria);
  }
  sql += ' ORDER BY p.nome ASC';

  let rows = db.prepare(sql).all(...params).map(serialize);

  if (baixo === '1') {
    rows = rows.filter((r) => r.estoque_baixo);
  }

  res.json(rows);
});

router.get('/categorias', (req, res) => {
  const rows = db
    .prepare(
      "SELECT DISTINCT categoria FROM produtos WHERE categoria IS NOT NULL AND categoria != '' ORDER BY categoria"
    )
    .all();
  res.json(rows.map((r) => r.categoria));
});

router.get('/:id', (req, res) => {
  const row = db
    .prepare(
      `SELECT p.*, f.nome AS fornecedor_nome FROM produtos p
       LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
       WHERE p.id = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json(serialize(row));
});

router.post('/', (req, res) => {
  const {
    nome,
    sku,
    categoria,
    unidade,
    preco_custo,
    preco_venda,
    quantidade,
    estoque_minimo,
    fornecedor_id,
  } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO produtos (nome, sku, categoria, unidade, preco_custo, preco_venda, quantidade, estoque_minimo, fornecedor_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      nome.trim(),
      sku || null,
      categoria || null,
      unidade || 'un',
      preco_custo || 0,
      preco_venda || 0,
      quantidade || 0,
      estoque_minimo || 0,
      fornecedor_id || null
    );
    const row = db.prepare('SELECT * FROM produtos WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(serialize(row));
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(400).json({ erro: 'Já existe um produto com esse SKU/código' });
    }
    res.status(500).json({ erro: 'Erro ao criar produto' });
  }
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ erro: 'Produto não encontrado' });

  const {
    nome,
    sku,
    categoria,
    unidade,
    preco_custo,
    preco_venda,
    quantidade,
    estoque_minimo,
    fornecedor_id,
  } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }

  try {
    db.prepare(`
      UPDATE produtos SET
        nome = ?, sku = ?, categoria = ?, unidade = ?, preco_custo = ?,
        preco_venda = ?, quantidade = ?, estoque_minimo = ?, fornecedor_id = ?
      WHERE id = ?
    `).run(
      nome.trim(),
      sku || null,
      categoria || null,
      unidade || 'un',
      preco_custo || 0,
      preco_venda || 0,
      quantidade ?? existing.quantidade,
      estoque_minimo || 0,
      fornecedor_id || null,
      req.params.id
    );
    const row = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
    res.json(serialize(row));
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(400).json({ erro: 'Já existe um produto com esse SKU/código' });
    }
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ erro: 'Produto não encontrado' });

  try {
    db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({
      erro: 'Não é possível excluir: este produto já tem vendas ou entradas registradas',
    });
  }
});

module.exports = router;
