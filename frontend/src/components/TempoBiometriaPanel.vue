<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import StateBlock from './StateBlock.vue'
import TabelaScroll from './TabelaScroll.vue'
import { formatarDuracao, formatarNumero } from '../lib/format'

const props = defineProps({
  metricas: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  atualizando: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['retry'])
const { t } = useI18n()

const tempo = computed(() => props.metricas?.tempo ?? null)
const biometria = computed(() => props.metricas?.biometria ?? null)

const tempos = computed(() => [
  { rotulo: t('totalizacao.media'), valor: tempo.value?.mediaMs },
  { rotulo: t('totalizacao.mediana'), valor: tempo.value?.medianaMs },
  { rotulo: t('totalizacao.maisRapido'), valor: tempo.value?.maisRapidoMs },
  { rotulo: t('totalizacao.maisDemorado'), valor: tempo.value?.maisDemoradoMs },
])

const faixas = computed(() => [
  { rotulo: t('totalizacao.falhou1'), valor: biometria.value?.falhou1 },
  { rotulo: t('totalizacao.falhou2'), valor: biometria.value?.falhou2 },
  { rotulo: t('totalizacao.falhou3'), valor: biometria.value?.falhou3 },
  { rotulo: t('totalizacao.falhou4'), valor: biometria.value?.falhou4 },
  { rotulo: t('totalizacao.manual'), valor: biometria.value?.manual },
])
</script>

<template>
  <section class="painel" aria-labelledby="tempo-biometria-titulo">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">{{ $t('totalizacao.titulo') }}</p>
        <h2 id="tempo-biometria-titulo">{{ $t('totalizacao.tempo') }}</h2>
      </div>
      <p v-if="metricas" class="painel__meta">
        {{ $t('totalizacao.eleitores', { n: formatarNumero(tempo?.quantidade ?? 0) }) }}
      </p>
    </header>

    <StateBlock
      v-if="loading && !metricas"
      estado="carregando"
      :titulo="$t('comum.carregando')"
    />
    <StateBlock
      v-else-if="error"
      estado="erro"
      :titulo="$t('comum.erro')"
      :descricao="error"
      :acao="$t('comum.tentarNovamente')"
      @acao="emit('retry')"
    />
    <template v-else-if="metricas">
      <div class="kpis kpis--quatro">
        <div v-for="item in tempos" :key="item.rotulo">
          <span class="kpis__rotulo">{{ item.rotulo }}</span>
          <strong class="kpis__valor">{{ formatarDuracao(item.valor) }}</strong>
        </div>
      </div>

      <h3 class="totalizacao-subtitulo">{{ $t('totalizacao.biometria') }}</h3>
      <TabelaScroll :atualizando="atualizando">
        <table class="tabela">
          <caption class="sr-only">{{ $t('totalizacao.biometria') }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ $t('totalizacao.faixa') }}</th>
              <th scope="col" class="num">{{ $t('totalizacao.eleitoresCurto') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="faixa in faixas" :key="faixa.rotulo">
              <td>{{ faixa.rotulo }}</td>
              <td class="num">{{ formatarNumero(faixa.valor) }}</td>
            </tr>
          </tbody>
        </table>
      </TabelaScroll>
    </template>
  </section>
</template>
