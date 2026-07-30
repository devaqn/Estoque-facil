const express = require('express');
const { db } = require('../db');

const router = express.Router();

router.get('/resumo', (req, res) => {
  const totalProdutos = db.prepare('SELECT COUNT(*) AS n FROM produtos').get().n;

  const valorTotalEstoque =
    db.prepare('SELECT COALESCE(SUM(quantidade * preco_custo), 0) AS v FROM produtos').get().v;

  const valorTotalVenda =
    db.prepare('SELECT COALESCE(SUM(quantidade * preco_venda), 0) AS v FROM produtos').get().v;

  const produtosEstoqueBaixo = db
    .prepare('SELECT * FROM produtos WHERE quantidade <= estoque_minimo ORDER BY nome')
    .all();

  const vendasHoje = db
    .prepare(
      `SELECT COUNT(*) AS qtd, COALESCE(SUM(total), 0) AS total FROM vendas
       WHERE date(data) = date('now', 'localtime')`
    )
    .get();

  const vendasMes = db
    .prepare(
      `SELECT COUNT(*) AS qtd, COALESCE(SUM(total), 0) AS total FROM vendas
       WHERE strftime('%Y-%m', data) = strftime('%Y-%m', 'now', 'localtime')`
    )
    .get();

  const maisVendidos = db
    .prepare(
      `SELECT p.id, p.nome, p.unidade, SUM(vi.quantidade) AS total_vendido
       FROM venda_itens vi
       JOIN produtos p ON p.id = vi.produto_id
       JOIN vendas v ON v.id = vi.venda_id
       WHERE strftime('%Y-%m', v.data) = strftime('%Y-%m', 'now', 'localtime')
       GROUP BY p.id
       ORDER BY total_vendido DESC
       LIMIT 5`
    )
    .all();

  res.json({
    totalProdutos,
    valorTotalEstoque,
    valorTotalVenda,
    produtosEstoqueBaixo,
    vendasHoje,
    vendasMes,
    maisVendidos,
  });
});

module.exports = router;
