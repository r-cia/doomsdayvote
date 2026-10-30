<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import StateBlock from './StateBlock.vue'
import { useFiltersStore } from '../stores/filters'
import { formatarNumero } from '../lib/format'

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['retry'])
const router = useRouter()
const store = useFiltersStore()

const itens = computed(() => props.dados?.itens ?? [])
const cobertura = computed(() => props.dados?.cobertura ?? null)

const rotuloRegra = {
  comparecimento_vs_votos: 'Comparecimento vs. soma dos votos',
  aptos_vs_comparecimento_abstencao: 'Aptos vs. comparecimento + abstenções',
  comparecimento_vs_aptos: 'Comparecimento vs. aptos',
  biometria_vs_comparecimento: 'Biometria vs. comparecimento',
}

const resumo = computed(() => [
  { rotulo: 'Seções consideradas', valor: cobertura.value?.consideradas },
  { rotulo: 'Seções divergentes', valor: cobertura.value?.com_divergencia },
])

function diferenca(valor) {
  if (valor === null || valor === undefined) return '—'
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '—'
  return `${numero > 0 ? '+' : ''}${formatarNumero(numero)}`
}

function municipio(secao) {
  return secao.nm_municipio || (secao.cd_municipio_tse == null ? '—' : String(secao.cd_municipio_tse))
}

function abrirSecao(item) {
  router.push({
    name: 'secao',
    params: { id: item.secao.id },
    query: {
      election_id: store.electionId,
      cargo: store.cargo,
      as_of: store.asOf || undefined,
    },
  })
}
</script>

<template>
  <section class="painel" aria-labelledby="consistencia-titulo">
    <header class="painel__cabecalho">
      <h2 id="consistencia-titulo">Consistência aritmética</h2>
      <p class="painel__meta">
        {{ formatarNumero(dados?.total ?? 0) }} divergências
      </p>
    </header>

    <StateBlock v-if="loading" estado="carregando" :titulo="$t('comum.carregando')" />
    <StateBlock v-else-if="error" estado="erro" :titulo="$t('comum.erro')" :descricao="error" :acao="$t('comum.tentarNovamente')" @acao="emit('retry')" />
    <div v-else-if="itens.length === 0" class="vazio">
      Nenhuma divergência aritmética no recorte.
    </div>
    <div v-else class="tabela-scroll">
      <table>
        <caption class="sr-only">Divergências aritméticas por seção</caption>
        <thead>
          <tr>
            <th scope="col">UF</th>
            <th scope="col">Município</th>
            <th scope="col" class="num">Zona</th>
            <th scope="col" class="num">Seção</th>
            <th scope="col">Regra</th>
            <th scope="col" class="num">Diferença</th>
            <th scope="col"><span class="sr-only">Ação</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, indice) in itens" :key="`${item.secao.id}-${item.regra}-${indice}`">
            <td>{{ item.secao.sg_uf }}</td>
            <td>{{ municipio(item.secao) }}</td>
            <td class="num">{{ item.secao.nr_zona }}</td>
            <td class="num">{{ item.secao.nr_secao }}</td>
            <td>{{ rotuloRegra[item.regra] ?? item.regra }}</td>
            <td class="num">{{ diferenca(item.diferenca) }}</td>
            <td>
              <button type="button" class="button button--ghost" @click="abrirSecao(item)">
                Ver seção
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <dl v-if="cobertura" class="painel-resumo" aria-label="Resumo da cobertura">
      <div v-for="item in resumo" :key="item.rotulo" class="painel-resumo__item">
        <dt>{{ item.rotulo }}</dt>
        <dd>{{ formatarNumero(item.valor) }}</dd>
      </div>
    </dl>
  </section>
</template>
