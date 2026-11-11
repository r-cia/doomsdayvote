<script setup>
import { computed, ref, watch } from 'vue'
import Paginacao from './Paginacao.vue'
import StateBlock from './StateBlock.vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useConsistencia } from '../composables/queries'
import { useFiltersStore } from '../stores/filters'
import { formatarNumero } from '../lib/format'

const REGRAS = [
  'comparecimento_vs_votos',
  'aptos_vs_comparecimento_abstencao',
  'comparecimento_vs_aptos',
  'biometria_vs_comparecimento',
]

defineEmits(['abrir-secao'])

const store = useFiltersStore()
const regra = ref('')
const pagina = ref(1)
const { ordenacao, alternar } = useOrdenacao()

const query = useConsistencia({ regra, page: pagina }, ordenacao)
const itens = computed(() => query.data.value?.itens ?? [])
const cobertura = computed(() => query.data.value?.cobertura ?? null)

watch(
  () => [store.electionId, store.cargo, store.asOf, store.uf, store.municipio, regra.value, ordenacao.value],
  () => {
    pagina.value = 1
  },
)
</script>

<template>
  <div :aria-busy="query.isFetching.value">
    <div class="painel__cabecalho">
      <label class="campo campo--curto">
        <span class="campo__rotulo">{{ $t('consistencia.regra') }}</span>
        <select v-model="regra">
          <option value="">{{ $t('consistencia.todas') }}</option>
          <option v-for="chave in REGRAS" :key="chave" :value="chave">{{ $t(`consistencia.regras.${chave}`) }}</option>
        </select>
      </label>
      <p v-if="cobertura" class="painel__meta">
        <b>{{ formatarNumero(cobertura.consideradas) }}</b> {{ $t('consistencia.consideradas') }} · {{ $t('consistencia.avaliadas', { n: formatarNumero(cobertura.avaliadas) }) }}<br />
        {{ $t('consistencia.comDivergencia', { n: formatarNumero(cobertura.com_divergencia) }) }} · {{ $t('consistencia.semDivergencia', { n: formatarNumero(cobertura.sem_divergencia) }) }}
      </p>
    </div>

    <StateBlock v-if="query.isLoading.value" estado="carregando" :titulo="$t('consistencia.carregando')" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      :titulo="$t('consistencia.erro')"
      :descricao="query.error.value.message"
      :acao="$t('comum.tentarNovamente')"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="itens.length === 0" estado="vazio" :titulo="$t('consistencia.vazio')" />
    <template v-else>
      <div class="tabela-scroll" :class="{ atualizando: query.isFetching.value }" :aria-busy="query.isFetching.value">
        <span v-if="query.isFetching.value" class="sr-only" role="status">{{ $t('comum.carregando') }}</span>
        <table>
          <thead>
            <tr>
              <ThOrdenavel coluna="sg_uf" :ordenacao="ordenacao" @ordenar="alternar">{{ $t('comum.uf') }}</ThOrdenavel>
              <ThOrdenavel coluna="nm_municipio" :ordenacao="ordenacao" @ordenar="alternar">{{ $t('comum.municipio') }}</ThOrdenavel>
              <ThOrdenavel coluna="nr_zona" numero :ordenacao="ordenacao" @ordenar="alternar">{{ $t('comum.zona') }}</ThOrdenavel>
              <ThOrdenavel coluna="nr_secao" numero :ordenacao="ordenacao" @ordenar="alternar">{{ $t('comum.secao') }}</ThOrdenavel>
              <ThOrdenavel coluna="regra" :ordenacao="ordenacao" @ordenar="alternar">{{ $t('consistencia.regra') }}</ThOrdenavel>
              <ThOrdenavel coluna="diferenca" numero :ordenacao="ordenacao" @ordenar="alternar">{{ $t('consistencia.diferenca') }}</ThOrdenavel>
              <th scope="col"><span class="sr-only">{{ $t('comum.abrir') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(i, indice) in itens" :key="`${i.secao.id}-${i.regra}-${indice}`">
              <td>{{ i.secao.sg_uf }}</td>
              <td>{{ i.secao.nm_municipio || i.secao.cd_municipio_tse }}</td>
              <td class="num">{{ i.secao.nr_zona }}</td>
              <td class="num">{{ i.secao.nr_secao }}</td>
              <td>{{ REGRAS.includes(i.regra) ? $t(`consistencia.regras.${i.regra}`) : i.regra }}</td>
              <td class="num">{{ formatarNumero(i.diferenca) }}</td>
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
