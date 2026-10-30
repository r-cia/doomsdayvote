<script setup>
import { computed } from 'vue'
import StateBlock from './StateBlock.vue'
import CoberturaBlock from './CoberturaBlock.vue'

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['retry'])

const topShare = computed(() => props.dados?.top_share ?? props.dados?.top_por_share ?? [])
const topMargem = computed(() => props.dados?.top_margem ?? props.dados?.top_por_margem ?? [])
const cobertura = computed(() => props.dados?.cobertura ?? null)

function formatPercentual(valor) {
  if (valor === null || valor === undefined) return '—'
  return `${(valor * 100).toFixed(2)}%`
}

function formatNumero(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR')
}
</script>

<template>
  <section class="painel" aria-labelledby="concentracao-titulo">
    <header class="painel__cabecalho">
      <h2 id="concentracao-titulo">Concentração e margem por seção</h2>
      <p class="painel__meta">
        {{ topShare.length }} por participação · {{ topMargem.length }} por margem
      </p>
    </header>

    <StateBlock v-if="loading" estado="carregando" titulo="Carregando" />
    <StateBlock v-else-if="error" estado="erro" titulo="Erro" :descricao="error" acao="Tentar novamente" @acao="emit('retry')" />
    <div v-else-if="topShare.length === 0 && topMargem.length === 0" class="vazio">
      Nenhuma seção no recorte.
    </div>
    <div v-else class="grupos">
      <article class="grupo">
        <header class="grupo__cabecalho">
          <h3>Maior participação do candidato mais votado</h3>
        </header>
        <ul class="grupo__secoes">
          <li v-for="item in topShare" :key="item.secao?.id ?? item.id">
            Zona {{ item.secao?.nr_zona }} · Seção {{ item.secao?.nr_secao }} —
            participação {{ formatPercentual(item.share_lider) }},
            margem {{ formatNumero(item.margem_absoluta) }} votos
            <span v-if="item.contexto?.share_lider_percentil !== null">
              (percentil {{ item.contexto.share_lider_percentil?.toFixed(0) }})
            </span>
          </li>
        </ul>
      </article>
      <article class="grupo">
        <header class="grupo__cabecalho">
          <h3>Maior margem para o segundo colocado</h3>
        </header>
        <ul class="grupo__secoes">
          <li v-for="item in topMargem" :key="`m-${item.secao?.id ?? item.id}`">
            Zona {{ item.secao?.nr_zona }} · Seção {{ item.secao?.nr_secao }} —
            margem {{ formatNumero(item.margem_absoluta) }} votos
            ({{ item.margem_pp?.toFixed(2) }} pp),
            participação {{ formatPercentual(item.share_lider) }}
          </li>
        </ul>
      </article>
    </div>
    <CoberturaBlock :dados="dados" />
  </section>
</template>