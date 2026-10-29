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

export function corPartido(sigla) {
  const cor = PALETA_PARTIDOS[normalizarSigla(sigla)]
  return cor ? clarear(cor) : COR_NEUTRA
}

export function siglaTemCor(sigla) {
  return normalizarSigla(sigla) in PALETA_PARTIDOS
}

export const FAIXAS_PERCENTUAL = Object.freeze([
  { min: 0, max: 10, rotulo: '0–10%', cor: '#4a3a16' },
  { min: 10, max: 20, rotulo: '10–20%', cor: '#5d4a17' },
  { min: 20, max: 30, rotulo: '20–30%', cor: '#725a19' },
  { min: 30, max: 40, rotulo: '30–40%', cor: '#886b1c' },
  { min: 40, max: 50, rotulo: '40–50%', cor: '#9e7d1f' },
  { min: 50, max: 60, rotulo: '50–60%', cor: '#b58f23' },
  { min: 60, max: 70, rotulo: '60–70%', cor: '#cca228' },
  { min: 70, max: 80, rotulo: '70–80%', cor: '#e0b52e' },
  { min: 80, max: 90, rotulo: '80–90%', cor: '#f2c637' },
  { min: 90, max: 100, rotulo: '90–100%', cor: '#ffd45e' },
])

export function faixaPercentual(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return null
  const limitado = Math.min(100, Math.max(0, numero))
  const indice = Math.min(9, Math.floor(limitado / 10))
  return FAIXAS_PERCENTUAL[indice]
}

export function corPercentual(valor) {
  return faixaPercentual(valor)?.cor ?? COR_NEUTRA
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
    const percentual = candidato
      ? area.candidatos?.find((item) => item.nr_votavel === candidato)?.percentual
      : area.lider?.percentual
    return corPercentual(percentual)
  }
  return corDoLider(area, partidoPorNumero)
}
