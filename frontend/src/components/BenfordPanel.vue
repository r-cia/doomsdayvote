<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatarDecimal, formatarNumero } from '../lib/format'
import BenfordFaixa from './BenfordFaixa.vue'
import StateBlock from './StateBlock.vue'
import TabelaScroll from './TabelaScroll.vue'
import { useOrdenacao } from '../composables/ordenacao'

const props = defineProps({
  dados: { type: Object, default: null },
  selecionado: { type: Number, default: null },
  loading: { type: Boolean, default: false },
  atualizando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  niveis: { type: Object, default: null },
  niveisCarregando: { type: Boolean, default: false },
  niveisError: { type: String, default: '' },
  ordenacao: { type: Object, default: () => useOrdenacao() },
})

const { alternar, ariaSort, seta } = props.ordenacao

const emit = defineEmits(['select', 'retry', 'retry-niveis'])

const minimo = computed(() => props.dados?.minimo_votos ?? 10)
const candidatos = computed(() => props.dados?.candidatos ?? [])

const ativo = computed(() => {
  if (candidatos.value.length === 0) return null
  return (
    candidatos.value.find((candidato) => candidato.nr_votavel === props.selecionado) ??
    candidatos.value[0]
  )
})

const { t } = useI18n()
const NIVEIS = ['secao', 'zona', 'municipio']
const nivelAtivo = ref('secao')
const rotulosNivel = computed(() => ({
  secao: t('tabela.secao'),
  zona: t('tabela.zona'),
  municipio: t('tabela.municipio'),
}))

const dadosDoNivel = computed(() => {
  if (!ativo.value) return null
  if (nivelAtivo.value === 'secao') return ativo.value
  const candidato = props.niveis?.candidatos?.find((item) => item.nr_votavel === ativo.value.nr_votavel)
  return candidato?.niveis?.[nivelAtivo.value] ?? null
})

function formatarMad(valor) {
  return formatarDecimal(valor, 4, 4)
}

</script>

<template>
  <section class="painel" aria-labelledby="benford-titulo">
    <header class="painel__cabecalho">
      <h2 id="benford-titulo">{{ $t('estatistica.benford') }}</h2>
      <p v-if="!loading && !error && dados" class="painel__meta">
        <b>{{ formatarNumero(ativo?.n) }}</b> {{ $t('unidade.secao', ativo?.n ?? 0) }}
      </p>
    </header>

    <StateBlock v-if="loading && !dados" estado="carregando" :titulo="$t('comum.carregando')" />
    <StateBlock
      v-else-if="error"
      estado="erro"
      :titulo="$t('comum.erro')"
      :descricao="error"
      :acao="$t('comum.tentarNovamente')"
      @acao="emit('retry')"
    />
    <div v-else-if="!dados || candidatos.length === 0" class="vazio">
      {{ $t("comum.semDados") }}
    </div>

    <template v-else>
      <div class="benford">
        <div class="benford__visual">
          <div class="segmented" role="group" :aria-label="$t('estatistica.nivelGrafico')">
            <button
              v-for="nivel in NIVEIS"
              :key="nivel"
              type="button"
              :class="{ ativo: nivelAtivo === nivel }"
              :aria-pressed="nivelAtivo === nivel"
              @click="nivelAtivo = nivel"
            >
              {{ rotulosNivel[nivel] }}
            </button>
          </div>
          <StateBlock
            v-if="nivelAtivo !== 'secao' && niveisCarregando && !dadosDoNivel"
            estado="carregando"
            :titulo="$t('comum.carregando')"
          />
          <StateBlock
            v-else-if="nivelAtivo !== 'secao' && niveisError"
            estado="erro"
            :titulo="$t('comum.erro')"
            :descricao="niveisError"
            :acao="$t('comum.tentarNovamente')"
            @acao="emit('retry-niveis')"
          />
          <BenfordFaixa
            v-else-if="dadosDoNivel"
            :titulo="$t('estatistica.distribuicaoBenford', { nome: ativo?.nm_votavel })"
            :digitos="dadosDoNivel.digitos ?? []"
            :faixa="dadosDoNivel.monte_carlo?.faixa_digitos ?? null"
          />
          <div v-else class="vazio">{{ $t('comum.semDados') }}</div>
        </div>

        <TabelaScroll class="benford__tabela" :atualizando="atualizando">
          <table>
            <caption class="sr-only">
              {{ $t('estatistica.aderenciaBenford') }}
            </caption>
            <thead>
              <tr>
                <th scope="col" class="ordenavel" :aria-sort="ariaSort('nm_votavel')"><button type="button" @click="alternar('nm_votavel')">{{ $t('estatistica.candidato') }}{{ seta('nm_votavel') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSort('n')"><button type="button" @click="alternar('n')">n{{ seta('n') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSort('mad')"><button type="button" @click="alternar('mad')">MAD{{ seta('mad') }}</button></th>
                <th scope="col" class="num">{{ $t('tabela.pValorMonteCarlo') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="candidato in candidatos"
                :key="candidato.nr_votavel"
                :data-ativo="ativo?.nr_votavel === candidato.nr_votavel"
              >
                <td>
                  <button
                    type="button"
                    :aria-pressed="ativo?.nr_votavel === candidato.nr_votavel"
                    @click="emit('select', candidato.nr_votavel)"
                  >
                    {{ candidato.nm_votavel }}
                  </button>
                </td>
                <td class="num">{{ formatarNumero(candidato.n) }}</td>
                <td class="num">{{ formatarMad(candidato.mad) }}</td>
                <td class="num">{{ formatarMad(candidato.monte_carlo?.p_valor) }}</td>
              </tr>
            </tbody>
          </table>
        </TabelaScroll>
      </div>

      <div class="benford__rodape">
        <p class="nota">
          <b>{{ formatarNumero(ativo?.secoes_abaixo_minimo) }}</b> {{ $t('estatistica.abaixoMinimo', ativo?.secoes_abaixo_minimo ?? 0) }}
        </p>
        <p class="nota">{{ $t('estatistica.monteCarloNota') }}</p>
      </div>
    </template>
  </section>
</template>
