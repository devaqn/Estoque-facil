const express = require('express');
const { db } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT f.*,
        (SELECT COUNT(*) FROM produtos p WHERE p.fornecedor_id = f.id) AS total_produtos
       FROM fornecedores f ORDER BY f.nome ASC`
    )
    .all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM fornecedores WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ erro: 'Fornecedor não encontrado' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { nome, telefone, email, observacoes } = req.body;
  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }
  const info = db
    .prepare('INSERT INTO fornecedores (nome, telefone, email, observacoes) VALUES (?, ?, ?, ?)')
    .run(nome.trim(), telefone || null, email || null, observacoes || null);
  const row = db.prepare('SELECT * FROM fornecedores WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM fornecedores WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ erro: 'Fornecedor não encontrado' });

  const { nome, telefone, email, observacoes } = req.body;
  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }

  db.prepare('UPDATE fornecedores SET nome = ?, telefone = ?, email = ?, observacoes = ? WHERE id = ?').run(
    nome.trim(),
    telefone || null,
    email || null,
    observacoes || null,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM fornecedores WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM fornecedores WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ erro: 'Fornecedor não encontrado' });

  try {
    db.prepare('DELETE FROM fornecedores WHERE id = ?').run(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ erro: 'Não é possível excluir: este fornecedor possui entradas registradas' });
  }
});

module.exports = router;
