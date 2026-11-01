<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, te } = useI18n()

function rotulo(campo) {
  const chave = `cobertura.campos.${campo}`
  return te(chave) ? t(chave) : campo
}

const props = defineProps({
  cobertura: { type: Object, default: null },
  dados: { type: Object, default: null },
})

const coberturaEfetiva = computed(
  () => props.cobertura ?? props.dados?.cobertura ?? null,
)

const entradas = computed(() => {
  const valor = coberturaEfetiva.value
  if (!valor || typeof valor !== 'object') return []
  return Object.entries(valor)
})
</script>

<template>
  <div
    v-if="coberturaEfetiva"
    class="cobertura-block"
    data-test="cobertura-block"
  >
    <dl class="cobertura-block__contagens">
      <div
        v-for="[chave, valor] in entradas"
        :key="chave"
        class="cobertura-block__item"
      >
        <dt>{{ rotulo(chave) }}</dt>
        <dd>
          {{
            typeof valor === 'object' && valor !== null
              ? JSON.stringify(valor)
              : valor
          }}
        </dd>
      </div>
    </dl>
  </div>
</template>
