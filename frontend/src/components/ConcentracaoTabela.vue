<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
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
      <b>{{ formatarNumero(cobertura.consideradas) }}</b> consideradas · {{ formatarNumero(cobertura.com_contexto) }} com contexto ·
      {{ formatarNumero(cobertura.sem_contexto) }} sem contexto<br />
      {{ formatarNumero(cobertura.grupos) }} grupos · {{ formatarNumero(cobertura.grupos_insuficientes) }} grupos insuficientes ·
      {{ formatarNumero(cobertura.faixas_aptos) }} faixas de aptos
    </p>

    <StateBlock v-if="query.isLoading.value" estado="carregando" titulo="Carregando concentração" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      titulo="Não foi possível carregar a concentração"
      :descricao="query.error.value.message"
      acao="Tentar novamente"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="itens.length === 0" estado="vazio" titulo="Sem seções no recorte" />
    <template v-else>
      <div class="tabela-scroll" :class="{ atualizando: query.isFetching.value }">
        <table>
          <thead>
            <tr>
              <th scope="col" class="num">#</th>
              <ThOrdenavel coluna="sg_uf" :ordenacao="atual.ordenacao.value" @ordenar="ordenar">UF</ThOrdenavel>
              <ThOrdenavel coluna="nm_municipio" :ordenacao="atual.ordenacao.value" @ordenar="ordenar">Município</ThOrdenavel>
              <ThOrdenavel coluna="nr_zona" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">Zona</ThOrdenavel>
              <ThOrdenavel coluna="nr_secao" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">Seção</ThOrdenavel>
              <template v-if="visao === 'margem'">
                <ThOrdenavel coluna="margem_absoluta" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">Margem</ThOrdenavel>
                <ThOrdenavel coluna="margem_pp" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">Margem (pp)</ThOrdenavel>
                <ThOrdenavel coluna="share_lider" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">Participação do líder</ThOrdenavel>
              </template>
              <template v-else>
                <ThOrdenavel coluna="share_lider" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">Participação do líder</ThOrdenavel>
                <ThOrdenavel coluna="margem_absoluta" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">Margem</ThOrdenavel>
                <ThOrdenavel coluna="share_lider_percentil" numero :ordenacao="atual.ordenacao.value" @ordenar="ordenar">Percentil</ThOrdenavel>
              </template>
              <th scope="col">Candidato</th>
              <th scope="col"><span class="sr-only">Abrir</span></th>
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
                <RouterLink class="button button--ghost button--compacto" :to="`/secoes/${i.secao.id}`">Abrir seção</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Paginacao v-model:pagina="pagina" :total="query.data.value?.total ?? 0" :tamanho="query.data.value?.page_size ?? 50" />
    </template>
  </div>
</template>
