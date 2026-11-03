import { ref } from 'vue'

export function useOrdenacao(inicial = null) {
  const ordenacao = ref(inicial)
  function alternar(coluna) {
    const atual = ordenacao.value
    ordenacao.value =
      atual?.ordem === coluna
        ? { ordem: coluna, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' }
        : { ordem: coluna, direcao: 'asc' }
  }
  return { ordenacao, alternar }
}
