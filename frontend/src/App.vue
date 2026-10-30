<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import FilterBar from './components/FilterBar.vue'
import StateBlock from './components/StateBlock.vue'
import { useResumo } from './composables/queries'
import { useSelecaoEleicao } from './composables/selecao'
import { candidatosNominais } from './lib/agregacoes'
import { definirLocale } from './i18n'

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
        <RouterLink to="/painel">{{ $t('app.abas.painel') }}</RouterLink>
        <RouterLink to="/mapa">{{ $t('app.abas.mapa') }}</RouterLink>
        <RouterLink to="/analise">{{ $t('app.abas.estatistica') }}</RouterLink>
        <RouterLink to="/comparacoes">{{ $t('app.abas.comparacoes') }}</RouterLink>
        <RouterLink to="/biometria">{{ $t('app.abas.biometria') }}</RouterLink>
        <RouterLink to="/encerramento">{{ $t('app.abas.encerramento') }}</RouterLink>
      </nav>

      <p class="classificacao">
        <span><i aria-hidden="true"></i>{{ $t('app.classificacao') }}</span>
      </p>
      <select
        class="uf-ordenacao"
        :value="$i18n.locale"
        @change="definirLocale($event.target.value)"
      >
        <option value="pt-BR">PT-BR</option>
        <option value="en-US">EN-US</option>
        <option value="es-ES">ES-ES</option>
      </select>
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
        :titulo="$t('comum.erro')"
        :descricao="eleicoesQuery.error.value.message"
        :acao="$t('comum.tentarNovamente')"
        @acao="eleicoesQuery.refetch()"
      />
      <StateBlock
        v-else-if="eleicoesDisponiveis.length === 0"
        estado="vazio"
        :titulo="$t('comum.semDados')"
        descricao="Carregue os BUs pelo backend e recarregue esta página."
      />

      <RouterView v-else />
    </div>
  </main>
</template>
