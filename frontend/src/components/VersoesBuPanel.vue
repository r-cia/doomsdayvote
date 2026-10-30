<script setup>
import { computed } from 'vue'
import StateBlock from './StateBlock.vue'

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const versoes = computed(() => props.dados?.versoes ?? [])
const comparacao = computed(() => props.dados?.comparacao ?? null)

function formatarDataHora(v) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('pt-BR')
}
</script>

<template>
  <section class="painel" aria-labelledby="versoes-titulo">
    <header class="painel__cabecalho">
      <h2 id="versoes-titulo">Versões do BU</h2>
      <p class="painel__meta">{{ versoes.length }} versões</p>
    </header>

    <StateBlock v-if="loading" estado="carregando" :titulo="'Carregando'" />
    <StateBlock v-else-if="error" estado="erro" :titulo="'Erro'" :descricao="error" />
    <div v-else-if="versoes.length === 0" class="vazio">
      Sem versões registradas.
    </div>
    <div v-else>
      <ul class="versoes-lista">
        <li v-for="v in versoes" :key="v.id" class="versao-item">
          <div class="versao-item__topo">
            <strong>Versão {{ v.versao }}</strong>
            <span v-if="v.ativo" class="status status--ok">ativa</span>
          </div>
          <dl class="dados dados--linha">
            <div><dt>Abertura</dt><dd>{{ formatarDataHora(v.dt_abertura) }}</dd></div>
            <div><dt>Encerramento</dt><dd>{{ formatarDataHora(v.dt_encerramento) }}</dd></div>
            <div><dt>Emissão</dt><dd>{{ formatarDataHora(v.dt_emissao_bu) }}</dd></div>
            <div><dt>Aptos</dt><dd>{{ v.qt_aptos ?? '—' }}</dd></div>
            <div><dt>Comparecimento</dt><dd>{{ v.qt_comparecimento ?? '—' }}</dd></div>
            <div><dt>Abstenções</dt><dd>{{ v.qt_abstencoes ?? '—' }}</dd></div>
            <div><dt>Lote</dt><dd>{{ v.lote?.nome_arquivo ?? '—' }}</dd></div>
            <div><dt>SHA-256 conteúdo</dt><dd class="mono">{{ v.conteudo_sha256 ?? '—' }}</dd></div>
          </dl>
        </li>
      </ul>

      <div v-if="comparacao" class="comparacao">
        <h3>Comparação v{{ comparacao.anterior }} → v{{ comparacao.atual }}</h3>
        <div v-if="comparacao.campos_alterados?.length">
          <h4>Campos alterados</h4>
          <table>
            <thead><tr><th>Campo</th><th>Anterior</th><th>Atual</th><th>Diferença</th></tr></thead>
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
          <h4>Votáveis alterados</h4>
          <table>
            <thead><tr><th>Número</th><th>Votável</th><th>Anterior</th><th>Atual</th><th>Diferença</th></tr></thead>
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
      <p v-else class="vazio">Sem versão anterior para comparar.</p>
    </div>
  </section>
</template>
