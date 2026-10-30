<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  cobertura: { type: Object, default: null },
  limitacoes: { type: Array, default: () => [] },
  dados: { type: Object, default: null },
})

const { t } = useI18n()

const coberturaEfetiva = computed(
  () => props.cobertura ?? props.dados?.cobertura ?? null,
)

const limitacoesEfetivas = computed(() => {
  if (Array.isArray(props.limitacoes) && props.limitacoes.length) return props.limitacoes
  return Array.isArray(props.dados?.limitacoes) ? props.dados.limitacoes : []
})

const entradas = computed(() => {
  const valor = coberturaEfetiva.value
  if (!valor || typeof valor !== 'object') return []
  return Object.entries(valor)
})

function limitacaoLocalizada(limitacao) {
  const texto = String(limitacao ?? '').toLocaleLowerCase('pt-BR')
  if (texto.includes('estatísticas descritivas agregadas por seção')) {
    return t('estatistica.limitacaoAgregacaoPorSecao')
  }
  if (texto.includes('campos ausentes') || texto.includes('ausência de campo')) {
    return t('comum.camposAusentesNaoZero')
  }
  if (texto.includes('não define limiares de alerta') || texto.includes('sem limiares de alerta')) {
    return t('comum.semLimiarAlertaDescritivo')
  }
  if (texto.includes('biometria agregada por seção, sem vínculo individual')) {
    return t('biometria.limitacaoAgregacaoPorSecao')
  }
  if (texto.includes('a ferramenta não conclui fraude')) {
    return t('comum.naoConcluiFraude')
  }
  return limitacao
}
</script>

<template>
  <div
    v-if="coberturaEfetiva || limitacoesEfetivas.length"
    class="cobertura-block"
    data-test="cobertura-block"
  >
    <dl v-if="coberturaEfetiva" class="cobertura-block__contagens">
      <div
        v-for="[chave, valor] in entradas"
        :key="chave"
        class="cobertura-block__item"
      >
        <dt>{{ chave }}</dt>
        <dd>
          {{
            typeof valor === 'object' && valor !== null
              ? JSON.stringify(valor)
              : valor
          }}
        </dd>
      </div>
    </dl>
    <ul v-if="limitacoesEfetivas.length" class="cobertura-block__limitacoes">
      <li v-for="(limitacao, indice) in limitacoesEfetivas" :key="indice">
        {{ limitacaoLocalizada(limitacao) }}
      </li>
    </ul>
  </div>
</template>
