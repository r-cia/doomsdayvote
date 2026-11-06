<script setup>
import { computed, ref, watch } from 'vue'
import Paginacao from './Paginacao.vue'
import StateBlock from './StateBlock.vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useConcentracao } from '../composables/queries'
import { useFiltersStore } from '../stores/filters'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  visao: { type: String, required: true },
})
defineEmits(['abrir-secao'])

const store = useFiltersStore()
const pagina = ref(1)
const share = useOrdenacao()
const margem = useOrdenacao()
const atual = computed(() => (props.visao === 'margem' ? margem : share))

const query = useConcentracao({ page: pagina }, () => ({ _share: share.ordenacao.value, _margem: margem.ordenacao.value }))
const itens = computed(() =>
  (props.visao === 'margem' ? query.data.value?.top_margem : query.data.value?.top_share) ?? [],
)
const cobertura = computed(() => query.data.value?.cobertura ?? null)
const ordenar = (coluna) => atual.value.alternar(coluna)

watch(
  () => [store.electionId, store.cargo, store.asOf, store.uf, store.municipio, props.visao],
  () => {
    pagina.value = 1
  },
)

const percentual = (fracao) => (fracao === null || fracao === undefined ? null : fracao * 100)
</script>

<template>
  <div :aria-busy="query.isFetching.value">
    <p v-if="cobertura" class="painel__meta">
      <b>{{ formatarNumero(cobertura.consideradas) }}</b> {{ $t('consistencia.consideradas') }} · {{ $t('concentracao.comContexto', { n: formatarNumero(cobertura.com_contexto) }) }} ·
      {{ $t('concentracao.semContexto', { n: formatarNumero(cobertura.sem_contexto) }) }}<br />
      {{ $t('concentracao.grupos', { n: formatarNumero(cobertura.grupos) }) }} · {{ $t('concentracao.gruposInsuficientes', { n: formatarNumero(cobertura.grupos_insuficientes) }) }} ·
      {{ $t('concentracao.faixasAptos', { n: formatarNumero(cobertura.faixas_aptos) }) }}
    </p>

    <StateBlock v-if="query.isLoading.value" estado="carregando" :titulo="$t('concentracao.carregando')" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      :titulo="$t('concentracao.erro')"
      :descricao="query.error.value.message"
      :acao="$t('comum.tentarNovamente')"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="itens.length === 0" estado="vazio" :titulo="$t('concentracao.vazio')" />
    <template v-else>
      <div class="tabela-scroll" :class="{ atualizando: query.isFetching.value }" :aria-busy="query.isFetching.value">
        <span v-if="query.isFetching.value" class="sr-only" role="status">{{ $t('comum.carregando') }}</span>
        <table>
          <thead>
            <tr>
              <th scope="col" class="num">#</th>
              <ThOrdenavel coluna="sg_uf" :ordenacao="atual.ordenacao.value" @ordenar="ordenar">{{ $t('comum.uf') }}</ThOrdenavel>
              <ThOrdenavel coluna="nm_municipio" :ordenacao="atual.ordenacao.value" @ordenar="ordenar">{{ $t('comum.municipio') }}</ThOrdenavel>
              <ThOrdenavel coluna="nr_zona" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">{{ $t('comum.zona') }}</ThOrdenavel>
              <ThOrdenavel coluna="nr_secao" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">{{ $t('comum.secao') }}</ThOrdenavel>
              <template v-if="visao === 'margem'">
                <ThOrdenavel coluna="margem_absoluta" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">{{ $t('concentracao.margem') }}</ThOrdenavel>
                <ThOrdenavel coluna="margem_pp" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">{{ $t('concentracao.margemPp') }}</ThOrdenavel>
                <ThOrdenavel coluna="share_lider" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">{{ $t('destaque.share') }}</ThOrdenavel>
              </template>
              <template v-else>
                <ThOrdenavel coluna="share_lider" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">{{ $t('destaque.share') }}</ThOrdenavel>
                <ThOrdenavel coluna="margem_absoluta" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">{{ $t('concentracao.margem') }}</ThOrdenavel>
                <ThOrdenavel coluna="share_lider_percentil" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">{{ $t('concentracao.percentil') }}</ThOrdenavel>
              </template>
              <th scope="col">{{ $t('comum.candidato') }}</th>
              <th scope="col"><span class="sr-only">{{ $t('comum.abrir') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(i, indice) in itens" :key="i.secao.id">
              <td class="num">{{ (pagina - 1) * (query.data.value?.page_size ?? 0) + indice + 1 }}</td>
              <td>{{ i.secao.sg_uf }}</td>
              <td>{{ i.secao.nm_municipio || i.secao.cd_municipio_tse }}</td>
              <td class="num">{{ i.secao.nr_zona }}</td>
              <td class="num">{{ i.secao.nr_secao }}</td>
              <template v-if="visao === 'margem'">
                <td class="num">{{ formatarNumero(i.margem_absoluta) }}</td>
                <td class="num">{{ formatarPercentual(i.margem_pp) }}</td>
                <td class="num">{{ formatarPercentual(percentual(i.share_lider)) }}</td>
              </template>
              <template v-else>
                <td class="num">{{ formatarPercentual(percentual(i.share_lider)) }}</td>
                <td class="num">{{ formatarNumero(i.margem_absoluta) }}</td>
                <td class="num">{{ formatarPercentual(i.contexto?.share_lider_percentil, 1) }}</td>
              </template>
              <td>{{ i.lider ? `${i.lider.nm_votavel} (${i.lider.sg_partido ?? '—'})` : '—' }}</td>
              <td>
                <button type="button" class="button button--ghost button--compacto" @click="$emit('abrir-secao', i.secao.id)">{{ $t('comum.abrirSecao') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Paginacao v-model:pagina="pagina" :total="query.data.value?.total ?? 0" :tamanho="query.data.value?.page_size ?? 50" />
    </template>
  </div>
</template>
