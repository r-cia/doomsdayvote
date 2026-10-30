<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import StateBlock from './StateBlock.vue'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['retry'])
const { t } = useI18n()

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
  return {
    local: t('analiseUI.local'),
    zona: t('analiseUI.zona'),
    municipio: t('analiseUI.municipio'),
  }[rotulo] ?? rotulo
}
</script>

<template>
  <section class="painel" aria-labelledby="comparacao-local-titulo">
    <header class="painel__cabecalho">
      <h2 id="comparacao-local-titulo">{{ $t('analiseUI.comparacaoLocal') }}</h2>
      <p v-if="!loading && dados" class="painel__meta">
        {{ formatarNumero(grupos.length) }} {{ $t('analiseUI.grupos') }}
      </p>
    </header>

    <StateBlock v-if="loading && !dados" estado="carregando" :titulo="$t('comum.carregando')" />
    <StateBlock v-else-if="error" estado="erro" :titulo="$t('comum.erro')" :descricao="error" :acao="$t('comum.tentarNovamente')" @acao="emit('retry')" />
    <div v-else-if="grupos.length === 0" class="vazio">
      {{ $t('comum.semGruposComparaveis') }}
    </div>
    <div v-else class="grupos">
      <article v-for="(grupo, indice) in grupos" :key="grupo.chave ?? indice" class="grupo">
        <header class="grupo__cabecalho">
          <h3>{{ nivel(grupo.nivel) }} · {{ formatarNumero(grupo.tamanho) }} {{ $t('analiseUI.secoes') }}</h3>
          <span v-if="grupo.dados_insuficientes" class="status status--warning">{{ $t('analiseUI.dadosInsuficientes') }}</span>
        </header>
        <div class="tabela-scroll">
          <table class="analise-tabela">
            <caption class="sr-only">{{ $t('analiseUI.secoesGrupo', { level: nivel(grupo.nivel) }) }}</caption>
            <thead>
              <tr>
                <th scope="col">UF</th>
                <th scope="col">{{ $t('analiseUI.municipio') }}</th>
                <th scope="col" class="num">{{ $t('analiseUI.zona') }}</th>
                <th scope="col" class="num">{{ $t('analiseUI.secao') }}</th>
                <th scope="col" class="num">{{ $t('analiseUI.participacao') }}</th>
                <th scope="col" class="num">{{ $t('analiseUI.abstencao') }}</th>
                <th scope="col" class="num">{{ $t('analiseUI.deltaMedianaParticipacao') }}</th>
                <th scope="col" class="num">{{ $t('analiseUI.deltaMedianaAbstencao') }}</th>
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
    <dl v-if="cobertura" class="painel-resumo" :aria-label="$t('comum.resumoCobertura')">
      <div class="painel-resumo__item">
        <dt>{{ $t('analiseUI.secoesConsideradas') }}</dt>
        <dd>{{ formatarNumero(cobertura.consideradas) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>{{ $t('analiseUI.comGrupo') }}</dt>
        <dd>{{ formatarNumero(cobertura.com_grupo) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>{{ $t('analiseUI.semGrupo') }}</dt>
        <dd>{{ formatarNumero(cobertura.sem_grupo) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>{{ $t('analiseUI.gruposInsuficientes') }}</dt>
        <dd>{{ formatarNumero(cobertura.grupos_insuficientes) }}</dd>
      </div>
    </dl>
  </section>
</template>
