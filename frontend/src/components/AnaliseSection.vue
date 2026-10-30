<script setup>
import BenfordNiveisPanel from './BenfordNiveisPanel.vue'
import BenfordPanel from './BenfordPanel.vue'
import DuplicacaoPanel from './DuplicacaoPanel.vue'
import OutliersPanel from './OutliersPanel.vue'
import StateBlock from './StateBlock.vue'

defineProps({
  benford: { type: Object, default: null },
  anomalias: { type: Object, default: null },
  selecionado: { type: Number, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  ordenacao: { type: String, default: 'if' },
})

const emit = defineEmits(['retry', 'select', 'update:ordenacao'])
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
      acao="Tentar novamente"
      @acao="emit('retry')"
    />

    <template v-else>
      <BenfordPanel
        :dados="benford"
        :selecionado="selecionado"
        @select="emit('select', $event)"
      />

      <template v-if="anomalias">
        <BenfordNiveisPanel :dados="anomalias.benford_niveis" />
        <div class="auditoria-grade">
          <DuplicacaoPanel :dados="anomalias.duplicacao" />
          <OutliersPanel
            :dados="anomalias.outliers"
            :ordenacao="ordenacao"
            @update:ordenacao="emit('update:ordenacao', $event)"
          />
        </div>
      </template>

      <StateBlock
        v-else-if="loading"
        estado="carregando"
        :titulo="$t('comum.carregando')"
      />
    </template>
  </section>
</template>
