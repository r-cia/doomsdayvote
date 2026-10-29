# Doomsday Vote

Conferência offline de boletins de urna (BUs) para Presidente e Governador. O sistema reconstrói o dia pelo horário oficial de recebimento (`DT_BU_RECEBIDO`), soma os votos no corte escolhido e qualifica o número com a composição de biometria do recorte e o teste de Benford por candidato.

Não é totalização oficial, não é tempo real e não afirma cobertura: mostra o que os BUs carregados permitem mostrar.

## Stack

- **Backend:** Node 22, Fastify 5, Kysely, PostgreSQL, Pino, Zod, pg-copy-streams. ESM, sem TypeScript.
- **Frontend:** Vue 3, Vite 8, Pinia, Vue Query, MapLibre (malha local).
- **Portas:** API em `7000`, frontend em `7010` (escuta em `0.0.0.0`).

## Rodar

A carga aceita `.csv`, `.txt` e as versões comprimidas `.csv.gz` / `.txt.gz` (gzip). O arquivo comprimido é guardado como original e lido em streaming.

```bash
# banco e migrações
cd backend && npm run migrate

# carga dos BUs (pasta configurada em BWEB_INPUT_DIR)
npm run carga

# malha e cores de partido
npm run geo:carregar
npm run seed:cores

# API
npm start

# frontend
cd ../frontend && npm run dev
```

## Scripts do backend

`dev`, `start`, `migrate`, `migrate:reset`, `test`, `test:integration`, `carga`, `geo:carregar`, `seed:cores`, `cores:pendentes`.

## Estrutura

```
backend/src/modules/importacao   parsers 2014/2018/2022/2026, validações, staging por COPY, persistência
backend/src/modules/apuracao     corte, somas, progresso, status da seção
backend/src/modules/analise      biometria do recorte e Benford por candidato
backend/src/routes               API de leitura
frontend/src/components          mesa de plotagem, placar, biometria, análise, mapa, tabela
frontend/src/views               painel (com a seção de análise) e extrato da seção
frontend/public/geo              malha IBGE convertida
docs/                            formatos de BU, API, plano
```

## Documentos

- `PRODUCT.md` — verdade do produto.
- `DESIGN.md` — sistema visual (sala de plotagem).
- `docs/API.md` — contrato da API de leitura.
- `docs/buweb-*.md` — leiautes dos BUs por ano.
- `docs/current-plan.md` — plano em execução.

## Testes

```bash
cd backend && npm test            # unidade
cd backend && npm run test:integration
cd frontend && npm test
```
