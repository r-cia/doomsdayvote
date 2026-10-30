<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import FilterBar from './components/FilterBar.vue'
import StateBlock from './components/StateBlock.vue'
import { useResumo } from './composables/queries'
import { useSelecaoEleicao } from './composables/selecao'
import { candidatosNominais } from './lib/agregacoes'

const {
  eleicoesQuery,
  eleicoesDisponiveis,
  cargos,
  anos,
  turnos,
  filtros,
  aoCargo,
  aoAno,
  aoTurno,
  aoCandidato,
  aoCorte,
  aoUf,
  limparMunicipio,
  limpar,
} = useSelecaoEleicao()

const resumoQuery = useResumo()

const candidatos = computed(() =>
  candidatosNominais(resumoQuery.data.value?.votos ?? []),
)
</script>

<template>
  <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>

  <div class="topo">
    <header class="faixa">
      <RouterLink
        class="marca"
        to="/painel"
        aria-label="Doomsday Vote, painel de conferência de boletins de urna"
      >
        <img
          class="marca__logo"
          src="/doomsday.png"
          alt=""
          aria-hidden="true"
        />
        <span class="marca__texto">
          <strong>Doomsday Vote</strong>
          <small>conferência de boletins de urna</small>
        </span>
      </RouterLink>

      <nav class="nav" aria-label="Abas do sistema">
        <RouterLink to="/painel">Painel</RouterLink>
        <RouterLink to="/mapa">Mapa</RouterLink>
        <RouterLink to="/analise">Análise</RouterLink>
        <RouterLink to="/biometria">Biometria</RouterLink>
      </nav>

      <p class="classificacao">
        <span><i aria-hidden="true"></i>Não oficial · TSE</span>
      </p>
    </header>

    <div v-if="eleicoesDisponiveis.length > 0" class="comando-barra">
      <FilterBar
        :cargos="cargos"
        :anos="anos"
        :turnos="turnos"
        :candidatos="candidatos"
        :filtros="filtros"
        @update:cargo="aoCargo"
        @update:ano="aoAno"
        @update:turno="aoTurno"
        @update:candidato="aoCandidato"
        @update:asof="aoCorte"
        @update:uf="aoUf"
        @clear-municipio="limparMunicipio"
        @clear="limpar"
      />
    </div>
  </div>

  <main id="conteudo">
    <div class="sala">
      <h1 class="sr-only">Conferência de boletins de urna</h1>

      <StateBlock
        v-if="eleicoesQuery.isLoading.value"
        estado="carregando"
        titulo="Abrindo a sala"
        descricao="Consultando a API local."
      />
      <StateBlock
        v-else-if="eleicoesQuery.error.value"
        estado="erro"
        titulo="Não foi possível carregar as eleições"
        :descricao="eleicoesQuery.error.value.message"
        acao="Tentar novamente"
        @acao="eleicoesQuery.refetch()"
      />
      <StateBlock
        v-else-if="eleicoesDisponiveis.length === 0"
        estado="vazio"
        titulo="Nenhuma eleição disponível"
        descricao="Carregue os BUs pelo backend e recarregue esta página."
      />

      <RouterView v-else />
    </div>
  </main>
</template>
