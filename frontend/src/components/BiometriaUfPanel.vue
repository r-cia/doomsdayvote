<script setup>
import { computed, ref } from 'vue'
import TabelaScroll from './TabelaScroll.vue'
import { formatarNumero, formatarPercentual } from '../lib/format'
import StateBlock from './StateBlock.vue'
import { useOrdenacao } from '../composables/ordenacao'

const props = defineProps({
  dados: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  atualizando: { type: Boolean, default: false },
  ordenacao: { type: Object, default: () => useOrdenacao() },
})

const emit = defineEmits(['select'])

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
const { alternar, ariaSort, seta } = props.ordenacao

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
        <p class="painel__etiqueta">{{ $t('biometria.titulo') }}</p>
        <h2 id="biometria-uf-titulo">{{ $t('biometria.porEstado') }}</h2>
      </div>
      <div class="estatistica-controle">
        <select v-model="agrupar" class="uf-ordenacao">
          <option value="nenhum">{{ $t("biometria.semAgrupamento") }}</option>
          <option value="regiao">{{ $t("biometria.porRegiao") }}</option>
        </select>
      </div>
    </header>

    <StateBlock v-if="loading && linhas.length === 0" estado="carregando" :titulo="$t('comum.carregando')" />
    <div v-else-if="linhas.length === 0" class="vazio">{{ $t('comum.semDadosBiometria') }}</div>

    <TabelaScroll v-else :atualizando="atualizando">
      <table class="tabela">
        <thead>
          <tr>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('sg_uf')">
              <button type="button" @click="alternar('sg_uf')">{{ agruparRegiao ? $t('biometria.regiao') : $t('biometria.uf') }}{{ seta('sg_uf') }}</button>
            </th>
            <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('qt_habilitados_por_biometria')">
              <button type="button" @click="alternar('qt_habilitados_por_biometria')">{{ $t('biometria.votosComBiometria') }}{{ seta('qt_habilitados_por_biometria') }}</button>
            </th>
            <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('percentual_habilitada')">
              <button type="button" @click="alternar('percentual_habilitada')">{{ $t('biometria.pctComBiometria') }}{{ seta('percentual_habilitada') }}</button>
            </th>
            <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('qt_biometria_nao_habilitada')">
              <button type="button" @click="alternar('qt_biometria_nao_habilitada')">{{ $t('biometria.votosNaoHabilitada') }}{{ seta('qt_biometria_nao_habilitada') }}</button>
            </th>
            <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('percentual_nao_habilitada')">
              <button type="button" @click="alternar('percentual_nao_habilitada')">{{ $t('biometria.pctNaoHabilitada') }}{{ seta('percentual_nao_habilitada') }}</button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="linha in linhas" :key="linha.sg_uf" class="linha-clicavel" @click="emit('select', linha.sg_uf)">
            <td>{{ linha.sg_uf }}</td>
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
    </TabelaScroll>
  </section>
</template>
