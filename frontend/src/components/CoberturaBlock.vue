<script setup>
import { computed } from 'vue'

const props = defineProps({
  cobertura: { type: Object, default: null },
  limitacoes: { type: Array, default: () => [] },
  dados: { type: Object, default: null },
})

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
        {{ limitacao }}
      </li>
    </ul>
  </div>
</template>