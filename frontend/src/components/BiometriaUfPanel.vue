<script setup>
import ThOrdenavel from './ThOrdenavel.vue'
import { computed, ref } from 'vue'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  ordenacao: { type: Object, default: null },
  dados: { type: Array, default: () => [] },
})

const emit = defineEmits(['select', 'ordenar'])

const REGIAO = {
  AC: 'Norte', AM: 'Norte', AP: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste',
  PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MS: 'Centro-Oeste', MT: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul',
}

const agrupar = ref('nenhum')
const agruparRegiao = computed(() => agrupar.value === 'regiao')
const base = computed(() => [...(props.dados ?? [])])

const agregado = computed(() => {
  if (!agruparRegiao.value) return base.value
  const mapa = new Map()
  for (const linha of base.value) {
    const regiao = REGIAO[linha.sg_uf] ?? linha.sg_uf
    if (!mapa.has(regiao)) {
      mapa.set(regiao, {
        sg_uf: regiao,
        qt_habilitados_por_biometria: 0,
        qt_biometria_nao_habilitada: 0,
        qt_comparecimento: 0,
      })
    }
    const acc = mapa.get(regiao)
    acc.qt_habilitados_por_biometria += Number(linha.qt_habilitados_por_biometria ?? 0)
    acc.qt_biometria_nao_habilitada += Number(linha.qt_biometria_nao_habilitada ?? 0)
    acc.qt_comparecimento += Number(linha.qt_comparecimento ?? 0)
  }
  return [...mapa.values()].map((item) => ({
    ...item,
    percentual_habilitada:
      item.qt_comparecimento > 0
        ? (item.qt_habilitados_por_biometria / item.qt_comparecimento) * 100
        : null,
    percentual_nao_habilitada:
      item.qt_comparecimento > 0
        ? (item.qt_biometria_nao_habilitada / item.qt_comparecimento) * 100
        : null,
  }))
})

const linhas = agregado
</script>

<template>
  <section class="painel" aria-labelledby="biometria-uf-titulo">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">{{ $t('abas.biometria') }}</p>
        <h2 id="biometria-uf-titulo">{{ $t('biometriaUf.titulo') }}</h2>
      </div>
      <div class="estatistica-controle">
        <select v-model="agrupar" class="uf-ordenacao">
          <option value="nenhum">{{ $t('biometriaUf.semAgrupamento') }}</option>
          <option value="regiao">{{ $t('biometriaUf.porRegiao') }}</option>
        </select>
      </div>
    </header>

    <div v-if="linhas.length === 0" class="vazio">{{ $t('biometriaUf.semDados') }}</div>

    <div v-else class="tabela-scroll">
      <table class="tabela">
        <thead>
          <tr>
            <ThOrdenavel coluna="sg_uf" :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">{{ agruparRegiao ? $t('biometriaUf.regiao') : $t('comum.uf') }}</ThOrdenavel>
            <ThOrdenavel coluna="qt_habilitados_por_biometria" numero :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">{{ $t('biometriaUf.votosComBiometria') }}</ThOrdenavel>
            <ThOrdenavel coluna="percentual_habilitada" numero :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">{{ $t('biometriaUf.pctComBiometria') }}</ThOrdenavel>
            <ThOrdenavel coluna="qt_biometria_nao_habilitada" numero :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">{{ $t('biometriaUf.votosNaoHabilitada') }}</ThOrdenavel>
            <ThOrdenavel coluna="percentual_nao_habilitada" numero :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">{{ $t('biometriaUf.pctNaoHabilitada') }}</ThOrdenavel>
          </tr>
        </thead>
        <tbody>
          <tr v-for="linha in linhas" :key="linha.sg_uf" class="linha-clicavel" @click="emit('select', linha.sg_uf)">
            <td>{{ agruparRegiao ? $t(`regioes.${linha.sg_uf}`) : linha.sg_uf }}</td>
            <td class="tabela__numero">
              {{ formatarNumero(linha.qt_habilitados_por_biometria) }}
            </td>
            <td class="tabela__numero">
              {{ formatarPercentual(linha.percentual_habilitada) }}
            </td>
            <td class="tabela__numero">
              {{ formatarNumero(linha.qt_biometria_nao_habilitada) }}
            </td>
            <td class="tabela__numero">
              {{ formatarPercentual(linha.percentual_nao_habilitada) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>