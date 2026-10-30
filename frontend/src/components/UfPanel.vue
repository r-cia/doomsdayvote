<script setup>
import { computed, ref } from 'vue'
import StateBlock from './StateBlock.vue'
import { candidatosNominais, linhasMapa } from '../lib/agregacoes'
import { corPartido, corTextoContraste } from '../lib/colors'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  areas: { type: Array, default: () => [] },
  candidatos: { type: Array, default: () => [] },
  votos: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  ufSelecionada: { type: String, default: null },
})

defineEmits(['select', 'municipios', 'retry', 'limpar'])

const ordenacao = ref({ coluna: 'total', direcao: 'desc' })
const agrupar = ref('nenhum')

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

const REGIOES = {
  Norte: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  Nordeste: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
  Sudeste: ['ES', 'MG', 'RJ', 'SP'],
  Sul: ['PR', 'RS', 'SC'],
}

function regiaoDe(uf) {
  for (const [nome, lista] of Object.entries(REGIOES)) {
    if (lista.includes(uf)) return nome
  }
  return 'Outros'
}

const partidoPorNumero = computed(() => {
  const mapa = new Map()
  for (const candidato of props.candidatos) {
    mapa.set(candidato.nr_votavel, candidato)
  }
  return mapa
})

const linhas = computed(() => {
  const base = linhasMapa(props.areas, 'uf').map(({ area }) => {
    const candidato = partidoPorNumero.value.get(area.lider?.nr_votavel)
    return {
      uf: area.sg_uf,
      regiao: regiaoDe(area.sg_uf),
      total: Number(area.total_votos ?? 0),
      lider: area.lider,
      liderNome: candidato?.nm_votavel ?? null,
      liderSigla: candidato?.sg_partido ?? null,
      liderPercentual: area.lider?.percentual ?? null,
    }
  })
  const comLargura = base.map((linha) => ({
    ...linha,
    largura: Math.max(0, Math.min(100, Number(linha.liderPercentual ?? 0))),
  }))
  const lista = [...comLargura]
  const { coluna, direcao } = ordenacao.value
  lista.sort((a, b) => {
    let va, vb
    if (coluna === 'uf') { va = a.uf ?? ''; vb = b.uf ?? '' }
    else if (coluna === 'total') { va = a.total; vb = b.total }
    else if (coluna === 'liderNome') { va = a.liderNome ?? ''; vb = b.liderNome ?? '' }
    else if (coluna === 'liderPercentual') { va = a.liderPercentual ?? -1; vb = b.liderPercentual ?? -1 }
    else { va = a[coluna]; vb = b[coluna] }
    if (typeof va === 'string') return direcao === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    return direcao === 'asc' ? va - vb : vb - va
  })
  return lista
})

const grupos = computed(() => {
  if (agrupar.value !== 'regiao' || props.ufSelecionada) return null
  const ordem = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul', 'Outros']
  const mapa = new Map()
  for (const linha of linhas.value) {
    if (!mapa.has(linha.regiao)) mapa.set(linha.regiao, [])
    mapa.get(linha.regiao).push(linha)
  }
  return ordem
    .filter((r) => mapa.has(r))
    .map((r) => ({ nome: r, itens: mapa.get(r) }))
})

const votosUf = computed(() => candidatosNominais(props.votos))
</script>

<template>
  <section class="card uf-painel" aria-labelledby="uf-painel-titulo">
    <div class="card__cabecalho">
      <div>
        <h2 id="uf-painel-titulo">
          {{ ufSelecionada ? `${$t('mapa.ufPainel')} ${ufSelecionada}` : $t('mapa.ufPainel') }}
        </h2>
      </div>
      <div class="uf-painel__acoes">
        <select v-if="!ufSelecionada" v-model="agrupar" class="uf-ordenacao">
          <option value="nenhum">{{ $t("biometria.semAgrupamento") }}</option>
          <option value="regiao">Por região</option>
        </select>
        <button
          v-if="ufSelecionada"
          type="button"
          class="button button--ghost button--compacto"
          @click="$emit('municipios', ufSelecionada)"
        >
          Municípios
        </button>
        <button
          type="button"
          class="button button--ghost button--compacto"
          @click="$emit('limpar')"
        >
          Brasil
        </button>
        <span class="contador">
          {{ ufSelecionada ? `${votosUf.length} candidatos` : `${linhas.length} UFs` }}
        </span>
      </div>
    </div>

    <StateBlock
      v-if="error"
      estado="erro"
      :titulo="$t('comum.erro')"
      :descricao="error"
      :acao="$t('comum.tentarNovamente')"
      @acao="$emit('retry')"
    />
    <StateBlock
      v-else-if="loading && linhas.length === 0"
      estado="carregando"
      :titulo="$t('comum.carregando')"
    />

    <div v-else-if="ufSelecionada" class="tabela-scroll uf-painel__scroll">
      <table>
        <caption class="sr-only">Votos por candidato em {{ ufSelecionada }}</caption>
        <thead>
          <tr>
            <th scope="col">Candidato</th>
            <th scope="col">Partido</th>
            <th scope="col" class="num">Votos</th>
            <th scope="col" class="num">% válidos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidato in votosUf" :key="candidato.nr_votavel">
            <td>{{ candidato.nm_votavel }}</td>
            <td>
              <span
                class="party-dot party-dot--mini"
                :style="{
                  backgroundColor: corPartido(candidato.sg_partido),
                  color: corTextoContraste(corPartido(candidato.sg_partido)),
                }"
              >{{ candidato.sg_partido ?? '—' }}</span>
            </td>
            <td class="num">{{ formatarNumero(candidato.qt_votos) }}</td>
            <td class="num">{{ formatarPercentual(candidato.percentual) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="votosUf.length === 0" class="vazio">{{ $t('comum.semDados') }}</p>
    </div>

    <p v-else-if="linhas.length === 0" class="vazio">
      {{ $t('mapa.semDadosUf') }}
    </p>

    <div v-else-if="agrupar === 'regiao' && grupos" class="tabela-scroll uf-painel__scroll">
      <table>
        <caption class="sr-only">Resumo de votos e líder por UF agrupado por região</caption>
        <thead>
          <tr>
            <th scope="col" class="ordenavel" @click="alternar('uf')">UF{{ seta('uf') }}</th>
            <th scope="col" class="num ordenavel" @click="alternar('total')">Votos{{ seta('total') }}</th>
            <th scope="col" class="ordenavel" @click="alternar('liderNome')">Líder{{ seta('liderNome') }}</th>
            <th scope="col" class="num ordenavel" @click="alternar('liderPercentual')">% líder{{ seta('liderPercentual') }}</th>
            <th scope="col"><span class="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="grupo in grupos" :key="grupo.nome">
            <tr>
              <th colspan="5" class="uf-grupo">{{ grupo.nome }}</th>
            </tr>
            <tr
              v-for="linha in grupo.itens"
              :key="linha.uf"
              :class="{ 'linha--ativa': ufSelecionada === linha.uf }"
            >
              <th scope="row">
                <button
                  type="button"
                  class="uf-botao"
                  :aria-pressed="ufSelecionada === linha.uf"
                  @click="$emit('select', linha.uf)"
                >
                  {{ linha.uf }}
                </button>
              </th>
              <td class="num">
                <span class="uf-votos">{{ formatarNumero(linha.total) }}</span>
                <span class="uf-barra" aria-hidden="true">
                  <span :style="{ width: `${linha.largura}%` }"></span>
                </span>
              </td>
              <td>
                <span v-if="linha.lider" class="lider">
                  <span
                    v-if="linha.liderSigla"
                    class="party-dot party-dot--mini"
                    :style="{
                      backgroundColor: corPartido(linha.liderSigla),
                      color: corTextoContraste(corPartido(linha.liderSigla)),
                    }"
                  >{{ linha.liderSigla }}</span>
                  {{ linha.liderNome ?? `Candidato ${linha.lider.nr_votavel}` }}
                </span>
                <span v-else>—</span>
              </td>
              <td class="num">{{ formatarPercentual(linha.liderPercentual) }}</td>
              <td>
                <button
                  type="button"
                  class="button button--ghost button--compacto"
                  :aria-label="`Ver municípios de ${linha.uf}`"
                  @click="$emit('municipios', linha.uf)"
                >
                  Municípios
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-else class="tabela-scroll uf-painel__scroll">
      <table>
        <caption class="sr-only">Resumo de votos e líder por UF</caption>
        <thead>
          <tr>
            <th scope="col" class="ordenavel" @click="alternar('uf')">UF{{ seta('uf') }}</th>
            <th scope="col" class="num ordenavel" @click="alternar('total')">Votos{{ seta('total') }}</th>
            <th scope="col" class="ordenavel" @click="alternar('liderNome')">Líder{{ seta('liderNome') }}</th>
            <th scope="col" class="num ordenavel" @click="alternar('liderPercentual')">% líder{{ seta('liderPercentual') }}</th>
            <th scope="col"><span class="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="linha in linhas"
            :key="linha.uf"
            :class="{ 'linha--ativa': ufSelecionada === linha.uf }"
          >
            <th scope="row">
              <button
                type="button"
                class="uf-botao"
                :aria-pressed="ufSelecionada === linha.uf"
                @click="$emit('select', linha.uf)"
              >
                {{ linha.uf }}
              </button>
            </th>
            <td class="num">
              <span class="uf-votos">{{ formatarNumero(linha.total) }}</span>
              <span class="uf-barra" aria-hidden="true">
                <span :style="{ width: `${linha.largura}%` }"></span>
              </span>
            </td>
            <td>
              <span v-if="linha.lider" class="lider">
                <span
                  v-if="linha.liderSigla"
                  class="party-dot party-dot--mini"
                  :style="{
                    backgroundColor: corPartido(linha.liderSigla),
                    color: corTextoContraste(corPartido(linha.liderSigla)),
                  }"
                >{{ linha.liderSigla }}</span>
                {{ linha.liderNome ?? `Candidato ${linha.lider.nr_votavel}` }}
              </span>
              <span v-else>—</span>
            </td>
            <td class="num">{{ formatarPercentual(linha.liderPercentual) }}</td>
            <td>
              <button
                type="button"
                class="button button--ghost button--compacto"
                :aria-label="`Ver municípios de ${linha.uf}`"
                @click="$emit('municipios', linha.uf)"
              >
                Municípios
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
