<script setup>
import { computed } from 'vue'
import MapTable from './MapTable.vue'
import StateBlock from './StateBlock.vue'
import { candidatosNominais } from '../lib/agregacoes'
import { corPartido, corTextoContraste } from '../lib/colors'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  areas: { type: Array, default: () => [] },
  candidatos: { type: Array, default: () => [] },
  votos: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  ufSelecionada: { type: String, default: null },
  nivel: { type: String, default: 'uf' },
  modo: { type: String, default: 'lider' },
  candidato: { type: Number, default: null },
  uf: { type: String, default: null },
})

const emit = defineEmits(['select', 'municipios', 'retry', 'limpar'])

const votosUf = computed(() => candidatosNominais(props.votos))

function aoSelecionarArea(selecao) {
  if (!selecao) return
  if (selecao.tipo === 'uf') {
    emit('select', selecao.valor)
    return
  }
  if (selecao.tipo === 'municipio') {
    emit('municipios', selecao.uf ?? props.ufSelecionada ?? selecao.valor)
  }
}
</script>

<template>
  <section class="card uf-painel" aria-labelledby="uf-painel-titulo">
    <div class="card__cabecalho">
      <div>
        <h2 id="uf-painel-titulo">
          {{ ufSelecionada ? `Votos em ${ufSelecionada}` : 'Painel por UF' }}
        </h2>
      </div>
      <div class="uf-painel__acoes">
        <button
          v-if="ufSelecionada"
          type="button"
          class="button button--ghost button--compacto"
          @click="$emit('municipios', ufSelecionada)"
        >
          Municípios
        </button>
        <button
          v-if="ufSelecionada"
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
      titulo="Não foi possível carregar o painel por UF"
      :descricao="error"
      acao="Tentar novamente"
      @acao="$emit('retry')"
    />
    <StateBlock
      v-else-if="loading && linhas.length === 0"
      estado="carregando"
      titulo="Carregando painel por UF"
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
      <p v-if="votosUf.length === 0" class="vazio">Sem votos nesta UF no corte.</p>
    </div>

    <MapTable
      v-else
      :areas="areas"
      :nivel="nivel"
      :modo="modo"
      :candidato="candidato"
      :candidatos="candidatos"
      :uf="ufSelecionada ?? uf"
      @select="aoSelecionarArea"
    />
  </section>
</template>
