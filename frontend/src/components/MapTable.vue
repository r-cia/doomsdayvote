<script setup>
import { computed, nextTick, ref } from 'vue'
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
})

const emit = defineEmits(['select'])

const tabela = ref(null)
const pagina = ref(1)
const ordenacao = ref({ coluna: 'total', direcao: 'desc' })
const porPagina = 25
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

const linhasBase = computed(() =>
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

const linhas = computed(() => {
  const lista = [...linhasBase.value]
  const { coluna, direcao } = ordenacao.value
  lista.sort((a, b) => {
    let va = a[coluna], vb = b[coluna]
    if (va == null) va = ''
    if (vb == null) vb = ''
    if (typeof va === 'string') return direcao === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    return direcao === 'asc' ? va - vb : vb - va
  })
  return lista
})

function alternar(coluna) {
  if (ordenacao.value.coluna === coluna) {
    ordenacao.value = { coluna, direcao: ordenacao.value.direcao === 'asc' ? 'desc' : 'asc' }
  } else {
    ordenacao.value = { coluna, direcao: 'asc' }
  }
}

function seta(coluna) {
  if (ordenacao.value.coluna !== coluna) return ''
  return ordenacao.value.direcao === 'asc' ? ' ↑' : ' ↓'
}
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
        <h2 id="tabela-mapa-titulo">Detalhes</h2>
      </div>
      <span class="contador">{{ linhas.length }} áreas</span>
    </div>

    <p v-if="linhas.length === 0" class="vazio">
      {{ $t('comum.semDados') }}
    </p>

    <div v-else class="tabela-scroll">
      <table ref="tabela">
        <caption class="sr-only">
          Votos por {{ nivel === 'uf' ? 'UF' : 'município' }}, líder e participação
        </caption>
        <thead>
          <tr>
            <th scope="col" class="ordenavel" @click="alternar('rotulo')">{{ nivel === 'uf' ? 'UF' : 'Município' }}{{ seta('rotulo') }}</th>
            <th scope="col" class="num ordenavel" @click="alternar('total')">Votos{{ seta('total') }}</th>
            <th scope="col" class="num ordenavel" @click="alternar('validos')">Válidos{{ seta('validos') }}</th>
            <th scope="col" class="ordenavel" @click="alternar('liderNome')">Líder{{ seta('liderNome') }}</th>
            <th scope="col" class="num ordenavel" @click="alternar('liderPercentual')">% líder{{ seta('liderPercentual') }}</th>
            <th v-if="candidato" scope="col" class="num ordenavel" @click="alternar('candidatoVotos')">Votos do candidato{{ seta('candidatoVotos') }}</th>
            <th v-if="candidato" scope="col" class="num ordenavel" @click="alternar('candidatoPercentual')">% do candidato{{ seta('candidatoPercentual') }}</th>
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
    </div>

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
