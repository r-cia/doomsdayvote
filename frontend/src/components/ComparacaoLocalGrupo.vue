<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import StateBlock from './StateBlock.vue'
import TabelaScroll from './TabelaScroll.vue'
import { formatarNumero, formatarPercentual } from '../lib/format'
import { useComparacaoLocalSecoes } from '../composables/queries'

const props = defineProps({
  grupo: { type: Object, required: true },
  ordenacao: { type: Object, required: true },
})

const { alternar, ariaSort, seta } = props.ordenacao
const { t } = useI18n()

const aberto = ref(false)
const consulta = useComparacaoLocalSecoes(
  computed(() => (aberto.value ? props.grupo.chave : null)),
  props.ordenacao.params,
)
const secoes = computed(() => consulta.data.value?.secoes ?? [])

function percentual(valor) {
  if (valor === null || valor === undefined) return '—'
  return formatarPercentual(Number(valor) * 100)
}

function pontosPercentuais(valor) {
  if (valor === null || valor === undefined) return '—'
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '—'
  return `${numero > 0 ? '+' : ''}${formatarNumero(numero)} pp`
}

function municipio(secao) {
  return secao.nm_municipio || (secao.cd_municipio_tse == null ? '—' : String(secao.cd_municipio_tse))
}

const nivel = computed(
  () =>
    ({
      local: t('analiseUI.local'),
      zona: t('analiseUI.zona'),
      municipio: t('analiseUI.municipio'),
    })[props.grupo.nivel] ?? props.grupo.nivel,
)
</script>

<template>
  <article class="grupo">
    <header class="grupo__cabecalho">
      <h3>
        <button type="button" class="grupo__alternar" :aria-expanded="aberto" @click="aberto = !aberto">
          <span aria-hidden="true">{{ aberto ? '▾' : '▸' }}</span>
          {{ nivel }} · {{ formatarNumero(grupo.tamanho) }} {{ $t('analiseUI.secoes') }}
        </button>
      </h3>
      <span v-if="grupo.dados_insuficientes" class="status status--warning">{{ $t('analiseUI.dadosInsuficientes') }}</span>
    </header>
    <template v-if="aberto">
      <StateBlock v-if="consulta.isLoading.value" estado="carregando" :titulo="$t('comum.carregando')" />
      <StateBlock
        v-else-if="consulta.error.value"
        estado="erro"
        :titulo="$t('comum.erro')"
        :descricao="consulta.error.value.message"
        :acao="$t('comum.tentarNovamente')"
        @acao="consulta.refetch()"
      />
      <TabelaScroll v-else :atualizando="consulta.isFetching.value">
        <table class="analise-tabela">
          <caption class="sr-only">{{ $t('analiseUI.secoesGrupo', { level: nivel }) }}</caption>
          <thead>
            <tr>
              <th scope="col" class="ordenavel" :aria-sort="ariaSort('sg_uf')"><button type="button" @click="alternar('sg_uf')">UF{{ seta('sg_uf') }}</button></th>
              <th scope="col" class="ordenavel" :aria-sort="ariaSort('nm_municipio')"><button type="button" @click="alternar('nm_municipio')">{{ $t('analiseUI.municipio') }}{{ seta('nm_municipio') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ariaSort('nr_zona')"><button type="button" @click="alternar('nr_zona')">{{ $t('analiseUI.zona') }}{{ seta('nr_zona') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ariaSort('nr_secao')"><button type="button" @click="alternar('nr_secao')">{{ $t('analiseUI.secao') }}{{ seta('nr_secao') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ariaSort('participacao')"><button type="button" @click="alternar('participacao')">{{ $t('analiseUI.participacao') }}{{ seta('participacao') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ariaSort('abstencao')"><button type="button" @click="alternar('abstencao')">{{ $t('analiseUI.abstencao') }}{{ seta('abstencao') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ariaSort('participacao_pp')"><button type="button" @click="alternar('participacao_pp')">{{ $t('analiseUI.deltaMedianaParticipacao') }}{{ seta('participacao_pp') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ariaSort('abstencao_pp')"><button type="button" @click="alternar('abstencao_pp')">{{ $t('analiseUI.deltaMedianaAbstencao') }}{{ seta('abstencao_pp') }}</button></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in secoes" :key="item.secao.id">
              <td>{{ item.secao.sg_uf || '—' }}</td>
              <td>{{ municipio(item.secao) }}</td>
              <td class="num">{{ formatarNumero(item.secao.nr_zona) }}</td>
              <td class="num">{{ formatarNumero(item.secao.nr_secao) }}</td>
              <td class="num">{{ percentual(item.metricas.participacao) }}</td>
              <td class="num">{{ percentual(item.metricas.abstencao) }}</td>
              <td class="num">{{ pontosPercentuais(item.distancia_pp?.participacao_pp) }}</td>
              <td class="num">{{ pontosPercentuais(item.distancia_pp?.abstencao_pp) }}</td>
            </tr>
          </tbody>
        </table>
      </TabelaScroll>
    </template>
  </article>
</template>
