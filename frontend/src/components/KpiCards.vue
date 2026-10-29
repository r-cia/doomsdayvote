<script setup>
import { computed } from 'vue'
import {
  formatarDataHora,
  formatarNumero,
  formatarPercentual,
} from '../lib/format'
import { corPartido, corTextoContraste } from '../lib/colors'
import { resumoCandidato, totalVotos, votosValidos } from '../lib/agregacoes'

const props = defineProps({
  resumo: { type: Object, required: true },
  candidato: { type: Object, default: null },
})

const total = computed(() => totalVotos(props.resumo.votos ?? []))
const validos = computed(() => votosValidos(props.resumo.votos ?? []))
const metricas = computed(() => props.resumo.metricas ?? {})
const secoes = computed(() => props.resumo.secoes_com_bu ?? 0)
const candidatoResumo = computed(() =>
  props.candidato
    ? resumoCandidato(props.resumo.votos ?? [], props.candidato.nr_votavel)
    : null,
)

const cartoes = computed(() => {
  const base = [
    {
      id: 'votos',
      rotulo: 'Votos apurados',
      valor: formatarNumero(total.value),
      detalhe: `Válidos: ${formatarNumero(validos.value)}`,
    },
    {
      id: 'secoes',
      rotulo: 'Seções com BU',
      valor: formatarNumero(secoes.value),
      detalhe: `BUs considerados: ${formatarNumero(metricas.value.bus_considerados ?? 0)}`,
    },
    {
      id: 'carga',
      rotulo: 'Última carga',
      valor: formatarDataHora(props.resumo.captured_at),
      detalhe: `Fonte: ${formatarDataHora(props.resumo.source_updated_at)}`,
    },
    {
      id: 'comparecimento',
      rotulo: 'Comparecimento',
      valor: formatarNumero(metricas.value.qt_comparecimento ?? 0),
      detalhe: `Aptos: ${formatarNumero(metricas.value.qt_aptos ?? 0)} · Abstenções: ${formatarNumero(metricas.value.qt_abstencoes ?? 0)}`,
    },
  ]

  if (candidatoResumo.value) {
    base.push({
      id: 'candidato',
      rotulo:
        candidatoResumo.value.nm_votavel ??
        props.candidato.nm_votavel ??
        `Candidato ${props.candidato.nr_votavel}`,
      valor: formatarNumero(candidatoResumo.value.qt_votos),
      detalhe: `${formatarPercentual(candidatoResumo.value.percentual)} dos válidos`,
      partido: candidatoResumo.value.sg_partido,
    })
  }

  return base
})
</script>

<template>
  <section class="kpis" aria-label="Indicadores do corte">
    <article v-for="cartao in cartoes" :key="cartao.id" class="kpi">
      <div class="kpi__topo">
        <h3>{{ cartao.rotulo }}</h3>
        <span
          v-if="cartao.partido"
          class="party-dot"
          :style="{
            backgroundColor: corPartido(cartao.partido),
            color: corTextoContraste(corPartido(cartao.partido)),
          }"
          :title="`Partido ${cartao.partido}`"
        >{{ cartao.partido }}</span>
      </div>
      <p class="kpi__valor">{{ cartao.valor }}</p>
      <p class="kpi__detalhe">{{ cartao.detalhe }}</p>
    </article>
  </section>
</template>
