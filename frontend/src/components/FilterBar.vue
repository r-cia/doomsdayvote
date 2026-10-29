<script setup>
import { computed } from 'vue'

const props = defineProps({
  eleicoes: { type: Array, default: () => [] },
  cargos: { type: Array, default: () => [] },
  turnos: { type: Array, default: () => [] },
  candidatos: { type: Array, default: () => [] },
  filtros: { type: Object, required: true },
})

defineEmits([
  'update:election',
  'update:turno',
  'update:cargo',
  'update:candidato',
  'update:asof',
  'update:uf',
  'clear-municipio',
  'clear',
])

const UFS = [
  ['AC', 'Acre'],
  ['AL', 'Alagoas'],
  ['AP', 'Amapá'],
  ['AM', 'Amazonas'],
  ['BA', 'Bahia'],
  ['CE', 'Ceará'],
  ['DF', 'Distrito Federal'],
  ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'],
  ['MA', 'Maranhão'],
  ['MT', 'Mato Grosso'],
  ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'],
  ['PA', 'Pará'],
  ['PB', 'Paraíba'],
  ['PR', 'Paraná'],
  ['PE', 'Pernambuco'],
  ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'],
  ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'],
  ['RR', 'Roraima'],
  ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'],
  ['SE', 'Sergipe'],
  ['TO', 'Tocantins'],
]

const eleicoesDoTurno = computed(() => {
  if (props.filtros.turno === null || props.filtros.turno === undefined) {
    return props.eleicoes
  }
  return props.eleicoes.filter(
    (eleicao) => eleicao.nr_turno === Number(props.filtros.turno),
  )
})

const eleicaoAtual = computed(() =>
  props.eleicoes.find((eleicao) => eleicao.id === props.filtros.electionId),
)

function rotuloEleicao(eleicao) {
  const partes = [
    eleicao.ano_eleicao,
    `${eleicao.nr_turno}º turno`,
    eleicao.ds_eleicao,
  ].filter(Boolean)
  return partes.join(' · ')
}

function numeroOuNulo(valor) {
  return valor === '' ? null : Number(valor)
}
</script>

<template>
  <section class="card filtros" aria-labelledby="filtros-titulo">
    <div class="card__cabecalho filtros__cabecalho">
      <div>
        <h2 id="filtros-titulo">Filtros</h2>
        <p>Somente Presidente e Governador. O corte usa o horário de Brasília.</p>
      </div>
      <button type="button" class="button button--ghost" @click="$emit('clear')">
        Limpar filtros
      </button>
    </div>

    <div class="filtros__grade">
      <label class="campo">
        <span>Eleição</span>
        <select
          :value="filtros.electionId ?? ''"
          :disabled="eleicoesDoTurno.length === 0"
          @change="$emit('update:election', $event.target.value)"
        >
          <option v-if="eleicoesDoTurno.length === 0" value="">Nenhuma eleição</option>
          <option
            v-for="eleicao in eleicoesDoTurno"
            :key="eleicao.id"
            :value="eleicao.id"
          >
            {{ rotuloEleicao(eleicao) }}
          </option>
        </select>
      </label>

      <label class="campo campo--curto">
        <span>Turno</span>
        <select
          :value="filtros.turno ?? ''"
          :disabled="turnos.length === 0"
          @change="$emit('update:turno', Number($event.target.value))"
        >
          <option v-for="turno in turnos" :key="turno" :value="turno">
            {{ turno }}º turno
          </option>
        </select>
      </label>

      <label class="campo">
        <span>Cargo</span>
        <select
          :value="filtros.cargo ?? ''"
          :disabled="cargos.length === 0"
          @change="$emit('update:cargo', numeroOuNulo($event.target.value))"
        >
          <option v-if="cargos.length === 0" value="">Sem cargo disponível</option>
          <option
            v-for="cargo in cargos"
            :key="cargo.cd_cargo_pergunta"
            :value="cargo.cd_cargo_pergunta"
          >
            {{ cargo.ds_cargo_pergunta }}
          </option>
        </select>
      </label>

      <label class="campo">
        <span>Candidato <em>(destaque)</em></span>
        <select
          :value="filtros.candidato ?? ''"
          :disabled="candidatos.length === 0"
          @change="$emit('update:candidato', numeroOuNulo($event.target.value))"
        >
          <option value="">Todos os candidatos</option>
          <option
            v-for="candidato in candidatos"
            :key="candidato.nr_votavel"
            :value="candidato.nr_votavel"
          >
            {{ candidato.nr_votavel }} · {{ candidato.nm_votavel }}
            <template v-if="candidato.sg_partido">({{ candidato.sg_partido }})</template>
          </option>
        </select>
      </label>

      <label class="campo campo--largo">
        <span>Corte por data e hora</span>
        <span class="campo__linha">
          <input
            type="datetime-local"
            :value="filtros.asOfInput"
            aria-describedby="corte-ajuda"
            @input="$emit('update:asof', $event.target.value)"
          />
          <button
            v-if="filtros.asOfInput"
            type="button"
            class="button button--ghost button--compacto"
            @click="$emit('update:asof', '')"
          >
            Corte final
          </button>
        </span>
        <small id="corte-ajuda">Vazio significa corte final, sem recorte por recebimento.</small>
      </label>

      <label class="campo campo--curto">
        <span>UF</span>
        <select
          :value="filtros.uf ?? ''"
          @change="$emit('update:uf', $event.target.value || null)"
        >
          <option value="">Todas</option>
          <option v-for="[sigla, nome] in UFS" :key="sigla" :value="sigla">
            {{ sigla }} · {{ nome }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="filtros.municipio" class="filtros__ativos">
      <span class="chip">
        Município {{ filtros.municipio }}
        <button
          type="button"
          class="chip__remover"
          aria-label="Remover filtro de município"
          @click="$emit('clear-municipio')"
        >
          ×
        </button>
      </span>
    </div>

    <p v-if="eleicaoAtual" class="filtros__nota">
      {{ eleicaoAtual.ds_eleicao }} · {{ eleicaoAtual.ano_eleicao }} ·
      {{ eleicaoAtual.nr_turno }}º turno
    </p>
  </section>
</template>
