<script setup>
import { computed, ref } from 'vue'
import StateBlock from './StateBlock.vue'
import TabelaScroll from './TabelaScroll.vue'
import { linhasMapa, nominaisNaOrdemDoServidor } from '../lib/agregacoes'
import { useOrdenacao } from '../composables/ordenacao'
import { corPartido, corTextoContraste } from '../lib/colors'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  areas: { type: Array, default: () => [] },
  candidatos: { type: Array, default: () => [] },
  votos: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  atualizando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  ufSelecionada: { type: String, default: null },
  ordenacao: { type: Object, default: () => useOrdenacao() },
  ordenacaoVotos: { type: Object, default: () => useOrdenacao() },
})

defineEmits(['select', 'municipios', 'retry', 'limpar'])

const agrupar = ref('nenhum')
const { alternar, ariaSort, seta } = props.ordenacao
const {
  alternar: alternarVotos,
  ariaSort: ariaSortVotos,
  seta: setaVotos,
} = props.ordenacaoVotos

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
  return base.map((linha) => ({
    ...linha,
    largura: Math.max(0, Math.min(100, Number(linha.liderPercentual ?? 0))),
  }))
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

const votosUf = computed(() => nominaisNaOrdemDoServidor(props.votos))
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

    <TabelaScroll v-else-if="ufSelecionada" class="uf-painel__scroll" :atualizando="atualizando">
      <table>
        <caption class="sr-only">Votos por candidato em {{ ufSelecionada }}</caption>
        <thead>
          <tr>
            <th scope="col" class="ordenavel" :aria-sort="ariaSortVotos('nm_votavel')"><button type="button" @click="alternarVotos('nm_votavel')">Candidato{{ setaVotos('nm_votavel') }}</button></th>
            <th scope="col" class="ordenavel" :aria-sort="ariaSortVotos('sg_partido')"><button type="button" @click="alternarVotos('sg_partido')">Partido{{ setaVotos('sg_partido') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSortVotos('qt_votos')"><button type="button" @click="alternarVotos('qt_votos')">Votos{{ setaVotos('qt_votos') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSortVotos('percentual')"><button type="button" @click="alternarVotos('percentual')">% válidos{{ setaVotos('percentual') }}</button></th>
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
    </TabelaScroll>

    <p v-else-if="linhas.length === 0" class="vazio">
      {{ $t('mapa.semDadosUf') }}
    </p>

    <TabelaScroll v-else-if="agrupar === 'regiao' && grupos" class="uf-painel__scroll" :atualizando="atualizando">
      <table>
        <caption class="sr-only">Resumo de votos e líder por UF agrupado por região</caption>
        <thead>
          <tr>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('sg_uf')"><button type="button" @click="alternar('sg_uf')">UF{{ seta('sg_uf') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('total_votos')"><button type="button" @click="alternar('total_votos')">Votos{{ seta('total_votos') }}</button></th>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('lider_nome')"><button type="button" @click="alternar('lider_nome')">Líder{{ seta('lider_nome') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('lider_percentual')"><button type="button" @click="alternar('lider_percentual')">% líder{{ seta('lider_percentual') }}</button></th>
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
    </TabelaScroll>

    <TabelaScroll v-else class="uf-painel__scroll" :atualizando="atualizando">
      <table>
        <caption class="sr-only">Resumo de votos e líder por UF</caption>
        <thead>
          <tr>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('sg_uf')"><button type="button" @click="alternar('sg_uf')">UF{{ seta('sg_uf') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('total_votos')"><button type="button" @click="alternar('total_votos')">Votos{{ seta('total_votos') }}</button></th>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('lider_nome')"><button type="button" @click="alternar('lider_nome')">Líder{{ seta('lider_nome') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('lider_percentual')"><button type="button" @click="alternar('lider_percentual')">% líder{{ seta('lider_percentual') }}</button></th>
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
    </TabelaScroll>
  </section>
</template>
