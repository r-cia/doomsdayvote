# Plano atual

## Objetivo

Formatar as tabelas de consistência aritmética, comparação local e concentração, mantendo visíveis o estado e o município associados a cada seção.

## Alterações

1. Manter UF e município na tabela de consistência e formatar números usando os formatadores compartilhados.
2. Converter os grupos de comparação local em tabelas com UF, município, zona, seção, participação, abstenção e diferença em pontos percentuais.
3. Converter as listas de concentração em duas tabelas classificadas, ambas com UF, município, zona e seção, além das métricas de participação e margem.
4. Exibir municípios pelo nome, recorrendo ao código TSE quando o nome estiver ausente.
5. Remover os textos fixos de limitações desses painéis e apresentar contagens de cobertura com rótulos legíveis.
6. Preservar estados de carregamento, erro, vazio, navegação e acessibilidade das tabelas; adaptar o overflow para telas estreitas.

## Validação

- Executar a suíte oficial e o build do frontend.
- Executar o detector Impeccable nos componentes alterados.
