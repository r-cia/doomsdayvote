<script setup>
import { computed } from 'vue'
import StateBlock from './StateBlock.vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { useComparacaoLocalSecoes } from '../composables/queries'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  chave: { type: String, required: true },
  ordenacao: { type: Object, default: null },
})
defineEmits(['ordenar', 'abrir-secao'])

const query = useComparacaoLocalSecoes(
  () => props.chave,
  () => props.ordenacao,
)
const secoes = computed(() => query.data.value?.secoes ?? [])
const pct = (fracao) => (fracao === null || fracao === undefined ? null : fracao * 100)
const pp = (valor) => (valor === null || valor === undefined ? '—' : `${formatarNumero(Math.round(valor * 100) / 100)} pp`)
</script>

<template>
  <StateBlock v-if="query.isLoading.value" estado="carregando" :titulo="$t('comparacaoLocal.carregandoGrupo')" />
  <StateBlock
    v-else-if="query.error.value"
    estado="erro"
    :titulo="$t('comparacaoLocal.erroGrupo')"
    :descricao="query.error.value.message"
    :acao="$t('comum.tentarNovamente')"
    @acao="query.refetch()"
  />
  <div v-else class="tabela-scroll" :class="{ atualizando: query.isFetching.value }" :aria-busy="query.isFetching.value">
    <span v-if="query.isFetching.value" class="sr-only" role="status">{{ $t('comum.carregando') }}</span>
    <table class="analise-tabela tabela-fixa">
      <colgroup>
        <col style="width: 6%" />
        <col style="width: 26%" />
        <col style="width: 8%" />
        <col style="width: 8%" />
        <col style="width: 11.5%" />
        <col style="width: 11.5%" />
        <col style="width: 11.5%" />
        <col style="width: 11.5%" />
        <col style="width: 6%" />
      </colgroup>
      <thead>
        <tr>
          <ThOrdenavel coluna="sg_uf" :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">{{ $t('comum.uf') }}</ThOrdenavel>
          <ThOrdenavel coluna="nm_municipio" :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">{{ $t('comum.municipio') }}</ThOrdenavel>
          <ThOrdenavel coluna="nr_zona" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">{{ $t('comum.zona') }}</ThOrdenavel>
          <ThOrdenavel coluna="nr_secao" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">{{ $t('comum.secao') }}</ThOrdenavel>
          <ThOrdenavel coluna="participacao" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">{{ $t('comparacaoLocal.participacao') }}</ThOrdenavel>
          <ThOrdenavel coluna="abstencao" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">{{ $t('comparacaoLocal.abstencao') }}</ThOrdenavel>
          <ThOrdenavel coluna="participacao_pp" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">{{ $t('comparacaoLocal.distParticipacao') }}</ThOrdenavel>
          <ThOrdenavel coluna="abstencao_pp" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">{{ $t('comparacaoLocal.distAbstencao') }}</ThOrdenavel>
          <th scope="col"><span class="sr-only">{{ $t('comum.detalhe') }}</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in secoes" :key="s.secao.id">
          <td>{{ s.secao.sg_uf }}</td>
          <td :title="s.secao.nm_municipio">{{ s.secao.nm_municipio || s.secao.cd_municipio_tse }}</td>
          <td class="num">{{ s.secao.nr_zona }}</td>
          <td class="num">{{ s.secao.nr_secao }}</td>
          <td class="num">{{ formatarPercentual(pct(s.metricas?.participacao)) }}</td>
          <td class="num">{{ formatarPercentual(pct(s.metricas?.abstencao)) }}</td>
          <td class="num">{{ pp(s.distancia_pp?.participacao_pp) }}</td>
          <td class="num">{{ pp(s.distancia_pp?.abstencao_pp) }}</td>
          <td>
            <button type="button" class="button button--ghost button--compacto" @click="$emit('abrir-secao', s.secao.id)">{{ $t('comum.detalhe') }}</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
