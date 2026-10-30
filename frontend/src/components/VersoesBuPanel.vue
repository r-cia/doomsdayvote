<script setup>
import { computed } from 'vue'
import { formatarDataHora } from '../lib/format'
import StateBlock from './StateBlock.vue'

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const versoes = computed(() => props.dados?.versoes ?? [])
const comparacao = computed(() => props.dados?.comparacao ?? null)

</script>

<template>
  <section class="painel" aria-labelledby="versoes-titulo">
    <header class="painel__cabecalho">
      <h2 id="versoes-titulo">{{ $t('versoesBU.titulo') }}</h2>
      <p v-if="!loading && dados" class="painel__meta">{{ versoes.length }} {{ $t('versoesBU.versoes') }}</p>
    </header>

    <StateBlock v-if="loading && !dados" estado="carregando" :titulo="$t('comum.carregando')" />
    <StateBlock v-else-if="error" estado="erro" :titulo="$t('comum.erro')" :descricao="error" />
    <div v-else-if="versoes.length === 0" class="vazio">
      {{ $t('comum.semVersoesRegistradas') }}
    </div>
    <div v-else>
      <ul class="versoes-lista">
        <li v-for="v in versoes" :key="v.id" class="versao-item">
          <div class="versao-item__topo">
            <strong>{{ $t('versoesBU.titulo') }} {{ v.versao }}</strong>
            <span v-if="v.ativo" class="status status--ok">{{ $t('versoesBU.ativa') }}</span>
          </div>
          <dl class="dados dados--linha">
            <div><dt>{{ $t('versoesBU.abertura') }}</dt><dd>{{ formatarDataHora(v.dt_abertura) }}</dd></div>
            <div><dt>{{ $t('versoesBU.encerramento') }}</dt><dd>{{ formatarDataHora(v.dt_encerramento) }}</dd></div>
            <div><dt>{{ $t('versoesBU.emissao') }}</dt><dd>{{ formatarDataHora(v.dt_emissao_bu) }}</dd></div>
            <div><dt>{{ $t('versoesBU.aptos') }}</dt><dd>{{ v.qt_aptos ?? '—' }}</dd></div>
            <div><dt>{{ $t('versoesBU.comparecimento') }}</dt><dd>{{ v.qt_comparecimento ?? '—' }}</dd></div>
            <div><dt>{{ $t('versoesBU.abstencoes') }}</dt><dd>{{ v.qt_abstencoes ?? '—' }}</dd></div>
            <div><dt>{{ $t('versoesBU.lote') }}</dt><dd>{{ v.lote?.nome_arquivo ?? '—' }}</dd></div>
            <div><dt>{{ $t('versoesBU.hashConteudo') }}</dt><dd class="mono">{{ v.conteudo_sha256 ?? '—' }}</dd></div>
          </dl>
        </li>
      </ul>

      <div v-if="comparacao" class="comparacao">
        <h3>{{ $t('versoesBU.comparacao', { previous: comparacao.anterior, current: comparacao.atual }) }}</h3>
        <div v-if="comparacao.campos_alterados?.length">
          <h4>{{ $t('versoesBU.camposAlterados') }}</h4>
          <table>
            <thead><tr><th>{{ $t('versoesBU.campo') }}</th><th>{{ $t('versoesBU.anterior') }}</th><th>{{ $t('versoesBU.atual') }}</th><th>{{ $t('versoesBU.diferenca') }}</th></tr></thead>
            <tbody>
              <tr v-for="(c, i) in comparacao.campos_alterados" :key="i">
                <td>{{ c.campo }}</td>
                <td>{{ c.anterior ?? '—' }}</td>
                <td>{{ c.atual ?? '—' }}</td>
                <td>{{ c.diferenca ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="comparacao.votaveis_alterados?.length">
          <h4>{{ $t('versoesBU.votaveisAlterados') }}</h4>
          <table>
            <thead><tr><th>{{ $t('versoesBU.numero') }}</th><th>{{ $t('versoesBU.votavel') }}</th><th>{{ $t('versoesBU.anterior') }}</th><th>{{ $t('versoesBU.atual') }}</th><th>{{ $t('versoesBU.diferenca') }}</th></tr></thead>
            <tbody>
              <tr v-for="(v, i) in comparacao.votaveis_alterados" :key="i">
                <td>{{ v.nr_votavel }}</td>
                <td>{{ v.nm_votavel ?? '—' }}</td>
                <td>{{ v.anterior ?? '—' }}</td>
                <td>{{ v.atual ?? '—' }}</td>
                <td>{{ v.diferenca ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="observacao">{{ comparacao.observacao }}</p>
      </div>
      <p v-else class="vazio">{{ $t('comum.semVersaoAnterior') }}</p>
    </div>
  </section>
</template>
