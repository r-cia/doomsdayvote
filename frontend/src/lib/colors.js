export const COR_NEUTRA = '#94A3B8'
export const COR_SEM_DADOS = '#E2E8F0'

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

export function corPartido(sigla) {
  return PALETA_PARTIDOS[normalizarSigla(sigla)] ?? COR_NEUTRA
}

export function siglaTemCor(sigla) {
  return normalizarSigla(sigla) in PALETA_PARTIDOS
}

export const FAIXAS_PERCENTUAL = Object.freeze([
  { min: 0, max: 10, rotulo: '0–10%', cor: '#EFF6FF' },
  { min: 10, max: 20, rotulo: '10–20%', cor: '#DBEAFE' },
  { min: 20, max: 30, rotulo: '20–30%', cor: '#BFDBFE' },
  { min: 30, max: 40, rotulo: '30–40%', cor: '#93C5FD' },
  { min: 40, max: 50, rotulo: '40–50%', cor: '#60A5FA' },
  { min: 50, max: 60, rotulo: '50–60%', cor: '#3B82F6' },
  { min: 60, max: 70, rotulo: '60–70%', cor: '#2563EB' },
  { min: 70, max: 80, rotulo: '70–80%', cor: '#1D4ED8' },
  { min: 80, max: 90, rotulo: '80–90%', cor: '#1E40AF' },
  { min: 90, max: 100, rotulo: '90–100%', cor: '#1E3A8A' },
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
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return '#0F172A'
  return luminanciaRelativa(hex) > 0.42 ? '#0F172A' : '#FFFFFF'
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
