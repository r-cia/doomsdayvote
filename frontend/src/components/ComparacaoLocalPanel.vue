<script setup>
import { computed } from 'vue'
import StateBlock from './StateBlock.vue'

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['retry'])

const grupos = computed(() => props.dados?.grupos ?? [])
const cobertura = computed(() => props.dados?.cobertura ?? null)

function formatPercentual(valor) {
  if (valor === null || valor === undefined) return '—'
  return `${(valor * 100).toFixed(2)}%`
}
</script>

<template>
  <section class="painel" aria-labelledby="comparacao-local-titulo">
    <header class="painel__cabecalho">
      <h2 id="comparacao-local-titulo">Comparação local entre seções semelhantes</h2>
      <p class="painel__meta">
        {{ grupos.length }} grupos ·
        {{ cobertura?.com_grupo ?? 0 }} seções com grupo
      </p>
    </header>

    <StateBlock v-if="loading" estado="carregando" titulo="Carregando" />
    <StateBlock v-else-if="error" estado="erro" titulo="Erro" :descricao="error" acao="Tentar novamente" @acao="emit('retry')" />
    <div v-else-if="grupos.length === 0" class="vazio">
      Nenhum grupo comparável no recorte.
    </div>
    <div v-else class="grupos">
      <article v-for="(grupo, indice) in grupos" :key="grupo.chave ?? indice" class="grupo">
        <header class="grupo__cabecalho">
          <h3>{{ grupo.nivel }} · {{ grupo.tamanho }} seções</h3>
          <span v-if="grupo.dados_insuficientes" class="estado">dados_insuficientes</span>
        </header>
        <ul class="grupo__secoes">
          <li v-for="item in grupo.secoes" :key="item.secao.id">
            Zona {{ item.secao.nr_zona }} · Seção {{ item.secao.nr_secao }} —
            participação {{ formatPercentual(item.metricas.participacao) }},
            abstenção {{ formatPercentual(item.metricas.abstencao) }}
            <span v-if="item.distancia_pp?.participacao_pp !== null">
              ({{ item.distancia_pp.participacao_pp?.toFixed(2) }} pp)
            </span>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>