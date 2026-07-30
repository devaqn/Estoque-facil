# Estoque Fácil

Sistema simples de controle de estoque para lojas pequenas (casa de ração, papelaria, etc.).

Controla:
- **Produtos** — cadastro, categorias, preço de custo/venda, estoque mínimo e alerta de estoque baixo.
- **Entrada de mercadoria** — registrar compras/reposição vinculadas a fornecedores, com histórico.
- **Vendas** — registrar uma venda (carrinho simples) que desconta do estoque automaticamente; permite cancelar/estornar.
- **Fornecedores** — cadastro simples.
- **Início** — resumo do dia: produtos com estoque baixo, vendas do dia/mês, mais vendidos.

Todos os dados ficam salvos **só neste computador**, em um arquivo de banco de dados local (`data/estoque.db`) — não precisa de internet.

## Instalação (só precisa fazer uma vez)

1. Instale o [Node.js](https://nodejs.org) (versão 22 ou mais recente).
2. Abra uma janela de terminal nesta pasta e rode:

```bash
npm install
```

Isso baixa as bibliotecas necessárias (na primeira vez também baixa o Electron para a versão desktop, o que pode demorar alguns minutos).

## Como usar — versão navegador (web)

```bash
npm start
```

Depois abra o navegador (Chrome, Edge, etc.) no endereço:

```
http://localhost:3000
```

Para parar o servidor, volte ao terminal e aperte `Ctrl+C`.

## Como usar — versão desktop (janela própria)

```bash
npm run desktop
```

Isso abre o sistema em uma janela própria do programa, sem precisar do navegador. Pode fechar a janela normalmente para sair.

> Dica: crie um atalho na área de trabalho que rode `npm run desktop` nesta pasta, para abrir com um clique.

## Importante

- Use **uma versão de cada vez** (web ou desktop), já que as duas usam o mesmo arquivo de banco de dados (`data/estoque.db`).
- Se quiser mudar a porta da versão web, rode `PORT=3050 npm start` (Windows PowerShell: `$env:PORT=3050; npm start`).
- Para fazer backup dos seus dados, basta copiar o arquivo `data/estoque.db` para um pen-drive ou nuvem (Google Drive, etc.) de tempos em tempos.

## Estrutura do projeto

```
server/             -> backend (API + banco de dados SQLite)
public/             -> interface (HTML/CSS/JS)
electron/           -> versão desktop (janela nativa)
data/               -> banco de dados local (criado automaticamente)
ferramenta-licenca/ -> ferramenta PRIVADA para gerar chaves (não enviar a clientes)
```

## Vendendo para vários clientes (ativação por licença)

Cada instalação precisa ser ativada com uma chave própria, travada no computador de quem
comprou — copiar a pasta inteira para outra pessoa **não funciona**, porque a chave só é
válida no computador para o qual foi gerada.

### Preparando uma cópia para um novo cliente

1. Copie a pasta do projeto para entregar ao cliente, **removendo antes**:
   - a pasta `ferramenta-licenca/` (é só sua, nunca do cliente)
   - a pasta `data/` (assim ele começa com o sistema zerado e pede ativação)
   - a pasta `node_modules/` (ele gera a dele com `npm install`, fica mais leve pra enviar)
2. Envie essa cópia para o cliente (pen-drive, link de download, etc.) junto com o `README.md`.

### Ativando no computador do cliente

1. O cliente instala (`npm install`) e abre o sistema (`npm start` ou `npm run desktop`).
2. Em vez do sistema, aparece a tela **"Ativação necessária"** com um código único daquele
   computador, tipo `A64D-C867-1481-8BFB`.
3. O cliente te manda esse código (WhatsApp, etc).
4. Você roda, na sua própria cópia do projeto (com a pasta `ferramenta-licenca/`):
   ```bash
   node ferramenta-licenca/gerar-chave.js "A64D-C867-1481-8BFB"
   ```
   Isso imprime uma **chave de ativação**.
5. Você manda essa chave para o cliente, ele cola no campo "Chave de ativação" e clica em
   **Ativar**. Pronto, liberado permanentemente naquele computador.

Se o cliente quiser usar em **até 2 computadores** (ex: PC do balcão + um notebook), peça os
dois códigos e gere uma chave única para os dois de uma vez:
```bash
node ferramenta-licenca/gerar-chave.js "CODIGO-DO-PC-1" "CODIGO-DO-PC-2"
```

Se o cliente trocar de computador depois, é só repetir o processo (o código muda, gera-se
uma chave nova).

### Limitações (seja transparente com você mesmo sobre isso)

Isso impede que um cliente simplesmente copie a pasta e dê para outra loja usar de graça —
que é o objetivo aqui. Não é uma proteção militar: como o código roda em JavaScript comum
(não é um `.exe` compilado/ofuscado), alguém tecnicamente muito experiente que abrisse os
arquivos poderia, em teoria, entender o esquema. Para o público-alvo (lojistas comprando um
sistema de estoque), essa trava já resolve o problema real, que é compartilhamento casual.
