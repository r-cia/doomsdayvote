<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import StateBlock from './StateBlock.vue'
import { useTotalizacaoMetricas } from '../composables/queries'
import { formatarNumero } from '../lib/format'

const { t } = useI18n()
const query = useTotalizacaoMetricas()
const faixas = computed(() => {
  const b = query.data.value?.biometria
  return b
    ? [
        [t('biometriaFaixas.falhou1'), b.falhou1],
        [t('biometriaFaixas.falhou2'), b.falhou2],
        [t('biometriaFaixas.falhou3'), b.falhou3],
        [t('biometriaFaixas.falhou4'), b.falhou4],
        [t('biometriaFaixas.manual'), b.manual],
      ]
    : []
})
const vazio = computed(() => !(query.data.value?.complementares?.secoes > 0))
</script>

<template>
  <section class="painel" aria-labelledby="biometria-faixas-titulo" :aria-busy="query.isFetching.value">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">{{ $t('abas.biometria') }}</p>
        <h2 id="biometria-faixas-titulo">{{ $t('biometriaFaixas.titulo') }}</h2>
      </div>
    </header>

    <StateBlock v-if="query.isLoading.value" estado="carregando" :titulo="$t('biometriaFaixas.carregando')" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      :titulo="$t('biometriaFaixas.erro')"
      :descricao="query.error.value.message"
      :acao="$t('comum.tentarNovamente')"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="vazio" estado="vazio" :titulo="$t('totalizacao.semDados')" />

    <div v-else class="biometria__corpo">
      <dl class="leituras__valores" :class="{ 'atualizando': query.isFetching.value }">
        <div v-for="[rotulo, valor] in faixas" :key="rotulo">
          <dt>{{ rotulo }}</dt>
          <dd>{{ formatarNumero(valor) }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
