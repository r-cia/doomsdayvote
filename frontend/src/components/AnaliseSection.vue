<script setup>
import BenfordPanel from './BenfordPanel.vue'
import DuplicacaoPanel from './DuplicacaoPanel.vue'
import SecoesDestaquePanel from './SecoesDestaquePanel.vue'
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
      <h2 id="analise-titulo">{{ $t('analise.titulo') }}</h2>
    </header>

    <StateBlock
      v-if="error"
      estado="erro"
      :titulo="$t('analise.erro')"
      :descricao="error"
      :acao="$t('comum.tentarNovamente')"
      @acao="emit('retry')"
    />

    <template v-else>
      <BenfordPanel
        :dados="benford"
        :niveis="anomalias?.benford_niveis ?? null"
        :carregando-niveis="loading"
        :selecionado="selecionado"
        @select="emit('select', $event)"
      />

      <template v-if="anomalias">
        <div class="auditoria-grade">
          <DuplicacaoPanel :dados="anomalias.duplicacao" />
          <SecoesDestaquePanel
            :outliers="anomalias.outliers"
            :ordenacao="ordenacao"
            @update:ordenacao="emit('update:ordenacao', $event)"
          />
        </div>
      </template>

      <StateBlock
        v-else-if="loading"
        estado="carregando"
        :titulo="$t('analise.calculando')"
      />
    </template>
  </section>
</template>
