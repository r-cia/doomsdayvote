# Plano atual — redesenho do frontend e análise estatística

## 1. Direção visual (pinada pelo usuário)

Sala de operações da Guerra Fria / monitor de fósforo âmbar. Em modo operar o mundo empresta só quatro coisas: tipo, paleta, densidade e um movimento-assinatura. Navegação e controles continuam os da web.

- **Tipo:** monoespaçada de terminal (Fragment Mono, auto-hospedada) para dados, rótulos e hashes; condensada de quadro de status (Archivo Narrow) só para títulos de painel e marca.
- **Paleta:** fundo quase preto esverdeado, tinta âmbar de fósforo na estrutura, verde de lâmpada para recebido, vermelho para alerta; cores de partido continuam sendo os únicos saturados dos dados.
- **Densidade:** linhas de 1px, nenhuma sombra, rótulos em caixa alta com tracking, algarismos tabulares.
- **Movimento-assinatura:** a mesa de plotagem — o dia desenhado em canvas (tempo × votos acumulados), uma traça por candidato, o corte como linha vertical arrastável; ao arrastar, o placar reordena no lugar e a linha que mudou segura uma marca âmbar.

## 2. Backend

1. `GET /api/timeline?por_candidato=true` — séries acumuladas por candidato nominal, no mesmo corte e escopo do endpoint atual.
2. `GET /api/analysis` — duas leituras no recorte e no corte atuais:
   - `biometria`: `qt_aptos`, `qt_comparecimento`, `qt_elei_biom_sem_habilitacao` e `habilitados_por_biometria = comparecimento − nh`, com contagem de BUs sem o campo. Sem rateio por candidato.
   - `benford`: por candidato nominal, primeiro dígito dos votos em cada seção com 10 votos ou mais, distribuição observada, esperada, `n`, `MAD` e classificação de Nigrini.
3. Testes de unidade para o cálculo de Benford (distribuição, MAD, classificação, corte de 10 votos) e de integração para os dois endpoints.

## 3. Frontend

- Shell: faixa de classificação com logo, filtros (eleição, turno, cargo, UF) e corte; nada de herói.
- Primeiro viewport: mesa de plotagem + placar do ranking + composição de biometria do recorte + Benford de todos os candidatos.
- Abaixo: mapa por UF, tabela de seções com lâmpadas de status, detalhe da seção como extrato de teletipo.
- Acessibilidade: tabela alternativa do mapa, legenda textual, teclado, foco visível, `role=status`/`alert`.
- Testes existentes atualizados; build; detector mecânico; revisão de acabamento; DESIGN.md e `.impeccable/design.json`.

## 4. Documentação e board

PRODUCT.md (novas estatísticas), docs/API.md, docs/blueprint.md, docs/architecture.md, README.md e cards no board para a análise estatística e o redesenho.
