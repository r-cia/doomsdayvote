<script setup>
import { computed } from 'vue'
import StateBlock from './StateBlock.vue'
import TabelaScroll from './TabelaScroll.vue'
import { formatarDataHora, formatarValor } from '../lib/format'

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  atualizando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  tamanho: { type: Number, default: 25 },
})

const emit = defineEmits(['retry', 'update:page'])

const itens = computed(() => props.dados?.itens ?? [])
const total = computed(() => Number(props.dados?.total ?? 0))
const pagina = computed(() => Number(props.dados?.pagina ?? 1))
const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(total.value / Math.max(1, props.tamanho))),
)

function local(item) {
  const zona = formatarValor(item.nr_zona)
  const secao = formatarValor(item.nr_secao)
  return `${formatarValor(item.sg_uf)} · ${formatarValor(item.cd_municipio_tse)} · ${zona}/${secao}`
}

function irPara(destino) {
  emit('update:page', Math.min(Math.max(1, destino), totalPaginas.value))
}
</script>

<template>
  <section class="painel" aria-labelledby="incidentes-titulo">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">{{ $t('totalizacao.titulo') }}</p>
        <h2 id="incidentes-titulo">{{ $t('totalizacao.incidentes') }}</h2>
      </div>
    </header>

    <StateBlock
      v-if="loading && !dados"
      estado="carregando"
      :titulo="$t('comum.carregando')"
    />
    <StateBlock
      v-else-if="error"
      estado="erro"
      :titulo="$t('comum.erro')"
      :descricao="error"
      :acao="$t('comum.tentarNovamente')"
      @acao="emit('retry')"
    />
    <StateBlock
      v-else-if="itens.length === 0"
      estado="vazio"
      :titulo="$t('comum.semDados')"
      :descricao="$t('totalizacao.incidentesVazio')"
    />

    <template v-else>
      <TabelaScroll :atualizando="atualizando">
        <table class="tabela">
          <caption class="sr-only">{{ $t('totalizacao.incidentes') }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ $t('totalizacao.instante') }}</th>
              <th scope="col">{{ $t('totalizacao.nivel') }}</th>
              <th scope="col">{{ $t('totalizacao.tipo') }}</th>
              <th scope="col">{{ $t('totalizacao.secao') }}</th>
              <th scope="col">{{ $t('totalizacao.textoOriginal') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, indice) in itens" :key="`${item.instante}-${indice}`">
              <td>{{ formatarDataHora(item.instante) }}</td>
              <td>{{ formatarValor(item.nivel) }}</td>
              <td>{{ formatarValor(item.tipo) }}</td>
              <td>{{ local(item) }}</td>
              <td class="totalizacao-texto">{{ formatarValor(item.texto_original) }}</td>
            </tr>
          </tbody>
        </table>
      </TabelaScroll>

      <nav class="paginacao" :aria-label="$t('totalizacao.paginacaoIncidentesAria')">
        <span>{{ $t('paginacao.pagina', { atual: pagina, total: totalPaginas }) }}</span>
        <div class="paginacao__botoes">
          <button
            type="button"
            class="button button--ghost button--compacto"
            :disabled="pagina <= 1"
            @click="irPara(1)"
          >
            {{ $t('paginacao.primeira') }}
          </button>
          <button
            type="button"
            class="button button--ghost button--compacto"
            :disabled="pagina <= 1"
            @click="irPara(pagina - 1)"
          >
            {{ $t('paginacao.anterior') }}
          </button>
          <button
            type="button"
            class="button button--ghost button--compacto"
            :disabled="pagina >= totalPaginas"
            @click="irPara(pagina + 1)"
          >
            {{ $t('paginacao.proxima') }}
          </button>
          <button
            type="button"
            class="button button--ghost button--compacto"
            :disabled="pagina >= totalPaginas"
            @click="irPara(totalPaginas)"
          >
            {{ $t('paginacao.ultima') }}
          </button>
        </div>
      </nav>
    </template>
  </section>
</template>
