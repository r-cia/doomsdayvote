<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatarNumero, formatarPercentual } from '../lib/format'
import StateBlock from './StateBlock.vue'

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  votosCandidato: { type: Number, default: null },
  nomeCandidato: { type: String, default: '' },
})

const { t } = useI18n()
const biometria = computed(() => props.dados ?? null)

const fatias = computed(() => {
  if (!biometria.value) return []
  const total = biometria.value.qt_comparecimento
  if (!total) return []
  return [
    {
      classe: 'biometria__fatia--ok',
      rotulo: t('painel.biometria.habilitados'),
      cor: 'var(--amber)',
      valor: biometria.value.qt_habilitados_por_biometria,
      percentual: biometria.value.percentual_habilitada,
    },
    {
      classe: 'biometria__fatia--nao',
      rotulo: t('painel.biometria.naoHabilitada'),
      cor: 'var(--alert)',
      valor: biometria.value.qt_biometria_nao_habilitada,
      percentual: biometria.value.percentual_nao_habilitada,
    },
  ]
})

const participacao = computed(() => {
  if (!biometria.value || props.votosCandidato === null) return null
  if (!biometria.value.qt_comparecimento) return null
  return (props.votosCandidato / biometria.value.qt_comparecimento) * 100
})
</script>

<template>
  <section class="painel biometria" aria-labelledby="biometria-titulo">
    <header class="painel__cabecalho">
      <h2 id="biometria-titulo">{{ $t('painel.biometria.titulo') }}</h2>
      <p v-if="!loading && biometria" class="painel__meta">
        {{ $t('painel.biometria.titulo') }}<br />
        <b>{{ formatarNumero(biometria?.secoes) }}</b> {{ $t('painel.biometria.secoes') }}
      </p>
    </header>

    <StateBlock v-if="loading && !biometria" estado="carregando" :titulo="$t('comum.carregando')" />
    <div v-else-if="!biometria" class="vazio">{{ $t('painel.biometria.semComposicao') }}</div>

    <div v-else class="biometria__corpo">
      <div
        class="biometria__barra"
        role="img"
        :aria-label="`Comparecimento de ${formatarNumero(biometria.qt_comparecimento)}: ${formatarNumero(biometria.qt_habilitados_por_biometria)} habilitados por biometria e ${formatarNumero(biometria.qt_biometria_nao_habilitada)} com biometria não habilitada`"
      >
        <span
          v-for="fatia in fatias"
          :key="fatia.classe"
          class="biometria__fatia"
          :class="fatia.classe"
          :style="{ width: `${fatia.percentual ?? 0}%` }"
        />
      </div>

      <p class="biometria__legenda">
        <span v-for="fatia in fatias" :key="fatia.rotulo">
          <i :style="{ backgroundColor: fatia.cor }" aria-hidden="true" />
          {{ fatia.rotulo }} {{ formatarPercentual(fatia.percentual) }}
        </span>
      </p>

      <dl class="leituras__valores">
        <div>
          <dt>{{ $t('painel.biometria.comparecimento') }}</dt>
          <dd>
            {{ formatarNumero(biometria.qt_comparecimento) }}
            <small>{{ formatarPercentual(biometria.percentual_comparecimento) }} {{ $t('painel.biometria.aptos') }}</small>
          </dd>
        </div>
        <div>
          <dt>{{ $t('painel.biometria.habilitados') }}</dt>
          <dd>
            {{ formatarNumero(biometria.qt_habilitados_por_biometria) }}
            <small>{{ formatarPercentual(biometria.percentual_habilitada) }}</small>
          </dd>
        </div>
        <div>
          <dt>{{ $t('painel.biometria.naoHabilitada') }}</dt>
          <dd>
            {{ formatarNumero(biometria.qt_biometria_nao_habilitada) }}
            <small>{{ formatarPercentual(biometria.percentual_nao_habilitada) }}</small>
          </dd>
        </div>
        <div>
          <dt>{{ $t('painel.biometria.aptos') }}</dt>
          <dd>{{ formatarNumero(biometria.qt_aptos) }}</dd>
        </div>
      </dl>

      <p v-if="votosCandidato !== null || biometria.secoes_sem_campo > 0" class="nota">
        <template v-if="votosCandidato !== null">
          <b>{{ nomeCandidato }}</b>: {{ formatarNumero(votosCandidato) }} votos — {{ formatarPercentual(participacao) }}
        </template>
        <template v-if="biometria.secoes_sem_campo > 0">
          {{ formatarNumero(biometria.secoes_sem_campo) }} seções sem o campo (entram como zero).
        </template>
      </p>
    </div>
  </section>
</template>
