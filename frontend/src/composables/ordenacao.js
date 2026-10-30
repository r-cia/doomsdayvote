import { computed, reactive, toRefs } from 'vue'

export function useOrdenacao(sufixo = '') {
  const estado = reactive({ coluna: null, direcao: 'asc' })
  const complemento = sufixo ? `_${sufixo}` : ''

  function alternar(coluna) {
    if (estado.coluna === coluna) {
      estado.direcao = estado.direcao === 'asc' ? 'desc' : 'asc'
    } else {
      estado.coluna = coluna
      estado.direcao = 'asc'
    }
  }

  function ariaSort(coluna) {
    if (estado.coluna !== coluna) return 'none'
    return estado.direcao === 'asc' ? 'ascending' : 'descending'
  }

  function seta(coluna) {
    if (estado.coluna !== coluna) return ''
    return estado.direcao === 'asc' ? ' ↑' : ' ↓'
  }

  const params = computed(() =>
    estado.coluna
      ? { [`ordem${complemento}`]: estado.coluna, [`direcao${complemento}`]: estado.direcao }
      : {},
  )

  return { ...toRefs(estado), alternar, ariaSort, seta, params }
}
