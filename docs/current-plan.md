# Plano atual

## Objetivo

Corrigir os estados de carregamento dos gráficos e painéis, fazer os textos e formatos localizados acompanharem o idioma selecionado e preservar a agregação correta de percentuais no mapa por UF.

## Alterações

1. Diferenciar o carregamento inicial da ausência real de dados no gráfico temporal e nos painéis analíticos.
2. Centralizar o estado de carregamento na área de conteúdo dos painéis, ocultar contagens sem dados enquanto carrega e evitar indicadores duplicados no mapa.
3. Animar o spinner compartilhado, respeitando a preferência do sistema por movimento reduzido.
4. Adicionar traduções para estados e rótulos dos painéis analíticos em português, inglês e espanhol.
5. Fazer formatadores compartilhados e os formatadores do gráfico e da análise usarem o idioma ativo.
6. Reagregar os totais da view materializada por UF e candidato antes de selecionar o líder e calcular percentuais.

## Validação

- Conferir consistência das chaves dos três catálogos e revisar o diff.
- A suíte e o build não foram executados.
