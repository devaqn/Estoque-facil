const express = require('express');
const { db, transaction } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT v.*,
        (SELECT COUNT(*) FROM venda_itens vi WHERE vi.venda_id = v.id) AS total_itens
       FROM vendas v ORDER BY v.data DESC, v.id DESC`
    )
    .all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(req.params.id);
  if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });

  const itens = db
    .prepare(
      `SELECT vi.*, p.nome AS produto_nome, p.unidade
       FROM venda_itens vi JOIN produtos p ON p.id = vi.produto_id
       WHERE vi.venda_id = ?`
    )
    .all(req.params.id);

  res.json({ ...venda, itens });
});

router.post('/', (req, res) => {
  const { itens, observacoes } = req.body;

  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Informe ao menos um item na venda' });
  }

  for (const item of itens) {
    if (!item.produto_id || !item.quantidade || Number(item.quantidade) <= 0) {
      return res.status(400).json({ erro: 'Cada item precisa de produto e quantidade válida' });
    }
  }

  try {
    const result = transaction(() => {
      let total = 0;
      const itensResolvidos = [];

      for (const item of itens) {
        const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(item.produto_id);
        if (!produto) {
          throw new Error(`Produto ${item.produto_id} não encontrado`);
        }
        if (produto.quantidade < item.quantidade) {
          const e = new Error(`Estoque insuficiente para "${produto.nome}" (disponível: ${produto.quantidade})`);
          e.code = 'ESTOQUE_INSUFICIENTE';
          throw e;
        }
        const precoUnitario = item.preco_unitario ?? produto.preco_venda;
        const subtotal = precoUnitario * item.quantidade;
        total += subtotal;
        itensResolvidos.push({ produto, quantidade: item.quantidade, precoUnitario, subtotal });
      }

      const infoVenda = db
        .prepare('INSERT INTO vendas (total, observacoes) VALUES (?, ?)')
        .run(total, observacoes || null);
      const vendaId = infoVenda.lastInsertRowid;

      for (const item of itensResolvidos) {
        db.prepare(
          `INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`
        ).run(vendaId, item.produto.id, item.quantidade, item.precoUnitario, item.subtotal);

        db.prepare('UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?').run(
          item.quantidade,
          item.produto.id
        );
      }

      return db.prepare('SELECT * FROM vendas WHERE id = ?').get(vendaId);
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.code === 'ESTOQUE_INSUFICIENTE') {
      return res.status(400).json({ erro: err.message });
    }
    res.status(500).json({ erro: 'Erro ao registrar venda' });
  }
});

router.delete('/:id', (req, res) => {
  const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(req.params.id);
  if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });

  transaction(() => {
    const itens = db.prepare('SELECT * FROM venda_itens WHERE venda_id = ?').all(req.params.id);
    for (const item of itens) {
      db.prepare('UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?').run(
        item.quantidade,
        item.produto_id
      );
    }
    db.prepare('DELETE FROM vendas WHERE id = ?').run(req.params.id);
  });

  res.status(204).end();
});

module.exports = router;
