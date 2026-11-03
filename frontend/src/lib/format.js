import { i18n, t } from '../i18n'

const FUSO = 'America/Sao_Paulo'

const idioma = () => i18n.global.locale.value
const cache = new Map()

function intl(Classe, locale, opcoes, rotulo) {
  const chave = `${rotulo}:${locale}`
  if (!cache.has(chave)) cache.set(chave, new Classe(locale, opcoes))
  return cache.get(chave)
}

const formatadorNumero = () => intl(Intl.NumberFormat, idioma(), undefined, 'numero')
const formatadorDataHora = () =>
  intl(Intl.DateTimeFormat, idioma(), { timeZone: FUSO, dateStyle: 'short', timeStyle: 'short' }, 'datahora')
const formatadorData = () => intl(Intl.DateTimeFormat, idioma(), { timeZone: FUSO, dateStyle: 'short' }, 'data')
const formatadorHora = () =>
  intl(Intl.DateTimeFormat, idioma(), { timeZone: FUSO, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }, 'hora')
const formatadorPartes = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const formatadorOffset = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSO,
  timeZoneName: 'longOffset',
})

export function formatarNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  const numero = Number(valor)
  return Number.isFinite(numero) ? formatadorNumero().format(numero) : '—'
}

export function formatarDecimal(valor, casas = 1) {
  if (valor === null || valor === undefined || valor === '') return '—'
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '—'
  return intl(
    Intl.NumberFormat,
    idioma(),
    { minimumFractionDigits: casas, maximumFractionDigits: casas },
    `decimal${casas}`,
  ).format(numero)
}

export function formatarPercentual(valor, casas = 2) {
  const texto = formatarDecimal(valor, casas)
  return texto === '—' ? texto : `${texto}%`
}

export function formatarDataHora(valor) {
  if (!valor) return '—'
  const data = valor instanceof Date ? valor : new Date(valor)
  return Number.isNaN(data.getTime()) ? '—' : formatadorDataHora().format(data)
}

export function formatarData(valor) {
  if (!valor) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split('-')
    return formatadorData().format(new Date(Date.UTC(ano, mes - 1, dia, 12)))
  }
  const data = valor instanceof Date ? valor : new Date(valor)
  return Number.isNaN(data.getTime()) ? '—' : formatadorData().format(data)
}

export function formatarHora(valor) {
  if (!valor) return '—'
  const data = valor instanceof Date ? valor : new Date(valor)
  return Number.isNaN(data.getTime()) ? '—' : formatadorHora().format(data)
}

export function formatarSha(valor, tamanho = 12) {
  if (!valor) return '—'
  const texto = String(valor)
  return texto.length > tamanho ? `${texto.slice(0, tamanho)}…` : texto
}

export function paraInputSaoPaulo(valor) {
  if (!valor) return ''
  const data = valor instanceof Date ? valor : new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  const partes = Object.fromEntries(
    formatadorPartes
      .formatToParts(data)
      .filter((parte) => parte.type !== 'literal')
      .map((parte) => [parte.type, parte.value]),
  )
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}`
}

function offsetSaoPaulo(data) {
  const nome = formatadorOffset
    .formatToParts(data)
    .find((parte) => parte.type === 'timeZoneName')?.value
  const encontrado = /GMT([+-]\d{2}:\d{2})/.exec(nome ?? '')
  return encontrado ? encontrado[1] : '-03:00'
}

export function deInputSaoPaulo(valor) {
  if (!valor || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null
  const aproximado = new Date(`${valor}:00Z`)
  if (Number.isNaN(aproximado.getTime())) return null
  const data = new Date(`${valor}:00${offsetSaoPaulo(aproximado)}`)
  return Number.isNaN(data.getTime()) ? null : data.toISOString()
}

export function formatarCorte(corte) {
  if (!corte) return t('corte.final')
  if (corte.tipo === 'recebimento_intradiario' && corte.as_of) {
    return t('corte.ate', { quando: formatarDataHora(corte.as_of) })
  }
  if (corte.tipo === 'recebimento_diario' && corte.as_of_date) {
    return t('corte.ate', { quando: formatarData(corte.as_of_date) })
  }
  return t('corte.final')
}

export function truncar(texto, tamanho = 60) {
  if (!texto) return '—'
  const valor = String(texto)
  return valor.length > tamanho ? `${valor.slice(0, tamanho)}…` : valor
}

export function formatarDuracao(ms) {
  if (ms === null || ms === undefined || ms === '') return '—'
  const total = Number(ms)
  if (!Number.isFinite(total)) return '—'
  const segundos = total / 1000
  if (segundos < 60) return `${formatarDecimal(Math.round(segundos * 10) / 10, 0 + (segundos % 1 ? 1 : 0))} s`
  const minutos = Math.floor(segundos / 60)
  return `${minutos} min ${Math.round(segundos - minutos * 60)} s`
}
