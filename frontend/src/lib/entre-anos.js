export const MINUTO_INICIAL = 840
export const MINUTO_FINAL = 1620

const PALETA_CANDIDATOS = ['#ffb52e', '#5fb0ff', '#74e08c', '#ff6b57', '#c58cff', '#4fd1c5', '#f687b3', '#d6c44a']
const PALETA_DIFERENCAS = ['#ffb52e', '#5fb0ff', '#74e08c', '#ff6b57', '#c58cff', '#4fd1c5']
const TRACOS = ['', '6 3', '2 3', '8 3 2 3', '1 3']

const LARGURA_CARACTERE = 6
const FOLGA_ROTULO = 14

export function rotuloMinuto(minuto) {
  const dia = ((minuto % 1440) + 1440) % 1440
  const h = String(Math.floor(dia / 60)).padStart(2, '0')
  const m = String(dia % 60).padStart(2, '0')
  return `${h}:${m}`
}

export function margemEsquerda(rotulos) {
  const largura = Math.max(0, ...rotulos.map((rotulo) => String(rotulo).length))
  return largura * LARGURA_CARACTERE + FOLGA_ROTULO
}

export function coresPorCandidato(resposta) {
  const nomes = new Set()
  for (const ano of resposta?.anos ?? []) {
    for (const turno of ano.turnos) for (const c of turno.candidatos) nomes.add(c.nm_votavel)
  }
  return new Map([...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((nome, i) => [nome, PALETA_CANDIDATOS[i % PALETA_CANDIDATOS.length]]))
}

export function tracoDoAno(resposta, ano) {
  const indice = (resposta?.anos ?? []).findIndex((item) => item.ano === ano)
  return TRACOS[Math.max(0, indice) % TRACOS.length]
}

function turnoDe(resposta, ano, turno) {
  return resposta.anos.find((item) => item.ano === ano)?.turnos.find((item) => item.turno === turno) ?? null
}

export function turnosDisponiveis(resposta) {
  return [...new Set((resposta?.anos ?? []).flatMap((ano) => ano.turnos.map((turno) => turno.turno)))].sort()
}

export function seriesDoTurno(resposta, turno, campo) {
  const cores = coresPorCandidato(resposta)
  const series = []
  for (const { ano } of resposta?.anos ?? []) {
    const dados = turnoDe(resposta, ano, turno)
    if (!dados) continue
    dados.candidatos.forEach((candidato, posicao) => {
      series.push({
        id: `${ano}-${posicao}`,
        rotulo: `${ano} · ${candidato.nm_votavel}`,
        cor: cores.get(candidato.nm_votavel),
        traco: tracoDoAno(resposta, ano),
        pontos: dados.pontos.map((ponto) => ({ x: ponto.minuto, y: ponto.candidatos[posicao]?.[campo] ?? null })),
      })
    })
  }
  return series
}

export function diferencasDoTurno(resposta, turno, campo) {
  const series = []
  for (const par of resposta?.pares ?? []) {
    if (par.turno !== turno) continue
    const a = turnoDe(resposta, par.ano_a, turno)
    const b = turnoDe(resposta, par.ano_b, turno)
    if (!a || !b) continue
    const porMinuto = new Map(b.pontos.map((ponto) => [ponto.minuto, ponto.candidatos[par.posicao - 1]?.[campo]]))
    const pontos = []
    for (const ponto of a.pontos) {
      const outro = porMinuto.get(ponto.minuto)
      const proprio = ponto.candidatos[par.posicao - 1]?.[campo]
      if (outro === undefined || outro === null || proprio === undefined || proprio === null) continue
      pontos.push({ x: ponto.minuto, y: proprio - outro })
    }
    series.push({
      id: `${par.ano_a}-${par.ano_b}-${par.posicao}`,
      rotulo: `${par.ano_a} − ${par.ano_b} · posição ${par.posicao}`,
      cor: PALETA_DIFERENCAS[series.length % PALETA_DIFERENCAS.length],
      traco: '',
      pontos,
    })
  }
  return series
}

export function linhasCorrelacao(resposta, turno) {
  return (resposta?.pares ?? [])
    .filter((par) => par.turno === turno)
    .map((par) => ({
      anos: `${par.ano_a} × ${par.ano_b}`,
      turno: par.turno,
      candidato: turnoDe(resposta, par.ano_a, turno)?.candidatos[par.posicao - 1]?.nm_votavel ?? '—',
      votos: par.votos_intervalo,
      pct: par.pct_acumulada,
    }))
}
