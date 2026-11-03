<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import FilterBar from './components/FilterBar.vue'
import StateBlock from './components/StateBlock.vue'
import { useResumo } from './composables/queries'
import { useSelecaoEleicao } from './composables/selecao'
import { candidatosNominais } from './lib/agregacoes'
import { IDIOMAS, definirIdioma, i18n } from './i18n'

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
  <a class="skip-link" href="#conteudo">{{ $t('app.pular') }}</a>

  <div class="topo">
    <header class="faixa">
      <RouterLink
        class="marca"
        to="/painel"
        :aria-label="$t('app.marcaAria')"
      >
        <img
          class="marca__logo"
          src="/doomsday.png"
          alt=""
          aria-hidden="true"
        />
        <span class="marca__texto">
          <strong>{{ $t('app.nome') }}</strong>
          <small>{{ $t('app.subtitulo') }}</small>
        </span>
      </RouterLink>

      <nav class="nav" :aria-label="$t('app.abasAria')">
        <RouterLink to="/painel">{{ $t('abas.painel') }}</RouterLink>
        <RouterLink to="/mapa">{{ $t('abas.mapa') }}</RouterLink>
        <RouterLink to="/analise">{{ $t('abas.estatistica') }}</RouterLink>
        <RouterLink to="/biometria">{{ $t('abas.biometria') }}</RouterLink>
        <RouterLink to="/comparacoes">{{ $t('abas.comparacoes') }}</RouterLink>
        <RouterLink to="/relatorio">{{ $t('abas.relatorio') }}</RouterLink>
        <RouterLink to="/encerramento">{{ $t('abas.encerramento') }}</RouterLink>
      </nav>

      <p class="classificacao">
        <span><i aria-hidden="true"></i>{{ $t('app.classificacao') }}</span>
      </p>

      <label class="campo campo--curto">
        <span class="campo__rotulo">{{ $t('app.idioma') }}</span>
        <select :value="i18n.global.locale.value" @change="definirIdioma($event.target.value)">
          <option v-for="idioma in IDIOMAS" :key="idioma" :value="idioma">{{ $t(`idiomas.${idioma}`) }}</option>
        </select>
      </label>
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
      <h1 class="sr-only">{{ $t('app.h1') }}</h1>

      <StateBlock
        v-if="eleicoesQuery.isLoading.value"
        estado="carregando"
        :titulo="$t('app.abrindo')"
        :descricao="$t('app.consultando')"
      />
      <StateBlock
        v-else-if="eleicoesQuery.error.value"
        estado="erro"
        :titulo="$t('app.erroEleicoes')"
        :descricao="eleicoesQuery.error.value.message"
        :acao="$t('comum.tentarNovamente')"
        @acao="eleicoesQuery.refetch()"
      />
      <StateBlock
        v-else-if="eleicoesDisponiveis.length === 0"
        estado="vazio"
        :titulo="$t('app.semEleicao')"
        :descricao="$t('app.semEleicaoDesc')"
      />

      <RouterView v-else />
    </div>
  </main>
</template>
