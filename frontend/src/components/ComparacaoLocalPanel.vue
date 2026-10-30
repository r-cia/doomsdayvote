<script setup>
import { computed } from 'vue'
import StateBlock from './StateBlock.vue'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['retry'])

const grupos = computed(() => props.dados?.grupos ?? [])
const cobertura = computed(() => props.dados?.cobertura ?? null)

function percentual(valor) {
  if (valor === null || valor === undefined) return '—'
  return formatarPercentual(Number(valor) * 100)
}

function pontosPercentuais(valor) {
  if (valor === null || valor === undefined) return '—'
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '—'
  return `${numero > 0 ? '+' : ''}${formatarNumero(numero)} pp`
}

function municipio(secao) {
  return secao.nm_municipio || (secao.cd_municipio_tse == null ? '—' : String(secao.cd_municipio_tse))
}

function nivel(rotulo) {
  return { local: 'Local', zona: 'Zona', municipio: 'Município' }[rotulo] ?? rotulo
}
</script>

<template>
  <section class="painel" aria-labelledby="comparacao-local-titulo">
    <header class="painel__cabecalho">
      <h2 id="comparacao-local-titulo">Comparação local entre seções semelhantes</h2>
      <p class="painel__meta">
        {{ formatarNumero(grupos.length) }} grupos
      </p>
    </header>

    <StateBlock v-if="loading" estado="carregando" titulo="Carregando" />
    <StateBlock v-else-if="error" estado="erro" titulo="Erro" :descricao="error" acao="Tentar novamente" @acao="emit('retry')" />
    <div v-else-if="grupos.length === 0" class="vazio">
      Nenhum grupo comparável no recorte.
    </div>
    <div v-else class="grupos">
      <article v-for="(grupo, indice) in grupos" :key="grupo.chave ?? indice" class="grupo">
        <header class="grupo__cabecalho">
          <h3>{{ nivel(grupo.nivel) }} · {{ formatarNumero(grupo.tamanho) }} seções</h3>
          <span v-if="grupo.dados_insuficientes" class="status status--warning">Dados insuficientes</span>
        </header>
        <div class="tabela-scroll">
          <table class="analise-tabela">
            <caption class="sr-only">Seções do grupo {{ nivel(grupo.nivel) }}</caption>
            <thead>
              <tr>
                <th scope="col">UF</th>
                <th scope="col">Município</th>
                <th scope="col" class="num">Zona</th>
                <th scope="col" class="num">Seção</th>
                <th scope="col" class="num">Participação</th>
                <th scope="col" class="num">Abstenção</th>
                <th scope="col" class="num">Δ mediana part. (pp)</th>
                <th scope="col" class="num">Δ mediana abst. (pp)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in grupo.secoes" :key="item.secao.id">
                <td>{{ item.secao.sg_uf || '—' }}</td>
                <td>{{ municipio(item.secao) }}</td>
                <td class="num">{{ formatarNumero(item.secao.nr_zona) }}</td>
                <td class="num">{{ formatarNumero(item.secao.nr_secao) }}</td>
                <td class="num">{{ percentual(item.metricas.participacao) }}</td>
                <td class="num">{{ percentual(item.metricas.abstencao) }}</td>
                <td class="num">{{ pontosPercentuais(item.distancia_pp?.participacao_pp) }}</td>
                <td class="num">{{ pontosPercentuais(item.distancia_pp?.abstencao_pp) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>
    <dl v-if="cobertura" class="painel-resumo" aria-label="Resumo da cobertura">
      <div class="painel-resumo__item">
        <dt>Seções consideradas</dt>
        <dd>{{ formatarNumero(cobertura.consideradas) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>Com grupo</dt>
        <dd>{{ formatarNumero(cobertura.com_grupo) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>Sem grupo</dt>
        <dd>{{ formatarNumero(cobertura.sem_grupo) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>Grupos insuficientes</dt>
        <dd>{{ formatarNumero(cobertura.grupos_insuficientes) }}</dd>
      </div>
    </dl>
  </section>
</template>
