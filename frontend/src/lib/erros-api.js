import i18n from '../i18n'

const NAO_ENCONTRADO = {
  'Eleição não encontrada': 'eleicao',
  'Seção não encontrada': 'secao',
  'Grupo não encontrado': 'grupo',
}

export function mensagemErroApi({ codigo, mensagem } = {}, status) {
  const { t, te } = i18n.global
  if (codigo === 'NOT_FOUND' && NAO_ENCONTRADO[mensagem]) {
    return t(`erros.naoEncontrado.${NAO_ENCONTRADO[mensagem]}`)
  }
  const chave = `erros.codigo.${codigo}`
  if (codigo && te(chave)) return t(chave)
  return mensagem || t('erros.falhaConsulta', { status })
}
