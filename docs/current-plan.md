# Plano atual — cache Redis para as leituras

## Problema

Consultas repetidas (mesma eleição, mesmo cargo, mesma UF) voltam ao banco a cada abertura de tela e a cada navegação entre painel, mapa e análise. `/api/anomalies` chega a ~2 s e `/api/map` e `/api/summary` repetem as mesmas agregações para todos os clientes.

## Desenho

Cache-aside em Redis na frente dos endpoints GET de leitura, com chave canônica e invalidação por namespace.

- Chave: `dv:v{ns}:{rota}:{hash}` — `hash` é sha1 do JSON canônico dos parâmetros já validados; `ns` é um contador em `dv:ns`.
- Conclusão de lote de importação incrementa `dv:ns`: todas as chaves antigas viram lixo e expiram sozinhas. Nenhuma varredura de `KEYS`.
- Só resposta 200 entra no cache; erro nunca é cacheado.
- Falha do Redis (fora do ar, timeout, `REDIS_URL` ausente) não derruba a API: a requisição segue para o banco e o cache é ignorado.
- Single-flight por processo: requisições idênticas simultâneas compartilham a mesma execução e uma única consulta ao banco.
- Cabeçalho `x-cache: hit|miss` para conferir o comportamento.

## TTL por endpoint

| Endpoint | TTL |
| :--- | :--- |
| `/api/elections` | 300 s |
| `/api/summary` | 60 s |
| `/api/timeline` | 120 s |
| `/api/analysis` | 300 s |
| `/api/anomalies` | 600 s |
| `/api/map` | 300 s |
| `/api/sections` | 60 s |
| `/api/sections/:id` | 300 s |

## Arquivos

- `src/lib/cache.js` — cliente `ioredis`, `comCache(chave, ttl, fn)`, `invalidar()`, single-flight, fail-open.
- `src/composition-root.js` — cria o cache a partir de `REDIS_URL`.
- `src/routes/index.js` — envolve os oito handlers.
- `src/modules/importacao/lote.js` — `invalidar()` em `concluirLote`.
- `src/env.js` e `.env.example` — `REDIS_URL` opcional; ausente = cache desligado.
- `tests/cache.test.js` — hit, miss, erro do Redis, single-flight e invalidação, com cliente falso.
- `README.md` e `docs/API.md` — Redis na stack e `x-cache` no contrato.

## Fora de escopo

- Cache no frontend ou em CDN.
- Pré-aquecimento de chaves.
- Cache das rotas de importação (escrita).

## Estado

Implementado com `ioredis`, TTLs acima e `REDIS_URL=redis://127.0.0.1:6379` no `.env.example`. Sem `REDIS_URL` o cache fica desligado e a API segue no banco.

Validação: `tests/unit/cache.test.js` (7), `tests/integration/cache.test.js` (2, Redis real), `api.test.js` (4, com `x-cache: off`), unidade 85/85.
