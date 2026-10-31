<script setup>
import { computed } from 'vue'
import StateBlock from './StateBlock.vue'
import TabelaScroll from './TabelaScroll.vue'
import { formatarNumero, formatarPercentual } from '../lib/format'
import { useOrdenacao } from '../composables/ordenacao'

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  atualizando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  ordenacaoShare: { type: Object, default: () => useOrdenacao('share') },
  ordenacaoMargem: { type: Object, default: () => useOrdenacao('margem') },
})

const { alternar: alternarShare, ariaSort: ariaSortShare, seta: setaShare } = props.ordenacaoShare
const { alternar: alternarMargem, ariaSort: ariaSortMargem, seta: setaMargem } = props.ordenacaoMargem

const emit = defineEmits(['retry'])

const topShare = computed(() => props.dados?.top_share ?? [])
const topMargem = computed(() => props.dados?.top_margem ?? [])
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
      <h2 id="concentracao-titulo">{{ $t('analiseUI.concentracao') }}</h2>
      <p v-if="!loading && dados" class="painel__meta">
        {{ formatarNumero(topShare.length) }} {{ $t('analiseUI.porParticipacao') }} ·
        {{ formatarNumero(topMargem.length) }} {{ $t('analiseUI.porMargem') }}
      </p>
    </header>

    <StateBlock v-if="loading && !dados" estado="carregando" :titulo="$t('comum.carregando')" />
    <StateBlock v-else-if="error" estado="erro" :titulo="$t('comum.erro')" :descricao="error" :acao="$t('comum.tentarNovamente')" @acao="emit('retry')" />
    <div v-else-if="topShare.length === 0 && topMargem.length === 0" class="vazio">
      {{ $t('comum.nenhumaSecaoRecorte') }}
    </div>
    <div v-else class="concentracao-grade">
      <article class="concentracao-grade__grupo">
        <header class="grupo__cabecalho">
          <h3>{{ $t('analiseUI.maiorParticipacao') }}</h3>
        </header>
        <TabelaScroll :atualizando="atualizando">
          <table class="analise-tabela">
            <caption class="sr-only">{{ $t('analiseUI.secoesPorParticipacao') }}</caption>
            <thead>
              <tr>
                <th scope="col" class="num">{{ $t('analiseUI.posicao') }}</th>
                <th scope="col" class="ordenavel" :aria-sort="ariaSortShare('sg_uf')"><button type="button" @click="alternarShare('sg_uf')">UF{{ setaShare('sg_uf') }}</button></th>
                <th scope="col" class="ordenavel" :aria-sort="ariaSortShare('nm_municipio')"><button type="button" @click="alternarShare('nm_municipio')">{{ $t('analiseUI.municipio') }}{{ setaShare('nm_municipio') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSortShare('nr_zona')"><button type="button" @click="alternarShare('nr_zona')">{{ $t('analiseUI.zona') }}{{ setaShare('nr_zona') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSortShare('nr_secao')"><button type="button" @click="alternarShare('nr_secao')">{{ $t('analiseUI.secao') }}{{ setaShare('nr_secao') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSortShare('share_lider')"><button type="button" @click="alternarShare('share_lider')">{{ $t('analiseUI.participacaoLider') }}{{ setaShare('share_lider') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSortShare('margem_absoluta')"><button type="button" @click="alternarShare('margem_absoluta')">{{ $t('analiseUI.margemVotos') }}{{ setaShare('margem_absoluta') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSortShare('share_lider_percentil')"><button type="button" @click="alternarShare('share_lider_percentil')">{{ $t('analiseUI.percentil') }}{{ setaShare('share_lider_percentil') }}</button></th>
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
        </TabelaScroll>
      </article>
      <article class="concentracao-grade__grupo">
        <header class="grupo__cabecalho">
          <h3>{{ $t('analiseUI.maiorMargem') }}</h3>
        </header>
        <TabelaScroll :atualizando="atualizando">
          <table class="analise-tabela">
            <caption class="sr-only">{{ $t('analiseUI.secoesPorMargem') }}</caption>
            <thead>
              <tr>
                <th scope="col" class="num">{{ $t('analiseUI.posicao') }}</th>
                <th scope="col" class="ordenavel" :aria-sort="ariaSortMargem('sg_uf')"><button type="button" @click="alternarMargem('sg_uf')">UF{{ setaMargem('sg_uf') }}</button></th>
                <th scope="col" class="ordenavel" :aria-sort="ariaSortMargem('nm_municipio')"><button type="button" @click="alternarMargem('nm_municipio')">{{ $t('analiseUI.municipio') }}{{ setaMargem('nm_municipio') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSortMargem('nr_zona')"><button type="button" @click="alternarMargem('nr_zona')">{{ $t('analiseUI.zona') }}{{ setaMargem('nr_zona') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSortMargem('nr_secao')"><button type="button" @click="alternarMargem('nr_secao')">{{ $t('analiseUI.secao') }}{{ setaMargem('nr_secao') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSortMargem('margem_absoluta')"><button type="button" @click="alternarMargem('margem_absoluta')">{{ $t('analiseUI.margemVotos') }}{{ setaMargem('margem_absoluta') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSortMargem('margem_pp')"><button type="button" @click="alternarMargem('margem_pp')">{{ $t('analiseUI.margemPontos') }}{{ setaMargem('margem_pp') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSortMargem('share_lider')"><button type="button" @click="alternarMargem('share_lider')">{{ $t('analiseUI.participacaoLider') }}{{ setaMargem('share_lider') }}</button></th>
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
        </TabelaScroll>
      </article>
    </div>
    <dl v-if="cobertura" class="painel-resumo" :aria-label="$t('comum.resumoCobertura')">
      <div class="painel-resumo__item">
        <dt>{{ $t('analiseUI.secoesConsideradas') }}</dt>
        <dd>{{ formatarNumero(cobertura.consideradas) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>{{ $t('analiseUI.comContexto') }}</dt>
        <dd>{{ formatarNumero(cobertura.com_contexto) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>{{ $t('analiseUI.semContexto') }}</dt>
        <dd>{{ formatarNumero(cobertura.sem_contexto) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>{{ $t('analiseUI.gruposInsuficientes') }}</dt>
        <dd>{{ formatarNumero(cobertura.grupos_insuficientes) }}</dd>
      </div>
    </dl>
  </section>
</template>
