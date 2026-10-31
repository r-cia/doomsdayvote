<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatarNumero } from '../lib/format'

const props = defineProps({
  cobertura: { type: Object, default: null },
  minimoBenford: { type: Number, default: 10 },
})

const { t } = useI18n()

const campos = computed(() => {
  const dados = props.cobertura ?? {}
  return [
    ['bus_sem_aptos', t('analiseUI.semAptos')],
    ['bus_sem_comparecimento', t('analiseUI.semComparecimento')],
    ['bus_sem_abstencoes', t('analiseUI.semAbstencoes')],
    ['bus_sem_biometria', t('analiseUI.semBiometria')],
  ]
    .map(([chave, rotulo]) => {
      const valor = dados[chave]
      return {
        rotulo,
        valor: valor === null || valor === undefined || !Number.isFinite(Number(valor))
          ? null
          : Number(valor),
      }
    })
})

const camposAusentes = computed(() => campos.value.filter((campo) => campo.valor > 0))
const camposNaoInformados = computed(() => campos.value.some((campo) => campo.valor === null))

</script>

<template>
  <section
    v-if="cobertura"
    class="analise-cobertura"
    :aria-label="$t('analiseUI.resumoDados')"
  >
    <h3>{{ $t('analiseUI.resumoDados') }}</h3>
    <dl class="analise-cobertura__dados">
      <div>
        <dt>{{ $t('analiseUI.secoesConsideradas') }}</dt>
        <dd>{{ formatarNumero(cobertura.consideradas) }}</dd>
      </div>
      <div>
        <dt>{{ $t('analiseUI.camposAusentes') }}</dt>
        <dd v-if="camposAusentes.length > 0">
          <ul>
            <li v-for="campo in camposAusentes" :key="campo.rotulo">
              {{ campo.rotulo }}: {{ formatarNumero(campo.valor) }}
            </li>
            <li v-if="camposNaoInformados">{{ $t('analiseUI.camposParciais') }}</li>
          </ul>
        </dd>
        <dd v-else-if="camposNaoInformados">{{ $t('analiseUI.camposIndisponiveis') }}</dd>
        <dd v-else>{{ $t('analiseUI.nenhumCampoAusente') }}</dd>
      </div>
      <div>
        <dt>{{ $t('analiseUI.abaixoMinimoBenford', { minimo: formatarNumero(minimoBenford) }) }}</dt>
        <dd>{{ formatarNumero(cobertura.secoes_abaixo_minimo_benford) }}</dd>
      </div>
    </dl>
  </section>
</template>
