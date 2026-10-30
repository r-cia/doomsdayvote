<script setup>
import { computed } from 'vue'
import { formatarNumero } from '../lib/format'

const props = defineProps({
  dados: { type: Object, default: null },
  selecionado: { type: Number, default: null },
})

const emit = defineEmits(['select'])

const minimo = computed(() => props.dados?.minimo_votos ?? 10)
const candidatos = computed(() => props.dados?.candidatos ?? [])

const ativo = computed(() => {
  if (candidatos.value.length === 0) return null
  return (
    candidatos.value.find((candidato) => candidato.nr_votavel === props.selecionado) ??
    candidatos.value[0]
  )
})

function altura(valor) {
  return `${Math.max(1, Math.min(100, (valor / 35) * 100))}%`
}

function formatarMad(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

function avisoMetodologico() {
  return props.dados?.observacao ?? props.dados?.status_metodologico ?? ''
}
</script>

<template>
  <section class="painel" aria-labelledby="benford-titulo">
    <header class="painel__cabecalho">
      <h2 id="benford-titulo">{{ $t('estatistica.benford') }}</h2>
      <p class="painel__meta">
        primeiro dígito<br />
        <b>{{ formatarNumero(ativo?.n) }}</b> seções
      </p>
    </header>

    <div v-if="!dados || candidatos.length === 0" class="vazio">
      {{ $t("comum.semDados") }}
    </div>

    <template v-else>
      <div class="benford">
        <div
          class="benford__grafico"
          role="img"
          :aria-label="`Distribuição do primeiro dígito dos votos de ${ativo?.nm_votavel} por seção, comparada à lei de Benford`"
        >
          <div
            v-for="digito in ativo?.digitos ?? []"
            :key="digito.digito"
            class="benford__coluna"
          >
            <div class="benford__par">
              <span
                class="benford__obs"
                :style="{ height: altura(digito.observado_percentual) }"
                :title="`observado ${formatarMad(digito.observado_percentual)}%`"
              />
              <span
                class="benford__esp"
                :style="{ height: altura(digito.esperado_percentual) }"
                :title="`esperado ${formatarMad(digito.esperado_percentual)}%`"
              />
            </div>
            <span class="benford__digito">{{ digito.digito }}</span>
          </div>
        </div>

        <div class="benford__tabela">
          <table>
            <caption class="sr-only">
              Aderência à lei de Benford por candidato no corte atual
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ $t('estatistica.candidato') }}</th>
                <th scope="col" class="num">n</th>
                <th scope="col" class="num">MAD</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="candidato in candidatos"
                :key="candidato.nr_votavel"
                :data-ativo="ativo?.nr_votavel === candidato.nr_votavel"
              >
                <td>
                  <button
                    type="button"
                    :aria-pressed="ativo?.nr_votavel === candidato.nr_votavel"
                    @click="emit('select', candidato.nr_votavel)"
                  >
                    {{ candidato.nm_votavel }}
                  </button>
                </td>
                <td class="num">{{ formatarNumero(candidato.n) }}</td>
                <td class="num">{{ formatarMad(candidato.mad) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="benford__rodape">
        <p class="nota">
          <b>{{ formatarNumero(ativo?.secoes_abaixo_minimo) }}</b> seções abaixo do mínimo
        </p>
        <p class="nota">
          {{ avisoMetodologico() }}
        </p>
      </div>
    </template>
  </section>
</template>
