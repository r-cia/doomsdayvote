<script setup>
import { computed } from 'vue'
import TabelaScroll from './TabelaScroll.vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import StateBlock from './StateBlock.vue'
import { useFiltersStore } from '../stores/filters'
import { formatarNumero } from '../lib/format'
import { useOrdenacao } from '../composables/ordenacao'

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  atualizando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  ordenacao: { type: Object, default: () => useOrdenacao() },
})

const { alternar, ariaSort, seta } = props.ordenacao

const emit = defineEmits(['retry'])
const { t } = useI18n()
const router = useRouter()
const store = useFiltersStore()

const itens = computed(() => props.dados?.itens ?? [])
const cobertura = computed(() => props.dados?.cobertura ?? null)

const rotuloRegra = computed(() => ({
  comparecimento_vs_votos: t('analiseUI.regraComparecimentoVotos'),
  aptos_vs_comparecimento_abstencao: t('analiseUI.regraAptosComparecimento'),
  comparecimento_vs_aptos: t('analiseUI.regraComparecimentoAptos'),
  biometria_vs_comparecimento: t('analiseUI.regraBiometriaComparecimento'),
}))

const resumo = computed(() => [
  { rotulo: t('analiseUI.secoesConsideradas'), valor: cobertura.value?.consideradas },
  { rotulo: t('analiseUI.secoesDivergentes'), valor: cobertura.value?.com_divergencia },
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
      <h2 id="consistencia-titulo">{{ $t('analiseUI.consistencia') }}</h2>
      <p v-if="!loading && dados" class="painel__meta">
        {{ formatarNumero(dados?.total ?? 0) }} {{ $t('analiseUI.divergencias') }}
      </p>
    </header>

    <StateBlock v-if="loading && !dados" estado="carregando" :titulo="$t('comum.carregando')" />
    <StateBlock v-else-if="error" estado="erro" :titulo="$t('comum.erro')" :descricao="error" :acao="$t('comum.tentarNovamente')" @acao="emit('retry')" />
    <div v-else-if="itens.length === 0" class="vazio">
      {{ $t('comum.nenhumaDivergencia') }}
    </div>
    <TabelaScroll v-else :atualizando="atualizando">
      <table>
        <caption class="sr-only">{{ $t('analiseUI.consistencia') }}</caption>
        <thead>
          <tr>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('sg_uf')"><button type="button" @click="alternar('sg_uf')">UF{{ seta('sg_uf') }}</button></th>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('nm_municipio')"><button type="button" @click="alternar('nm_municipio')">{{ $t('analiseUI.municipio') }}{{ seta('nm_municipio') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('nr_zona')"><button type="button" @click="alternar('nr_zona')">{{ $t('analiseUI.zona') }}{{ seta('nr_zona') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('nr_secao')"><button type="button" @click="alternar('nr_secao')">{{ $t('analiseUI.secao') }}{{ seta('nr_secao') }}</button></th>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('regra')"><button type="button" @click="alternar('regra')">{{ $t('analiseUI.regra') }}{{ seta('regra') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('diferenca')"><button type="button" @click="alternar('diferenca')">{{ $t('analiseUI.diferenca') }}{{ seta('diferenca') }}</button></th>
            <th scope="col"><span class="sr-only">{{ $t('comum.acao') }}</span></th>
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
                {{ $t('analiseUI.verSecao') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </TabelaScroll>
    <dl v-if="cobertura" class="painel-resumo" :aria-label="$t('comum.resumoCobertura')">
      <div v-for="item in resumo" :key="item.rotulo" class="painel-resumo__item">
        <dt>{{ item.rotulo }}</dt>
        <dd>{{ formatarNumero(item.valor) }}</dd>
      </div>
    </dl>
  </section>
</template>
