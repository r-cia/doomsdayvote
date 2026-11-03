<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import StateBlock from './StateBlock.vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { useComparacaoLocalSecoes } from '../composables/queries'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  chave: { type: String, required: true },
  ordenacao: { type: Object, default: null },
})
defineEmits(['ordenar'])

const query = useComparacaoLocalSecoes(
  () => props.chave,
  () => props.ordenacao,
)
const secoes = computed(() => query.data.value?.secoes ?? [])
const pct = (fracao) => (fracao === null || fracao === undefined ? null : fracao * 100)
const pp = (valor) => (valor === null || valor === undefined ? '—' : `${formatarNumero(Math.round(valor * 100) / 100)} pp`)
</script>

<template>
  <StateBlock v-if="query.isLoading.value" estado="carregando" titulo="Carregando seções do grupo" />
  <StateBlock
    v-else-if="query.error.value"
    estado="erro"
    titulo="Não foi possível carregar as seções do grupo"
    :descricao="query.error.value.message"
    acao="Tentar novamente"
    @acao="query.refetch()"
  />
  <div v-else class="tabela-scroll" :class="{ atualizando: query.isFetching.value }">
    <table>
      <thead>
        <tr>
          <ThOrdenavel coluna="nm_municipio" :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">Município</ThOrdenavel>
          <ThOrdenavel coluna="nr_zona" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">Zona</ThOrdenavel>
          <ThOrdenavel coluna="nr_secao" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">Seção</ThOrdenavel>
          <ThOrdenavel coluna="participacao" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">Participação</ThOrdenavel>
          <ThOrdenavel coluna="abstencao" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">Abstenção</ThOrdenavel>
          <ThOrdenavel coluna="participacao_pp" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">Distância da mediana (participação)</ThOrdenavel>
          <ThOrdenavel coluna="abstencao_pp" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">Distância da mediana (abstenção)</ThOrdenavel>
          <th scope="col"><span class="sr-only">Abrir</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in secoes" :key="s.secao.id">
          <td>{{ s.secao.nm_municipio || s.secao.cd_municipio_tse }}</td>
          <td class="num">{{ s.secao.nr_zona }}</td>
          <td class="num">{{ s.secao.nr_secao }}</td>
          <td class="num">{{ formatarPercentual(pct(s.metricas?.participacao)) }}</td>
          <td class="num">{{ formatarPercentual(pct(s.metricas?.abstencao)) }}</td>
          <td class="num">{{ pp(s.distancia_pp?.participacao_pp) }}</td>
          <td class="num">{{ pp(s.distancia_pp?.abstencao_pp) }}</td>
          <td><RouterLink class="button button--ghost button--compacto" :to="`/secoes/${s.secao.id}`">Abrir seção</RouterLink></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
