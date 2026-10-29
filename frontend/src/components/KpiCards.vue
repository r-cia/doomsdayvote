<script setup>
import { computed } from 'vue'
import { votosValidos } from '../lib/agregacoes'
import { formatarDataHora, formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  resumo: { type: Object, required: true },
  candidato: { type: Object, default: null },
})

const validos = computed(() => votosValidos(props.resumo.votos ?? []))

const votosDoCandidato = computed(() => {
  if (!props.candidato) return null
  const linha = (props.resumo.votos ?? []).find(
    (voto) => voto.categoria === 'nominal' && voto.nr_votavel === props.candidato.nr_votavel,
  )
  return linha ? Number(linha.qt_votos) : 0
})

const percentualDoCandidato = computed(() => {
  if (votosDoCandidato.value === null || validos.value <= 0) return null
  return (votosDoCandidato.value / validos.value) * 100
})

const participacao = computed(() => {
  const metricas = props.resumo.metricas
  if (!metricas?.qt_aptos) return null
  return (metricas.qt_comparecimento / metricas.qt_aptos) * 100
})
</script>

<template>
  <section class="kpis" aria-label="Série do corte">
    <div>
      <span class="kpis__rotulo">Comparecimento</span>
      <strong class="kpis__valor">{{ formatarNumero(resumo.metricas?.qt_comparecimento) }}</strong>
      <span class="kpis__nota">{{ formatarPercentual(participacao) }} dos aptos</span>
    </div>
    <div>
      <span class="kpis__rotulo">Seções com BU</span>
      <strong class="kpis__valor">{{ formatarNumero(resumo.secoes_com_bu) }}</strong>
      <span class="kpis__nota">{{ formatarNumero(resumo.metricas?.bus_considerados) }} BUs no corte</span>
    </div>
    <div>
      <span class="kpis__rotulo">Votos válidos</span>
      <strong class="kpis__valor">{{ formatarNumero(validos) }}</strong>
      <span class="kpis__nota">nominais e de legenda</span>
    </div>
    <div>
      <span class="kpis__rotulo">Última carga</span>
      <strong class="kpis__valor kpis__valor--hora">{{ formatarDataHora(resumo.captured_at) }}</strong>
      <span class="kpis__nota">arquivo mais recente</span>
    </div>
    <div>
      <span class="kpis__rotulo">{{ candidato ? candidato.nm_votavel : 'Candidato' }}</span>
      <strong class="kpis__valor">
        {{ candidato ? formatarPercentual(percentualDoCandidato) : '—' }}
      </strong>
      <span class="kpis__nota">
        {{ candidato ? `${formatarNumero(votosDoCandidato)} votos` : 'selecione no placar' }}
      </span>
    </div>
  </section>
</template>
