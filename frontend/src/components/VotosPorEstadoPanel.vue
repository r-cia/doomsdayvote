<script setup>
import { computed, ref, watch } from 'vue'
import { formatarNumero } from '../lib/format'
import { candidatosNominais } from '../lib/agregacoes'

const props = defineProps({
  areas: { type: Array, default: () => [] },
  candidatos: { type: Array, default: () => [] },
})

const ordenacao = ref({ coluna: 'nm_votavel', direcao: 'asc' })

function alternar(coluna) {
  if (ordenacao.value.coluna === coluna) {
    ordenacao.value = { coluna, direcao: ordenacao.value.direcao === 'asc' ? 'desc' : 'asc' }
  } else {
    ordenacao.value = { coluna, direcao: 'asc' }
  }
}

function totalCandidato(c) {
  return (props.areas ?? []).reduce((t, area) => {
    const linha = (area.candidatos ?? []).find((x) => Number(x.nr_votavel) === Number(c.nr_votavel))
    return t + (linha ? Number(linha.qt_votos ?? 0) : 0)
  }, 0)
}

const listaCandidatos = computed(() => {
  const lista = candidatosNominais(props.candidatos).map((c) => ({ ...c, _total: totalCandidato(c) }))
  const { coluna, direcao } = ordenacao.value
  lista.sort((a, b) => {
    let va, vb
    if (coluna === 'nm_votavel') { va = a.nm_votavel ?? ''; vb = b.nm_votavel ?? '' }
    else if (coluna === 'total') { va = a._total; vb = b._total }
    else { va = a[coluna]; vb = b[coluna] }
    if (typeof va === 'string') return direcao === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    return direcao === 'asc' ? va - vb : vb - va
  })
  return lista
})

const ufs = computed(() =>
  [...(props.areas ?? [])]
    .filter((area) => area.sg_uf)
    .sort((a, b) => a.sg_uf.localeCompare(b.sg_uf)),
)

function votosPorCandidato(area, nrVotavel) {
  const linha = (area.candidatos ?? []).find(
    (c) => Number(c.nr_votavel) === Number(nrVotavel),
  )
  return linha ? Number(linha.qt_votos ?? 0) : 0
}

function totalPorCandidato(nrVotavel) {
  return ufs.value.reduce((total, area) => total + votosPorCandidato(area, nrVotavel), 0)
}

function delta(area, nrVotavel) {
  const linha = (area.candidatos ?? []).find(
    (c) => Number(c.nr_votavel) === Number(nrVotavel),
  )
  const d = Number(linha?.qt_votos_delta ?? 0)
  return d < 0 ? 0 : d
}

function deltaTotal(nrVotavel) {
  return ufs.value.reduce((t, area) => t + delta(area, nrVotavel), 0)
}

function seta(coluna) {
  if (ordenacao.value.coluna !== coluna) return ''
  return ordenacao.value.direcao === 'asc' ? ' ↑' : ' ↓'
}

</script>

<template>
  <section class="painel" aria-labelledby="votos-estado-titulo">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">Distribuição</p>
        <h2 id="votos-estado-titulo">Votos por estado</h2>
      </div>
    </header>

    <div v-if="ufs.length === 0 || listaCandidatos.length === 0" class="vazio">
      {{ $t('mapa.semDadosEstado') }}
    </div>

    <div v-else class="tabela-scroll">
      <table class="tabela-votos-estado">
        <thead>
          <tr>
            <th scope="col" class="ordenavel" @click="alternar('nm_votavel')">Candidato{{ seta('nm_votavel') }}</th>
            <th v-for="area in ufs" :key="area.sg_uf" scope="col" class="num">
              {{ area.sg_uf }}
            </th>
            <th scope="col" class="num ordenavel" @click="alternar('total')">Total{{ seta('total') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidato in listaCandidatos" :key="candidato.nr_votavel">
            <th scope="row">
              <div class="votos-estado-candidato">
                <strong>{{ candidato.nm_votavel }}</strong>
                <small>{{ candidato.sg_partido }} {{ candidato.nr_votavel }}</small>
              </div>
            </th>
            <td v-for="area in ufs" :key="area.sg_uf" class="num">
              <div>{{ formatarNumero(votosPorCandidato(area, candidato.nr_votavel)) }}</div>
              <small v-if="delta(area, candidato.nr_votavel) !== 0" class="delta">
                {{ delta(area, candidato.nr_votavel) > 0 ? '+' : '' }}{{ formatarNumero(delta(area, candidato.nr_votavel)) }}
              </small>
            </td>
            <td class="num">
              <strong>{{ formatarNumero(totalPorCandidato(candidato.nr_votavel)) }}</strong>
              <small v-if="deltaTotal(candidato.nr_votavel) !== 0" class="delta">
                {{ deltaTotal(candidato.nr_votavel) > 0 ? '+' : '' }}{{ formatarNumero(deltaTotal(candidato.nr_votavel)) }}
              </small>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
