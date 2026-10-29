<script setup>
import { computed } from 'vue'
import StateBlock from './StateBlock.vue'
import { candidatosNominais, linhasMapa } from '../lib/agregacoes'
import { corPartido, corTextoContraste } from '../lib/colors'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  areas: { type: Array, default: () => [] },
  candidatos: { type: Array, default: () => [] },
  votos: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  ufSelecionada: { type: String, default: null },
})

defineEmits(['select', 'municipios', 'retry', 'limpar'])

const partidoPorNumero = computed(() => {
  const mapa = new Map()
  for (const candidato of props.candidatos) {
    mapa.set(candidato.nr_votavel, candidato)
  }
  return mapa
})

const linhas = computed(() => {
  const base = linhasMapa(props.areas, 'uf').map(({ area }) => {
    const candidato = partidoPorNumero.value.get(area.lider?.nr_votavel)
    return {
      uf: area.sg_uf,
      total: Number(area.total_votos ?? 0),
      lider: area.lider,
      liderNome: candidato?.nm_votavel ?? null,
      liderSigla: candidato?.sg_partido ?? null,
      liderPercentual: area.lider?.percentual ?? null,
    }
  })
  return base.map((linha) => ({
    ...linha,
    largura: Math.max(0, Math.min(100, Number(linha.liderPercentual ?? 0))),
  }))
})

const votosUf = computed(() => candidatosNominais(props.votos))
</script>

<template>
  <section class="card uf-painel" aria-labelledby="uf-painel-titulo">
    <div class="card__cabecalho">
      <div>
        <h2 id="uf-painel-titulo">
          {{ ufSelecionada ? `Votos em ${ufSelecionada}` : 'Painel por UF' }}
        </h2>
      </div>
      <div class="uf-painel__acoes">
        <button
          v-if="ufSelecionada"
          type="button"
          class="button button--ghost button--compacto"
          @click="$emit('municipios', ufSelecionada)"
        >
          Municípios
        </button>
        <button
          type="button"
          class="button button--ghost button--compacto"
          @click="$emit('limpar')"
        >
          Brasil
        </button>
        <span class="contador">
          {{ ufSelecionada ? `${votosUf.length} candidatos` : `${linhas.length} UFs` }}
        </span>
      </div>
    </div>

    <StateBlock
      v-if="error"
      estado="erro"
      titulo="Não foi possível carregar o painel por UF"
      :descricao="error"
      acao="Tentar novamente"
      @acao="$emit('retry')"
    />
    <StateBlock
      v-else-if="loading && linhas.length === 0"
      estado="carregando"
      titulo="Carregando painel por UF"
    />

    <div v-else-if="ufSelecionada" class="tabela-scroll uf-painel__scroll">
      <table>
        <caption class="sr-only">Votos por candidato em {{ ufSelecionada }}</caption>
        <thead>
          <tr>
            <th scope="col">Candidato</th>
            <th scope="col">Partido</th>
            <th scope="col" class="num">Votos</th>
            <th scope="col" class="num">% válidos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidato in votosUf" :key="candidato.nr_votavel">
            <td>{{ candidato.nm_votavel }}</td>
            <td>
              <span
                class="party-dot party-dot--mini"
                :style="{
                  backgroundColor: corPartido(candidato.sg_partido),
                  color: corTextoContraste(corPartido(candidato.sg_partido)),
                }"
              >{{ candidato.sg_partido ?? '—' }}</span>
            </td>
            <td class="num">{{ formatarNumero(candidato.qt_votos) }}</td>
            <td class="num">{{ formatarPercentual(candidato.percentual) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="votosUf.length === 0" class="vazio">Sem votos nesta UF no corte.</p>
    </div>

    <p v-else-if="linhas.length === 0" class="vazio">
      Nenhuma UF com dados para os filtros atuais.
    </p>

    <div v-else class="tabela-scroll uf-painel__scroll">
      <table>
        <caption class="sr-only">Resumo de votos e líder por UF</caption>
        <thead>
          <tr>
            <th scope="col">UF</th>
            <th scope="col" class="num">Votos</th>
            <th scope="col">Líder</th>
            <th scope="col" class="num">% líder</th>
            <th scope="col"><span class="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="linha in linhas"
            :key="linha.uf"
            :class="{ 'linha--ativa': ufSelecionada === linha.uf }"
          >
            <th scope="row">
              <button
                type="button"
                class="uf-botao"
                :aria-pressed="ufSelecionada === linha.uf"
                @click="$emit('select', linha.uf)"
              >
                {{ linha.uf }}
              </button>
            </th>
            <td class="num">
              <span class="uf-votos">{{ formatarNumero(linha.total) }}</span>
              <span class="uf-barra" aria-hidden="true">
                <span :style="{ width: `${linha.largura}%` }"></span>
              </span>
            </td>
            <td>
              <span v-if="linha.lider" class="lider">
                <span
                  v-if="linha.liderSigla"
                  class="party-dot party-dot--mini"
                  :style="{
                    backgroundColor: corPartido(linha.liderSigla),
                    color: corTextoContraste(corPartido(linha.liderSigla)),
                  }"
                >{{ linha.liderSigla }}</span>
                {{ linha.liderNome ?? `Candidato ${linha.lider.nr_votavel}` }}
              </span>
              <span v-else>—</span>
            </td>
            <td class="num">{{ formatarPercentual(linha.liderPercentual) }}</td>
            <td>
              <button
                type="button"
                class="button button--ghost button--compacto"
                :aria-label="`Ver municípios de ${linha.uf}`"
                @click="$emit('municipios', linha.uf)"
              >
                Municípios
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
