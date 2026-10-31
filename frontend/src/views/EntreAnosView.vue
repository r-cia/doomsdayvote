<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CurvasAnos from '../components/CurvasAnos.vue'
import StateBlock from '../components/StateBlock.vue'
import TabelaScroll from '../components/TabelaScroll.vue'
import { useComparacaoAnos } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { formatarDecimal } from '../lib/format'

const CARGO_PRESIDENTE = 1
const POSICOES = [1, 2]

const { t } = useI18n()
const { eleicoesDisponiveis } = useSelecaoEleicao()

const opcoesAnos = computed(() => {
  const porAno = new Map()
  for (const eleicao of eleicoesDisponiveis.value) {
    if (!(eleicao.cargos ?? []).some((cargo) => cargo.cd_cargo_pergunta === CARGO_PRESIDENTE)) continue
    const habilitado = Boolean(eleicao.dt_pleito) || (porAno.get(eleicao.ano_eleicao) ?? false)
    porAno.set(eleicao.ano_eleicao, habilitado)
  }
  return [...porAno.entries()]
    .map(([ano, habilitado]) => ({ ano, habilitado }))
    .sort((a, b) => a.ano - b.ano)
})

const selecionados = ref([])
const query = useComparacaoAnos(selecionados)
const dados = computed(() => query.data.value ?? null)

function alternar(ano) {
  selecionados.value = selecionados.value.includes(ano)
    ? selecionados.value.filter((item) => item !== ano)
    : [...selecionados.value, ano]
}

const turnos = computed(() => {
  const numeros = new Set()
  for (const ano of dados.value?.anos ?? []) for (const turno of ano.turnos) numeros.add(turno.turno)
  return [...numeros].sort((a, b) => a - b)
})

function rotuloPosicao(turno, posicao) {
  if (turno === 2) return t(posicao === 1 ? 'entreAnos.vencedor' : 'entreAnos.derrotado')
  return t('entreAnos.colocado', { n: posicao })
}

function seriesDe(turno, posicao, campo) {
  const series = []
  for (const ano of dados.value?.anos ?? []) {
    const doTurno = ano.turnos.find((item) => item.turno === turno)
    const candidato = doTurno?.candidatos[posicao - 1]
    if (!candidato) continue
    const partido = candidato.sg_partido ? ` (${candidato.sg_partido})` : ''
    series.push({
      chave: `${ano.ano}-${turno}-${posicao}`,
      rotulo: `${ano.ano} · ${candidato.nm_votavel ?? candidato.nr_votavel}${partido}`,
      pontos: doTurno.pontos.map((ponto) => ({
        minuto: ponto.minuto,
        valor: ponto.candidatos[posicao - 1][campo],
      })),
    })
  }
  return series
}
</script>

<template>
  <section class="painel" aria-labelledby="entre-anos-titulo">
    <header class="painel__cabecalho">
      <h2 id="entre-anos-titulo">{{ $t('entreAnos.titulo') }}</h2>
    </header>

    <div class="entre-anos__anos" role="group" :aria-label="$t('entreAnos.anos')">
      <button
        v-for="opcao in opcoesAnos"
        :key="opcao.ano"
        type="button"
        class="button button--ghost button--compacto"
        :class="{ ativo: selecionados.includes(opcao.ano) }"
        :aria-pressed="selecionados.includes(opcao.ano)"
        :disabled="!opcao.habilitado"
        @click="alternar(opcao.ano)"
      >
        {{ opcao.ano }}
      </button>
    </div>
  </section>

  <StateBlock
    v-if="query.error.value"
    estado="erro"
    :titulo="$t('comum.erro')"
    :descricao="query.error.value.message"
    :acao="$t('comum.tentarNovamente')"
    @acao="query.refetch()"
  />
  <StateBlock v-else-if="query.isLoading.value" estado="carregando" :titulo="$t('comum.carregando')" />

  <template v-else-if="dados">
    <section v-for="turno in turnos" :key="turno" class="painel" :aria-labelledby="`entre-anos-turno-${turno}`">
      <header class="painel__cabecalho">
        <h2 :id="`entre-anos-turno-${turno}`">{{ $t('entreAnos.turno', { n: turno }) }}</h2>
      </header>
      <div v-for="posicao in POSICOES" :key="posicao" class="entre-anos__posicao">
        <h3>{{ rotuloPosicao(turno, posicao) }}</h3>
        <div class="entre-anos__graficos">
          <CurvasAnos
            :titulo="$t('entreAnos.votosIntervalo')"
            :series="seriesDe(turno, posicao, 'votos')"
          />
          <CurvasAnos
            :titulo="$t('entreAnos.pctAcumulada')"
            formato="percentual"
            :series="seriesDe(turno, posicao, 'pct_acumulada')"
          />
        </div>
      </div>
    </section>

    <section v-if="dados.pares.length > 0" class="painel" aria-labelledby="entre-anos-pares">
      <header class="painel__cabecalho">
        <h2 id="entre-anos-pares">{{ $t('entreAnos.correlacao') }}</h2>
      </header>
      <TabelaScroll :atualizando="query.isFetching.value">
        <table class="tabela">
          <thead>
            <tr>
              <th scope="col">{{ $t('entreAnos.par') }}</th>
              <th scope="col">{{ $t('entreAnos.turnoCurto') }}</th>
              <th scope="col">{{ $t('entreAnos.candidato') }}</th>
              <th scope="col" class="tabela__numero">{{ $t('entreAnos.votosIntervalo') }} · r</th>
              <th scope="col" class="tabela__numero">{{ $t('entreAnos.votosIntervalo') }} · p</th>
              <th scope="col" class="tabela__numero">{{ $t('entreAnos.pctAcumulada') }} · r</th>
              <th scope="col" class="tabela__numero">{{ $t('entreAnos.pctAcumulada') }} · p</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="par in dados.pares" :key="`${par.ano_a}-${par.ano_b}-${par.turno}-${par.posicao}`">
              <td>{{ par.ano_a }} × {{ par.ano_b }}</td>
              <td>{{ par.turno }}</td>
              <td>{{ rotuloPosicao(par.turno, par.posicao) }}</td>
              <td class="tabela__numero">{{ formatarDecimal(par.votos_intervalo.r, 3) }}</td>
              <td class="tabela__numero">{{ formatarDecimal(par.votos_intervalo.p_valor, 4) }}</td>
              <td class="tabela__numero">{{ formatarDecimal(par.pct_acumulada.r, 3) }}</td>
              <td class="tabela__numero">{{ formatarDecimal(par.pct_acumulada.p_valor, 4) }}</td>
            </tr>
          </tbody>
        </table>
      </TabelaScroll>
    </section>
  </template>
</template>
