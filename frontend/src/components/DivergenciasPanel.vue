<script setup>
import { computed } from 'vue'
import StateBlock from './StateBlock.vue'
import TabelaScroll from './TabelaScroll.vue'
import { formatarValor } from '../lib/format'

const FONTES = ['rdv', 'log', 'bweb']

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  atualizando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  fonte: { type: String, default: '' },
  tamanho: { type: Number, default: 25 },
})

const emit = defineEmits(['retry', 'update:fonte', 'update:page'])

const itens = computed(() => props.dados?.itens ?? [])
const total = computed(() => Number(props.dados?.total ?? 0))
const pagina = computed(() => Number(props.dados?.pagina ?? 1))
const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(total.value / Math.max(1, props.tamanho))),
)

function votavel(item) {
  const cargo = formatarValor(item.cd_cargo_pergunta)
  const numero = formatarValor(item.nr_votavel)
  return cargo === '—' && numero === '—' ? '—' : `${cargo}/${numero}`
}

function irPara(destino) {
  emit('update:page', Math.min(Math.max(1, destino), totalPaginas.value))
}
</script>

<template>
  <section class="painel" aria-labelledby="divergencias-titulo">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">{{ $t('totalizacao.titulo') }}</p>
        <h2 id="divergencias-titulo">{{ $t('totalizacao.divergencias') }}</h2>
      </div>
      <label class="campo campo--curto">
        <span class="campo__rotulo">{{ $t('totalizacao.fonte') }}</span>
        <select :value="fonte" @change="emit('update:fonte', $event.target.value)">
          <option value="">{{ $t('totalizacao.todasFontes') }}</option>
          <option v-for="origem in FONTES" :key="origem" :value="origem">{{ origem }}</option>
        </select>
      </label>
    </header>

    <StateBlock
      v-if="loading && !dados"
      estado="carregando"
      :titulo="$t('comum.carregando')"
    />
    <StateBlock
      v-else-if="error"
      estado="erro"
      :titulo="$t('comum.erro')"
      :descricao="error"
      :acao="$t('comum.tentarNovamente')"
      @acao="emit('retry')"
    />
    <StateBlock
      v-else-if="itens.length === 0"
      estado="vazio"
      :titulo="$t('comum.semDados')"
      :descricao="$t('totalizacao.divergenciasVazio')"
    />

    <template v-else>
      <p class="painel__meta">
        {{ total }} {{ $t('analiseUI.divergencias') }}
      </p>
      <TabelaScroll :atualizando="atualizando">
        <table class="tabela">
          <caption class="sr-only">{{ $t('totalizacao.divergencias') }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ $t('biometria.uf') }}</th>
              <th scope="col">{{ $t('analiseUI.municipio') }}</th>
              <th scope="col" class="num">{{ $t('analiseUI.zona') }}</th>
              <th scope="col" class="num">{{ $t('analiseUI.secao') }}</th>
              <th scope="col">{{ $t('totalizacao.fonte') }}</th>
              <th scope="col">{{ $t('totalizacao.campo') }}</th>
              <th scope="col" class="num">{{ $t('totalizacao.votavel') }}</th>
              <th scope="col">{{ $t('totalizacao.esperado') }}</th>
              <th scope="col">{{ $t('totalizacao.encontrado') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in itens" :key="item.id">
              <td>{{ formatarValor(item.sg_uf) }}</td>
              <td>{{ formatarValor(item.cd_municipio_tse) }}</td>
              <td class="num">{{ formatarValor(item.nr_zona) }}</td>
              <td class="num">{{ formatarValor(item.nr_secao) }}</td>
              <td>{{ formatarValor(item.fonte) }}</td>
              <td>{{ formatarValor(item.campo) }}</td>
              <td class="num">{{ votavel(item) }}</td>
              <td>{{ formatarValor(item.valor_esperado) }}</td>
              <td>{{ formatarValor(item.valor_encontrado) }}</td>
            </tr>
          </tbody>
        </table>
      </TabelaScroll>

      <nav class="paginacao" :aria-label="$t('totalizacao.paginacaoDivergenciasAria')">
        <span>{{ $t('paginacao.pagina', { atual: pagina, total: totalPaginas }) }}</span>
        <div class="paginacao__botoes">
          <button
            type="button"
            class="button button--ghost button--compacto"
            :disabled="pagina <= 1"
            @click="irPara(1)"
          >
            {{ $t('paginacao.primeira') }}
          </button>
          <button
            type="button"
            class="button button--ghost button--compacto"
            :disabled="pagina <= 1"
            @click="irPara(pagina - 1)"
          >
            {{ $t('paginacao.anterior') }}
          </button>
          <button
            type="button"
            class="button button--ghost button--compacto"
            :disabled="pagina >= totalPaginas"
            @click="irPara(pagina + 1)"
          >
            {{ $t('paginacao.proxima') }}
          </button>
          <button
            type="button"
            class="button button--ghost button--compacto"
            :disabled="pagina >= totalPaginas"
            @click="irPara(totalPaginas)"
          >
            {{ $t('paginacao.ultima') }}
          </button>
        </div>
      </nav>
    </template>
  </section>
</template>
