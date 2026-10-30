---
version: 1
slug: "frontend"
primary_target: "frontend"
related_targets: []
---

## Direction contract

THESIS: A sala de operações onde o dia dos BUs é plotado. Recusa o painel de cartões: o primeiro viewport prova o ranking e o traçado do dia, não um herói.

OWN-WORLD: Fósforo âmbar sobre fundo quase preto esverdeado (#0a0d0a), painéis #10150f divididos por fios de 1px (#273522), âmbar #ffb52e na estrutura, verde #74e08c no recebido, vermelho #ff6b57 no alerta, papel de teletipo #dfe4d6 no extrato. Fragment Mono para dados e rótulos, Archivo Narrow para títulos. Sem sombras; densidade de quadro de status, algarismos tabulares.

STORY: O visitante escolhe cargo, ano e turno, arrasta o corte e vê o placar reordenar enquanto as traças crescem; biometria e Benford qualificam o número; o mapa e o extrato da seção fecham a auditoria.

FIRST VIEWPORT: Faixa de classificação de 46px com logo e "não oficial"; linha de filtros (cargo, ano, turno, candidato, corte, UF); faixa de série com cinco leituras; à esquerda a mesa de plotagem (traças por candidato, corte arrastável, leitura de seções e votos) e à direita o placar que reordena no lugar e marca o delta do corte; abaixo, composição do recorte e Benford de todos os candidatos. Mapa e tabela de seções abaixo da dobra.

FORM: direção pinada pelo usuário (terminal militar, guerra fria, monitor de fósforo) sobre a direção sorteada 5; a semente do sorteio é de82dfdb. O mundo entra só como tipo, paleta, densidade e um movimento-assinatura: o traçado do dia.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Direction contract: relatório

THESIS: A leitura executiva mostra o que foi verificado no recorte e o que permanece inconclusivo. Recusa misturar turnos ou anos na nota e recusa transformar desvio estatístico em prova.

OWN-WORLD: Herdar a sala de plotagem existente: fundo escuro esverdeado, painéis de fio fino, âmbar para hierarquia, verde para igualdade aritmética e vermelho para divergência confirmada. Dados em Fragment Mono; títulos Archivo Narrow. Tabelas e regras mantêm links de rastreio.

STORY: O visitante identifica eleição, ano, turno, cargo e cobertura; lê a nota como percentual de BUs avaliados sem divergência nas regras aritméticas aplicáveis; abre cada regra e encontra sinais estatísticos e comparações históricas em grupos separados. Anos/turnos de referência contextualizam mudanças, sem entrar no universo ou na nota do alvo.

FIRST VIEWPORT: Título “Relatório” e identificação do recorte; faixa de nota, base avaliada e cobertura; abaixo, tabela curta com os resultados das regras aritméticas e o primeiro bloco de diferenças históricas. Benford, duplicação, outliers, biometria, concentração e comparação local seguem em seções rastreáveis abaixo.

FORM: Extensão operacional de uma rota existente, código sobre componentes, tabelas, tipografia e tokens da interface atual; sem nova identidade visual ou assets.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
