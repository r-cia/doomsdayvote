export const COR_NEUTRA = '#7e9275'
export const COR_SEM_DADOS = '#243020'

const PALETA_PARTIDOS = Object.freeze({
  PT: '#C1121F',
  PL: '#1D4ED8',
  UNIAO: '#0E7490',
  PSDB: '#1E40AF',
  MDB: '#15803D',
  PP: '#7C3AED',
  PSB: '#A16207',
  PDT: '#B45309',
  PSOL: '#A21CAF',
  NOVO: '#EA580C',
  REDE: '#047857',
  PCDOB: '#9F1239',
  PV: '#166534',
  REPUBLICANOS: '#4338CA',
  PODE: '#6D28D9',
  AVANTE: '#C2410C',
  SOLIDARIEDADE: '#0F766E',
  CIDADANIA: '#BE123C',
  PSD: '#0369A1',
  DEM: '#1E3A8A',
  PSC: '#3730A3',
  PROS: '#B91C1C',
  PCB: '#991B1B',
  PSTU: '#7F1D1D',
  PCO: '#6B21A8',
  UP: '#9D174D',
  DC: '#0F766E',
  PMB: '#475569',
  PRTB: '#57534E',
  PTC: '#78716C',
  AGIR: '#0E7490',
  MOBILIZA: '#0369A1',
  MISSAO: '#166534',
  PRD: '#14532D',
})

const SUCESSORES = Object.freeze({
  PMDB: 'MDB',
  PR: 'PL',
  PRB: 'REPUBLICANOS',
  PPS: 'CIDADANIA',
  SD: 'SOLIDARIEDADE',
  PSDC: 'DC',
  PTN: 'PODE',
  PHS: 'PODE',
  PTDOB: 'AVANTE',
  PSL: 'UNIAO',
  PPL: 'PCDOB',
  PTB: 'PRD',
  PATRIOTA: 'PRD',
  PATRI: 'PRD',
  PEN: 'PRD',
  PRP: 'PRD',
})

function normalizarSigla(sigla) {
  return String(sigla ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function clarear(hex, fator = 0.26) {
  const valor = hex.replace('#', '')
  const canais = [0, 2, 4].map((inicio) => {
    const canal = parseInt(valor.slice(inicio, inicio + 2), 16)
    return Math.round(canal + (255 - canal) * fator)
  })
  return `#${canais.map((canal) => canal.toString(16).padStart(2, '0')).join('')}`
}

function siglaEfetiva(sigla) {
  const normalizada = normalizarSigla(sigla)
  return SUCESSORES[normalizada] ?? normalizada
}

export function corPartido(sigla) {
  const cor = PALETA_PARTIDOS[siglaEfetiva(sigla)]
  return cor ? clarear(cor) : COR_NEUTRA
}

export function siglaTemCor(sigla) {
  return siglaEfetiva(sigla) in PALETA_PARTIDOS
}

function misturar(origem, destino, fator) {
  const canais = [0, 2, 4].map((inicio) => {
    const a = parseInt(origem.slice(1 + inicio, 3 + inicio), 16)
    const b = parseInt(destino.slice(1 + inicio, 3 + inicio), 16)
    return Math.round(a + (b - a) * fator)
  })
  return `#${canais.map((canal) => canal.toString(16).padStart(2, '0')).join('')}`
}

const ROTULOS_FAIXAS = Object.freeze(
  Array.from({ length: 10 }, (_, i) => `${i * 10}–${(i + 1) * 10}%`),
)

// Gradiente do fundo "sem dados" até a cor do partido; a faixa mais baixa já
// recebe 30% da cor do partido para não se confundir com área sem dados.
export function faixasPercentual(sigla) {
  const base = corPartido(sigla)
  return ROTULOS_FAIXAS.map((rotulo, i) => ({
    min: i * 10,
    max: (i + 1) * 10,
    rotulo,
    cor: misturar(COR_SEM_DADOS, base, 0.3 + 0.7 * (i / 9)),
  }))
}

export function faixaPercentual(valor, sigla) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return null
  const limitado = Math.min(100, Math.max(0, numero))
  return faixasPercentual(sigla)[Math.min(9, Math.floor(limitado / 10))]
}

export function corPercentual(valor, sigla) {
  return faixaPercentual(valor, sigla)?.cor ?? COR_NEUTRA
}

function luminanciaRelativa(hex) {
  const valor = hex.replace('#', '')
  const canais = [0, 2, 4].map((inicio) => {
    const canal = parseInt(valor.slice(inicio, inicio + 2), 16) / 255
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2]
}

export function corTextoContraste(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return '#10150f'
  return luminanciaRelativa(hex) > 0.42 ? '#10150f' : '#FFFFFF'
}

export function corDoLider(area, partidoPorNumero) {
  if (!area?.lider) return COR_NEUTRA
  const partido = partidoPorNumero?.get?.(area.lider.nr_votavel)
  return corPartido(partido?.sg_partido)
}

export function corDaArea(area, modo, candidato, partidoPorNumero) {
  if (!area) return COR_SEM_DADOS
  if (modo === 'percentual') {
    const numero = candidato ?? area.lider?.nr_votavel
    const percentual = candidato
      ? area.candidatos?.find((item) => item.nr_votavel === candidato)?.percentual
      : area.lider?.percentual
    return corPercentual(percentual, partidoPorNumero?.get?.(numero)?.sg_partido)
  }
  return corDoLider(area, partidoPorNumero)
}
