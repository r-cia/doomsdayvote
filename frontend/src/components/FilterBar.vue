<script setup>
import { computed } from 'vue'

const props = defineProps({
  cargos: { type: Array, default: () => [] },
  anos: { type: Array, default: () => [] },
  turnos: { type: Array, default: () => [] },
  candidatos: { type: Array, default: () => [] },
  filtros: { type: Object, required: true },
})

const emit = defineEmits([
  'update:cargo',
  'update:ano',
  'update:turno',
  'update:candidato',
  'update:asof',
  'update:uf',
  'clear-municipio',
  'clear',
])

const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS',
  'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC',
  'SE', 'SP', 'TO',
]

const municipioAtivo = computed(() => props.filtros.municipio)
</script>

<template>
  <section class="comando" aria-label="Filtros da consulta">
    <label class="campo campo--cargo">
      <span class="campo__rotulo">Cargo</span>
      <select
        :value="filtros.cargo ?? ''"
        @change="emit('update:cargo', Number($event.target.value))"
      >
        <option v-for="cargo in cargos" :key="cargo.cd_cargo_pergunta" :value="cargo.cd_cargo_pergunta">
          {{ cargo.ds_cargo_pergunta }}
        </option>
      </select>
    </label>

    <label class="campo campo--ano">
      <span class="campo__rotulo">Ano da eleição</span>
      <select
        :value="filtros.ano ?? ''"
        @change="emit('update:ano', Number($event.target.value))"
      >
        <option v-for="ano in anos" :key="ano" :value="ano">{{ ano }}</option>
      </select>
    </label>

    <label class="campo campo--curto">
      <span class="campo__rotulo">Turno</span>
      <select
        :value="filtros.turno ?? ''"
        @change="emit('update:turno', Number($event.target.value))"
      >
        <option v-for="turno in turnos" :key="turno" :value="turno">{{ turno }}º</option>
      </select>
    </label>

    <label class="campo campo--candidato">
      <span class="campo__rotulo">Candidato</span>
      <select
        :value="filtros.candidato ?? ''"
        @change="emit('update:candidato', $event.target.value === '' ? null : Number($event.target.value))"
      >
        <option value="">Todos</option>
        <option v-for="candidato in candidatos" :key="candidato.nr_votavel" :value="candidato.nr_votavel">
          {{ candidato.nm_votavel }} · {{ candidato.sg_partido ?? '—' }}
        </option>
      </select>
    </label>

    <label class="campo campo--corte">
      <span class="campo__rotulo">Corte do dia</span>
      <input
        type="datetime-local"
        :value="filtros.asOfInput"
        @change="emit('update:asof', $event.target.value)"
      />
    </label>

    <label class="campo campo--uf">
      <span class="campo__rotulo">UF</span>
      <select
        :value="filtros.uf ?? ''"
        @change="emit('update:uf', $event.target.value)"
      >
        <option value="">Brasil</option>
        <option v-for="uf in UFS" :key="uf" :value="uf">{{ uf }}</option>
      </select>
    </label>

    <div class="comando__acoes">
      <button
        v-if="municipioAtivo"
        type="button"
        class="button button--ghost button--compacto"
        @click="emit('clear-municipio')"
      >
        Limpar município
      </button>
      <button type="button" class="button button--ghost button--compacto" @click="emit('clear')">
        Limpar filtros
      </button>
    </div>
  </section>
</template>
