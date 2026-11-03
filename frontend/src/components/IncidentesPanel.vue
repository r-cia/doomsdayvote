<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Paginacao from './Paginacao.vue'
import StateBlock from './StateBlock.vue'
import { useTotalizacaoIncidentes } from '../composables/queries'
import { useFiltersStore } from '../stores/filters'
import { formatarDataHora, formatarNumero } from '../lib/format'

const TAMANHO = 25
const { t } = useI18n()
const store = useFiltersStore()
const aberto = ref(false)
const pagina = ref(1)

const query = useTotalizacaoIncidentes({ pagina, tamanho: TAMANHO }, aberto)
const itens = computed(() => query.data.value?.itens ?? [])

watch(
  () => [store.ano, store.turno, store.uf, store.municipio],
  () => {
    pagina.value = 1
  },
)

const secao = (i) =>
  [i.sg_uf, i.cd_municipio_tse, i.nr_zona && `${t('comum.zona').toLowerCase()} ${i.nr_zona}`, i.nr_secao && `${t('comum.secao').toLowerCase()} ${i.nr_secao}`]
    .filter((parte) => parte !== null && parte !== undefined && parte !== '')
    .join(' · ') || '—'
</script>

<template>
  <section class="painel" aria-labelledby="incidentes-titulo">
    <header class="painel__cabecalho">
      <h2 id="incidentes-titulo">{{ $t('incidentes.titulo') }}</h2>
      <button type="button" class="button button--secondary" :aria-expanded="aberto" aria-controls="incidentes-corpo" @click="aberto = !aberto">
        {{ aberto ? $t('incidentes.recolher') : $t('incidentes.expandir') }}
      </button>
    </header>

    <div v-if="aberto" id="incidentes-corpo" :aria-busy="query.isFetching.value">
      <StateBlock v-if="query.isLoading.value" estado="carregando" :titulo="$t('incidentes.carregando')" />
      <StateBlock
        v-else-if="query.error.value"
        estado="erro"
        :titulo="$t('incidentes.erro')"
        :descricao="query.error.value.message"
        :acao="$t('comum.tentarNovamente')"
        @acao="query.refetch()"
      />
      <StateBlock v-else-if="itens.length === 0" estado="vazio" :titulo="$t('incidentes.vazio')" />
      <template v-else>
        <div class="tabela-scroll" :class="{ atualizando: query.isFetching.value }">
          <table class="tabela">
            <thead>
              <tr>
                <th scope="col">{{ $t('incidentes.instante') }}</th>
                <th scope="col">{{ $t('incidentes.nivel') }}</th>
                <th scope="col">{{ $t('incidentes.tipo') }}</th>
                <th scope="col">{{ $t('comum.secao') }}</th>
                <th scope="col">{{ $t('incidentes.texto') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(i, indice) in itens" :key="indice">
                <td>{{ formatarDataHora(i.instante) }}</td>
                <td>{{ i.nivel ?? '—' }}</td>
                <td>{{ i.tipo ?? '—' }}</td>
                <td>{{ secao(i) }}</td>
                <td>{{ i.texto_original ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Paginacao v-model:pagina="pagina" :total="query.data.value?.total ?? 0" :tamanho="TAMANHO" />
      </template>
    </div>
  </section>
</template>
