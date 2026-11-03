<script setup>
import { computed, ref } from 'vue'
import CurvasAnos from './CurvasAnos.vue'
import StateBlock from './StateBlock.vue'
import { useComparacaoAnos } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { diferencasDoTurno, linhasCorrelacao, seriesDoTurno, turnosDisponiveis } from '../lib/entre-anos'

const { eleicoesDisponiveis } = useSelecaoEleicao()

const anosDisponiveis = computed(() => {
  const porAno = new Map()
  for (const eleicao of eleicoesDisponiveis.value) {
    const presidente = (eleicao.cargos ?? []).some((c) => String(c.ds_cargo_pergunta).toLowerCase() === 'presidente')
    if (!presidente) continue
    porAno.set(eleicao.ano_eleicao, Boolean(porAno.get(eleicao.ano_eleicao) || eleicao.dt_pleito))
  }
  return [...porAno].map(([ano, habilitado]) => ({ ano, habilitado })).sort((a, b) => a.ano - b.ano)
})

const selecionados = ref([])
const turno = ref(1)
const query = useComparacaoAnos(selecionados)
const resposta = computed(() => query.data.value ?? null)
const turnos = computed(() => {
  const lista = turnosDisponiveis(resposta.value)
  return lista.length > 0 ? lista : [1, 2]
})
const avisos = computed(() => (resposta.value?.avisos ?? []).filter((a) => a.codigo === 'SEM_HORARIO'))

function alternarAno(ano) {
  selecionados.value = selecionados.value.includes(ano)
    ? selecionados.value.filter((item) => item !== ano)
    : [...selecionados.value, ano].sort((a, b) => a - b)
}

function teclaTurno(evento) {
  const lista = turnos.value
  const i = lista.indexOf(turno.value)
  const alvo = { ArrowRight: lista[(i + 1) % lista.length], ArrowLeft: lista[(i - 1 + lista.length) % lista.length], Home: lista[0], End: lista.at(-1) }[evento.key]
  if (alvo === undefined) return
  evento.preventDefault()
  turno.value = alvo
}

const votos = computed(() => seriesDoTurno(resposta.value, turno.value, 'votos'))
const percentual = computed(() => seriesDoTurno(resposta.value, turno.value, 'pct_acumulada'))
const difVotos = computed(() => diferencasDoTurno(resposta.value, turno.value, 'votos'))
const difPercentual = computed(() => diferencasDoTurno(resposta.value, turno.value, 'pct_acumulada'))
const correlacao = computed(() => linhasCorrelacao(resposta.value, turno.value))
const numero = (v, casas) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }))
</script>

<template>
  <section class="painel" aria-labelledby="entre-anos-titulo" :aria-busy="query.isFetching.value">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">Entre anos</p>
        <h2 id="entre-anos-titulo">Presidente · encerramento das urnas</h2>
      </div>
      <div class="segmented" role="group" aria-label="Anos">
        <button
          v-for="a in anosDisponiveis"
          :key="a.ano"
          type="button"
          :aria-pressed="selecionados.includes(a.ano)"
          :class="{ ativo: selecionados.includes(a.ano) }"
          :disabled="!a.habilitado"
          @click="alternarAno(a.ano)"
        >
          {{ a.ano }}
        </button>
      </div>
    </header>

    <p v-for="aviso in avisos" :key="aviso.ano" class="nota" role="status">{{ aviso.ano }}: SEM_HORARIO</p>

    <div v-if="selecionados.length < 2" class="vazio">Selecione dois ou mais anos.</div>
    <StateBlock v-else-if="query.isLoading.value" estado="carregando" titulo="Comparando anos" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      titulo="Não foi possível comparar os anos"
      :descricao="query.error.value.message"
      acao="Tentar novamente"
      @acao="query.refetch()"
    />
    <template v-else-if="resposta">
      <div class="abas" role="tablist" aria-label="Turno" @keydown="teclaTurno">
        <button
          v-for="t in turnos"
          :id="`aba-turno-${t}`"
          :key="t"
          type="button"
          role="tab"
          :aria-selected="turno === t"
          :tabindex="turno === t ? 0 : -1"
          :class="{ ativo: turno === t }"
          @click="turno = t"
        >
          {{ t }}º Turno
        </button>
      </div>

      <div role="tabpanel" :aria-labelledby="`aba-turno-${turno}`" :class="{ atualizando: query.isFetching.value }">
        <div v-if="votos.length === 0" class="vazio">Sem dados neste turno.</div>
        <template v-else>
          <CurvasAnos titulo="Votos por intervalo" escala="log" :series="votos" />
          <CurvasAnos titulo="Diferença dos votos por intervalo" :series="difVotos" />
          <CurvasAnos titulo="Porcentagem acumulada" escala="linear" :series="percentual" />
          <CurvasAnos titulo="Diferença da porcentagem acumulada" :series="difPercentual" />

          <div class="tabela-scroll">
            <table>
              <caption class="sr-only">Correlação entre anos</caption>
              <thead>
                <tr>
                  <th scope="col">Anos</th>
                  <th scope="col" class="num">Turno</th>
                  <th scope="col">Candidato</th>
                  <th scope="col" class="num">r (votos)</th>
                  <th scope="col" class="num">p (votos)</th>
                  <th scope="col" class="num">r (acumulada)</th>
                  <th scope="col" class="num">p (acumulada)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(l, i) in correlacao" :key="i">
                  <td>{{ l.anos }}</td>
                  <td class="num">{{ l.turno }}</td>
                  <td>{{ l.candidato }}</td>
                  <td class="num">{{ numero(l.votos?.r, 3) }}</td>
                  <td class="num">{{ numero(l.votos?.p_valor, 4) }}</td>
                  <td class="num">{{ numero(l.pct?.r, 3) }}</td>
                  <td class="num">{{ numero(l.pct?.p_valor, 4) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </template>
  </section>
</template>
