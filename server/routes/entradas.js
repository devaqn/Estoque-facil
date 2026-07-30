const express = require('express');
const { db, transaction } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { produto_id } = req.query;
  let sql = `
    SELECT e.*, p.nome AS produto_nome, p.unidade, f.nome AS fornecedor_nome
    FROM entradas e
    JOIN produtos p ON p.id = e.produto_id
    LEFT JOIN fornecedores f ON f.id = e.fornecedor_id
    WHERE 1=1
  `;
  const params = [];
  if (produto_id) {
    sql += ' AND e.produto_id = ?';
    params.push(produto_id);
  }
  sql += ' ORDER BY e.data DESC, e.id DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { produto_id, fornecedor_id, quantidade, preco_custo_unitario, observacoes } = req.body;

  if (!produto_id || !quantidade || Number(quantidade) <= 0) {
    return res.status(400).json({ erro: 'Produto e quantidade (maior que zero) são obrigatórios' });
  }

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produto_id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  try {
    const result = transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO entradas (produto_id, fornecedor_id, quantidade, preco_custo_unitario, observacoes)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          produto_id,
          fornecedor_id || null,
          quantidade,
          preco_custo_unitario ?? produto.preco_custo,
          observacoes || null
        );

      db.prepare('UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?').run(quantidade, produto_id);

      if (preco_custo_unitario !== undefined && preco_custo_unitario !== null && preco_custo_unitario !== '') {
        db.prepare('UPDATE produtos SET preco_custo = ? WHERE id = ?').run(preco_custo_unitario, produto_id);
      }

      return db
        .prepare(
          `SELECT e.*, p.nome AS produto_nome FROM entradas e
           JOIN produtos p ON p.id = e.produto_id WHERE e.id = ?`
        )
        .get(info.lastInsertRowid);
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registrar entrada de mercadoria' });
  }
});

router.delete('/:id', (req, res) => {
  const entrada = db.prepare('SELECT * FROM entradas WHERE id = ?').get(req.params.id);
  if (!entrada) return res.status(404).json({ erro: 'Entrada não encontrada' });

  transaction(() => {
    db.prepare('UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?').run(
      entrada.quantidade,
      entrada.produto_id
    );
    db.prepare('DELETE FROM entradas WHERE id = ?').run(req.params.id);
  });
  res.status(204).end();
});

module.exports = router;
