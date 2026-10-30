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

const topShare = computed(() => props.dados?.top_share ?? props.dados?.top_por_share ?? [])
const topMargem = computed(() => props.dados?.top_margem ?? props.dados?.top_por_margem ?? [])
const cobertura = computed(() => props.dados?.cobertura ?? null)

function percentualRazao(valor) {
  if (valor === null || valor === undefined) return '—'
  return formatarPercentual(Number(valor) * 100)
}

function percentual(valor) {
  if (valor === null || valor === undefined) return '—'
  return formatarPercentual(valor)
}

function pontosPercentuais(valor) {
  if (valor === null || valor === undefined) return '—'
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '—'
  return `${numero > 0 ? '+' : ''}${formatarNumero(numero)} pp`
}

function municipio(secao) {
  return secao?.nm_municipio || (secao?.cd_municipio_tse == null ? '—' : String(secao.cd_municipio_tse))
}
</script>

<template>
  <section class="painel" aria-labelledby="concentracao-titulo">
    <header class="painel__cabecalho">
      <h2 id="concentracao-titulo">Concentração e margem por seção</h2>
      <p class="painel__meta">
        {{ formatarNumero(topShare.length) }} por participação ·
        {{ formatarNumero(topMargem.length) }} por margem
      </p>
    </header>

    <StateBlock v-if="loading" estado="carregando" titulo="Carregando" />
    <StateBlock v-else-if="error" estado="erro" titulo="Erro" :descricao="error" acao="Tentar novamente" @acao="emit('retry')" />
    <div v-else-if="topShare.length === 0 && topMargem.length === 0" class="vazio">
      Nenhuma seção no recorte.
    </div>
    <div v-else class="concentracao-grade">
      <article class="concentracao-grade__grupo">
        <header class="grupo__cabecalho">
          <h3>Maior participação</h3>
        </header>
        <div class="tabela-scroll">
          <table class="analise-tabela">
            <caption class="sr-only">Seções classificadas por participação do líder</caption>
            <thead>
              <tr>
                <th scope="col" class="num">Pos.</th>
                <th scope="col">UF</th>
                <th scope="col">Município</th>
                <th scope="col" class="num">Zona</th>
                <th scope="col" class="num">Seção</th>
                <th scope="col" class="num">Part. do líder</th>
                <th scope="col" class="num">Margem 1º–2º (votos)</th>
                <th scope="col" class="num">Percentil</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, indice) in topShare" :key="item.secao?.id ?? item.id">
                <td class="num">{{ formatarNumero(indice + 1) }}</td>
                <td>{{ item.secao?.sg_uf || '—' }}</td>
                <td>{{ municipio(item.secao) }}</td>
                <td class="num">{{ formatarNumero(item.secao?.nr_zona) }}</td>
                <td class="num">{{ formatarNumero(item.secao?.nr_secao) }}</td>
                <td class="num">{{ percentualRazao(item.share_lider) }}</td>
                <td class="num">{{ formatarNumero(item.margem_absoluta) }}</td>
                <td class="num">{{ percentual(item.contexto?.share_lider_percentil) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
      <article class="concentracao-grade__grupo">
        <header class="grupo__cabecalho">
          <h3>Maior margem</h3>
        </header>
        <div class="tabela-scroll">
          <table class="analise-tabela">
            <caption class="sr-only">Seções classificadas pela margem entre os dois primeiros</caption>
            <thead>
              <tr>
                <th scope="col" class="num">Pos.</th>
                <th scope="col">UF</th>
                <th scope="col">Município</th>
                <th scope="col" class="num">Zona</th>
                <th scope="col" class="num">Seção</th>
                <th scope="col" class="num">Margem 1º–2º (votos)</th>
                <th scope="col" class="num">Margem 1º–2º (pp)</th>
                <th scope="col" class="num">Part. do líder</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, indice) in topMargem" :key="`m-${item.secao?.id ?? item.id}`">
                <td class="num">{{ formatarNumero(indice + 1) }}</td>
                <td>{{ item.secao?.sg_uf || '—' }}</td>
                <td>{{ municipio(item.secao) }}</td>
                <td class="num">{{ formatarNumero(item.secao?.nr_zona) }}</td>
                <td class="num">{{ formatarNumero(item.secao?.nr_secao) }}</td>
                <td class="num">{{ formatarNumero(item.margem_absoluta) }}</td>
                <td class="num">{{ pontosPercentuais(item.margem_pp) }}</td>
                <td class="num">{{ percentualRazao(item.share_lider) }}</td>
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
        <dt>Com contexto</dt>
        <dd>{{ formatarNumero(cobertura.com_contexto) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>Sem contexto</dt>
        <dd>{{ formatarNumero(cobertura.sem_contexto) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>Grupos insuficientes</dt>
        <dd>{{ formatarNumero(cobertura.grupos_insuficientes) }}</dd>
      </div>
    </dl>
  </section>
</template>
