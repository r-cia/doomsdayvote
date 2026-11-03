# Mapa

## Estrutura

- `MapPanel.vue` desenha a malha com MapLibre e mantém `MapTable.vue` abaixo como tabela alternativa com os mesmos dados.
- O painel mostra apenas Presidente e Governador; o cargo vem dos filtros da aplicação.
- Dois níveis: UF e município. O nível município exige uma UF selecionada.
- Dois modos de cor: líder e percentual. A paleta de partidos vem de `frontend/src/lib/colors.js`; área sem dados usa `COR_SEM_DADOS`.

## Modo líder

- A cor identifica o partido do líder da área.
- A legenda lista sigla, quantidade de áreas e a cor correspondente, além da entrada “Sem dados”.

## Modo percentual

- Usa dez faixas de dez pontos (`0–10%` até `90–100%`), definidas em `FAIXAS_PERCENTUAL`.
- A legenda mostra os rótulos das faixas e, para cada partido, a gradação completa. Cada degrau tem rótulo acessível com partido e faixa.
- Sem candidato selecionado, o percentual é o do líder da área.

## Tooltip

- Mostra município e UF (no nível município) ou UF (no nível UF), votos, votos válidos, seções com BU do recorte, corte aplicado, líder e, quando houver candidato selecionado, os votos e o percentual dele.
- O tooltip é visual (`aria-hidden`); a leitura por teclado usa uma região `role="status"` com o mesmo conteúdo.

## Interação

- Clique ou Enter em uma UF seleciona a UF, filtra o mapa e muda para o nível município com zoom na malha da UF.
- Clique ou Enter em um município seleciona o município e exibe a tabela de seções.
- O botão “Brasil” limpa UF, município e nível, voltando à visão nacional.
- Localidades sem malha são contadas em um aviso `role="status"` a partir de `sem_geometria`.

## Teclado

- O contêiner do mapa tem `tabindex="0"`, foco visível e instruções em texto oculto.
- Setas percorrem as áreas, Home e End vão aos extremos, Enter e Espaço selecionam.
- A tabela alternativa navega com as setas e mantém um botão “Selecionar” por linha.

## Estados

- Carregando: malha e/ou dados.
- Erro de malha: mensagem com ação para tentar novamente; a tabela alternativa continua disponível.
- Sem dados: legenda e tabela exibem “Sem dados”.
