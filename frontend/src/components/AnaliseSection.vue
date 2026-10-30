<script setup>
import BenfordNiveisPanel from './BenfordNiveisPanel.vue'
import BenfordPanel from './BenfordPanel.vue'
import CoberturaBlock from './CoberturaBlock.vue'
import DuplicacaoPanel from './DuplicacaoPanel.vue'
import OutliersPanel from './OutliersPanel.vue'
import StateBlock from './StateBlock.vue'

defineProps({
  benford: { type: Object, default: null },
  benfordLoading: { type: Boolean, default: false },
  anomalias: { type: Object, default: null },
  selecionado: { type: Number, default: null },
  benfordAtualizando: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  atualizando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  ordenacoes: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['retry', 'select'])
</script>

<template>
  <section id="analise" class="analise" aria-labelledby="analise-titulo">
    <header class="analise__cabecalho">
      <h2 id="analise-titulo">Análise</h2>
    </header>

    <StateBlock
      v-if="error"
      estado="erro"
      :titulo="$t('comum.erro')"
      :descricao="error"
      :acao="$t('comum.tentarNovamente')"
      @acao="emit('retry')"
    />

    <template v-else>
      <BenfordPanel
        :dados="benford"
        :selecionado="selecionado"
        :loading="benfordLoading"
        :atualizando="benfordAtualizando"
        :ordenacao="ordenacoes.benford"
        @select="emit('select', $event)"
      />

      <template v-if="anomalias">
        <BenfordNiveisPanel :dados="anomalias.benford_niveis" :atualizando="atualizando" :ordenacao="ordenacoes.niveis" />
        <div class="auditoria-grade">
          <DuplicacaoPanel :dados="anomalias.duplicacao" :atualizando="atualizando" :ordenacao="ordenacoes.duplicacao" />
          <OutliersPanel :dados="anomalias.outliers" :atualizando="atualizando" :ordenacao="ordenacoes.outliers" />
        </div>
      </template>

      <CoberturaBlock v-if="anomalias" :dados="anomalias" />
      <StateBlock
        v-else-if="loading"
        estado="carregando"
        :titulo="$t('comum.carregando')"
      />
    </template>
  </section>
</template>
