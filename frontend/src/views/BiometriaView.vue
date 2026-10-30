<script setup>
import { useAnalise } from '../composables/queries'
import BiometriaUfPanel from '../components/BiometriaUfPanel.vue'

const analiseQuery = useAnalise()
</script>

<template>
  <BiometriaUfPanel :dados="analiseQuery.data.value?.biometria_uf ?? []" />
</template>