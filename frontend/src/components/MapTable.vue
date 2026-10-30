<script setup>
import { computed, nextTick, ref } from 'vue'
import TabelaScroll from './TabelaScroll.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { candidatoDaArea, linhasMapa } from '../lib/agregacoes'
import { corDaArea, corPartido, corTextoContraste } from '../lib/colors'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  areas: { type: Array, default: () => [] },
  nivel: { type: String, default: 'uf' },
  modo: { type: String, default: 'lider' },
  candidato: { type: Number, default: null },
  candidatos: { type: Array, default: () => [] },
  uf: { type: String, default: null },
  atualizando: { type: Boolean, default: false },
  ordenacao: { type: Object, default: () => useOrdenacao() },
})

const emit = defineEmits(['select'])

const tabela = ref(null)
const pagina = ref(1)
const { ariaSort, seta } = props.ordenacao
const porPagina = 25
const colunaRotulo = computed(() => (props.nivel === 'uf' ? 'sg_uf' : 'nm_municipio'))

function alternar(coluna) {
  props.ordenacao.alternar(coluna)
  pagina.value = 1
}
const partidoPorNumero = computed(() => {
  const mapa = new Map()
  for (const candidato of props.candidatos) {
    mapa.set(candidato.nr_votavel, candidato)
  }
  return mapa
})

function nomeCandidato(numero) {
  return partidoPorNumero.value.get(numero)?.nm_votavel ?? `Candidato ${numero}`
}

function siglaCandidato(numero) {
  return partidoPorNumero.value.get(numero)?.sg_partido ?? null
}

const linhas = computed(() =>
  linhasMapa(props.areas, props.nivel).map(({ chave, area }) => {
    const lider = area.lider
    const candidatoArea = candidatoDaArea(area, props.candidato)
    return {
      chave,
      area,
      rotulo: props.nivel === 'uf' ? area.sg_uf : (area.nm_municipio || `Município ${chave}`),
      total: Number(area.total_votos ?? 0),
      validos: Number(area.votos_validos ?? 0),
      liderNome: lider ? nomeCandidato(lider.nr_votavel) : '—',
      liderSigla: lider ? siglaCandidato(lider.nr_votavel) : null,
      liderPercentual: lider?.percentual ?? null,
      candidatoVotos: candidatoArea?.qt_votos ?? null,
      candidatoPercentual: candidatoArea?.percentual ?? null,
      cor: corDaArea(area, props.modo, props.candidato, partidoPorNumero.value),
    }
  }),
)

const totalPaginas = computed(() => Math.max(1, Math.ceil(linhas.value.length / porPagina)))
const linhasPagina = computed(() => {
  if (pagina.value > totalPaginas.value) pagina.value = totalPaginas.value
  const inicio = (pagina.value - 1) * porPagina
  return linhas.value.slice(inicio, inicio + porPagina)
})

function irPara(p) {
  pagina.value = Math.min(Math.max(1, p), totalPaginas.value)
}

function selecionar(area) {
  if (!area) return
  if (props.nivel === 'uf') {
    emit('select', { tipo: 'uf', valor: area.sg_uf })
    return
  }
  emit('select', {
    tipo: 'municipio',
    valor: area.cd_municipio_tse,
    uf: props.uf,
  })
}

function navegarLinhas(evento) {
  const botoes = [...(tabela.value?.querySelectorAll('[data-area-btn]') ?? [])]
  if (botoes.length === 0) return
  const atual = botoes.indexOf(document.activeElement)
  let destino = atual

  if (evento.key === 'ArrowDown') destino = Math.min(botoes.length - 1, atual + 1)
  else if (evento.key === 'ArrowUp') destino = Math.max(0, atual - 1)
  else if (evento.key === 'Home') destino = 0
  else if (evento.key === 'End') destino = botoes.length - 1
  else return

  evento.preventDefault()
  botoes[destino]?.focus()
}

function aoClicarLinha(linha) {
  selecionar(linha.area)
  nextTick(() => {
    const botao = tabela.value?.querySelector(`[data-area-btn="${linha.chave}"]`)
    botao?.focus()
  })
}
</script>

<template>
  <section class="card tabela-mapa" aria-labelledby="tabela-mapa-titulo">
    <div class="card__cabecalho">
      <div>
        <h2 id="tabela-mapa-titulo">{{ $t("comum.detalhe") }}</h2>
      </div>
      <span class="contador">{{ linhas.length }} áreas</span>
    </div>

    <p v-if="linhas.length === 0" class="vazio">
      {{ $t('comum.semDados') }}
    </p>

    <TabelaScroll v-else :atualizando="atualizando">
      <table ref="tabela">
        <caption class="sr-only">
          Votos por {{ nivel === 'uf' ? 'UF' : 'município' }}, líder e participação
        </caption>
        <thead>
          <tr>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort(colunaRotulo)"><button type="button" @click="alternar(colunaRotulo)">{{ nivel === 'uf' ? 'UF' : 'Município' }}{{ seta(colunaRotulo) }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('total_votos')"><button type="button" @click="alternar('total_votos')">Votos{{ seta('total_votos') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('votos_validos')"><button type="button" @click="alternar('votos_validos')">Válidos{{ seta('votos_validos') }}</button></th>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('lider_nome')"><button type="button" @click="alternar('lider_nome')">Líder{{ seta('lider_nome') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('lider_percentual')"><button type="button" @click="alternar('lider_percentual')">% líder{{ seta('lider_percentual') }}</button></th>
            <th v-if="candidato" scope="col" class="num ordenavel" :aria-sort="ariaSort('candidato_votos')"><button type="button" @click="alternar('candidato_votos')">Votos do candidato{{ seta('candidato_votos') }}</button></th>
            <th v-if="candidato" scope="col" class="num ordenavel" :aria-sort="ariaSort('candidato_percentual')"><button type="button" @click="alternar('candidato_percentual')">% do candidato{{ seta('candidato_percentual') }}</button></th>
            <th scope="col"><span class="sr-only">Ação</span></th>
          </tr>
        </thead>
        <tbody @keydown="navegarLinhas">
          <tr v-for="linha in linhasPagina" :key="linha.chave">
            <th scope="row">
              <span class="area-rotulo">
                <span
                  class="area-cor"
                  :style="{ backgroundColor: linha.cor }"
                  aria-hidden="true"
                ></span>
                {{ linha.rotulo }}
              </span>
            </th>
            <td class="num">{{ formatarNumero(linha.total) }}</td>
            <td class="num">{{ formatarNumero(linha.validos) }}</td>
            <td>
              <span v-if="linha.liderSigla" class="lider">
                <span
                  class="party-dot party-dot--mini"
                  :style="{
                    backgroundColor: corPartido(linha.liderSigla),
                    color: corTextoContraste(corPartido(linha.liderSigla)),
                  }"
                >{{ linha.liderSigla }}</span>
                {{ linha.liderNome }}
              </span>
              <span v-else>—</span>
            </td>
            <td class="num">{{ formatarPercentual(linha.liderPercentual) }}</td>
            <td v-if="candidato" class="num">
              {{ formatarNumero(linha.candidatoVotos) }}
            </td>
            <td v-if="candidato" class="num">
              {{ formatarPercentual(linha.candidatoPercentual) }}
            </td>
            <td>
              <button
                type="button"
                class="button button--ghost button--compacto"
                :data-area-btn="linha.chave"
                :aria-label="`Selecionar ${linha.rotulo}`"
                @click="aoClicarLinha(linha)"
              >
                Selecionar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </TabelaScroll>

    <footer v-if="linhas.length > porPagina" class="paginacao">
      <span>Página {{ pagina }} de {{ totalPaginas }} · {{ linhas.length }} áreas</span>
      <div class="paginacao__botoes">
        <button
          type="button"
          class="button button--ghost button--compacto"
          :disabled="pagina === 1"
          @click="irPara(pagina - 1)"
        >
          Anterior
        </button>
        <button
          type="button"
          class="button button--ghost button--compacto"
          :disabled="pagina === totalPaginas"
          @click="irPara(pagina + 1)"
        >
          Próxima
        </button>
      </div>
    </footer>
  </section>
</template>
