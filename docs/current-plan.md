# Plano atual — análises de anomalia

## 1. Benford multi-nível

- Por candidato nominal, primeiro dígito, em três níveis: **seção** (≥10 votos), **zona** (soma da zona ≥10) e **município** (soma do município ≥10).
- Cada nível devolve n, MAD e classificação de Nigrini; a UF fica de fora (27 números não sustentam Benford).
- Reusa `calcularBenford` (cálculo puro já testado).

## 2. Duplicação e proximidade

- Assinatura por seção: vetor canônico de todos os votáveis do BU (tipo, número, votos), com SHA-256.
- Grupos com a mesma assinatura em ≥2 seções.
- Cada grupo marca `mesma_zona`, `secoes_consecutivas` (mesma zona, |Δseção| ≤ 1) e `mesmo_municipio`.
- Seções sem BU ficam fora.

## 3. Isolation Forest e Local Outlier Factor

- Unidade: seção. Sete features: comparecimento/aptos, abstenção/aptos, biometria não habilitada/comparecimento, hora de recebimento (minutos desde o primeiro BU), tamanho da seção (aptos, log), share do líder e concentração (HHI dos votos por candidato).
- Isolation Forest: 100 árvores, subamostra 256, semente fixa; score 0–1; limiar 0,6.
- LOF: k = 10, distância euclidiana em features padronizadas por mediana/IQR; cálculo em amostra determinística de até 2.000 seções (acima disso, `lof_limitado: true`).
- Implementação em JS puro, sem dependência nova. Scores são descritivos: a interface fala em **anomalia**, nunca em fraude.

## 4. API e interface

- `GET /api/anomalies` no corte e no recorte atuais, devolvendo `benford_niveis`, `duplicacao` e `outliers`.
- Nova rota **Auditoria** no frontend (nav), com os três painéis: matriz candidato × nível de Benford, lista de grupos duplicados com as seções e os sinalizadores de proximidade, e ranking das seções mais anômalas com os dois scores.
- O painel continua sendo o primeiro viewport; a auditoria fica a um clique.

## 5. Testes e documentação

- Unidade: Benford por nível, assinatura de duplicação, Isolation Forest e LOF (determinismo, score no intervalo, outlier sintético detectado).
- Integração: `/api/anomalies` com o fixture, incluindo um par de seções com vetor idêntico.
- Frontend: os três painéis e a navegação.
- Docs: `docs/API.md`, `blueprint.md` e `architecture.md`; cards no board.
