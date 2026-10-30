<script setup>
import { computed } from 'vue'
import { formatarDecimal, formatarNumero } from '../lib/format'
import StateBlock from './StateBlock.vue'
import { useOrdenacao } from '../composables/ordenacao'

const props = defineProps({
  dados: { type: Object, default: null },
  selecionado: { type: Number, default: null },
  loading: { type: Boolean, default: false },
  ordenacao: { type: Object, default: () => useOrdenacao() },
})

const { alternar, ariaSort, seta } = props.ordenacao

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
  return formatarDecimal(valor, 4, 4)
}

</script>

<template>
  <section class="painel" aria-labelledby="benford-titulo">
    <header class="painel__cabecalho">
      <h2 id="benford-titulo">{{ $t('estatistica.benford') }}</h2>
      <p v-if="!loading && dados" class="painel__meta">
        <b>{{ formatarNumero(ativo?.n) }}</b> seções
      </p>
    </header>

    <StateBlock v-if="loading && !dados" estado="carregando" :titulo="$t('comum.carregando')" />
    <div v-else-if="!dados || candidatos.length === 0" class="vazio">
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
                <th scope="col" class="ordenavel" :aria-sort="ariaSort('nm_votavel')"><button type="button" @click="alternar('nm_votavel')">{{ $t('estatistica.candidato') }}{{ seta('nm_votavel') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSort('n')"><button type="button" @click="alternar('n')">n{{ seta('n') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSort('mad')"><button type="button" @click="alternar('mad')">MAD{{ seta('mad') }}</button></th>
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
      </div>
    </template>
  </section>
</template>
