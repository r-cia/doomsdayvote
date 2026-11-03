<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import Paginacao from './Paginacao.vue'
import StateBlock from './StateBlock.vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useConsistencia } from '../composables/queries'
import { useFiltersStore } from '../stores/filters'
import { formatarNumero } from '../lib/format'

const REGRAS = {
  comparecimento_vs_votos: 'Comparecimento × votos',
  aptos_vs_comparecimento_abstencao: 'Aptos × comparecimento + abstenções',
  comparecimento_vs_aptos: 'Comparecimento × aptos',
  biometria_vs_comparecimento: 'Biometria × comparecimento',
}

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
        <span class="campo__rotulo">Regra</span>
        <select v-model="regra">
          <option value="">Todas as regras</option>
          <option v-for="(rotulo, chave) in REGRAS" :key="chave" :value="chave">{{ rotulo }}</option>
        </select>
      </label>
      <p v-if="cobertura" class="painel__meta">
        <b>{{ formatarNumero(cobertura.consideradas) }}</b> consideradas · {{ formatarNumero(cobertura.avaliadas) }} avaliadas<br />
        {{ formatarNumero(cobertura.com_divergencia) }} com divergência · {{ formatarNumero(cobertura.sem_divergencia) }} sem divergência
      </p>
    </div>

    <StateBlock v-if="query.isLoading.value" estado="carregando" titulo="Carregando consistência" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      titulo="Não foi possível carregar a consistência"
      :descricao="query.error.value.message"
      acao="Tentar novamente"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="itens.length === 0" estado="vazio" titulo="Nenhuma divergência" />
    <template v-else>
      <div class="tabela-scroll" :class="{ atualizando: query.isFetching.value }">
        <table>
          <thead>
            <tr>
              <ThOrdenavel coluna="sg_uf" :ordenacao="ordenacao" @ordenar="alternar">UF</ThOrdenavel>
              <ThOrdenavel coluna="nm_municipio" :ordenacao="ordenacao" @ordenar="alternar">Município</ThOrdenavel>
              <ThOrdenavel coluna="nr_zona" numero :ordenacao="ordenacao" @ordenar="alternar">Zona</ThOrdenavel>
              <ThOrdenavel coluna="nr_secao" numero :ordenacao="ordenacao" @ordenar="alternar">Seção</ThOrdenavel>
              <ThOrdenavel coluna="regra" :ordenacao="ordenacao" @ordenar="alternar">Regra</ThOrdenavel>
              <ThOrdenavel coluna="diferenca" numero :ordenacao="ordenacao" @ordenar="alternar">Diferença</ThOrdenavel>
              <th scope="col"><span class="sr-only">Abrir</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(i, indice) in itens" :key="`${i.secao_id}-${i.regra}-${indice}`">
              <td>{{ i.sg_uf }}</td>
              <td>{{ i.nm_municipio || i.cd_municipio_tse }}</td>
              <td class="num">{{ i.nr_zona }}</td>
              <td class="num">{{ i.nr_secao }}</td>
              <td>{{ REGRAS[i.regra] ?? i.regra }}</td>
              <td class="num">{{ formatarNumero(i.diferenca) }}</td>
              <td>
                <RouterLink class="button button--ghost button--compacto" :to="`/secoes/${i.secao_id}`">Abrir seção</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Paginacao v-model:pagina="pagina" :total="query.data.value?.total ?? 0" :tamanho="query.data.value?.page_size ?? 50" />
    </template>
  </div>
</template>
