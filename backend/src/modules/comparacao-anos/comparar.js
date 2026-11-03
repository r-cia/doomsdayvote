import { correlacao } from './estatistica.js';
import { candidatosDoTurno, eleicoesPresidente, montarPontos, votosPorIntervalo } from './curvas.js';

async function turnoDoAno(db, eleicao, uf) {
  if (!eleicao.dt_pleito) return null;
  const candidatos = await candidatosDoTurno(db, eleicao.id);
  if (candidatos.length === 0) return null;
  const linhas = await votosPorIntervalo(db, { eleicao, candidatos, uf });
  if (linhas.length === 0) return null;
  return { turno: eleicao.nr_turno, candidatos, pontos: montarPontos(linhas, candidatos.length) };
}

function formatarTurno({ turno, candidatos, pontos }, vencedor) {
  return {
    turno,
    candidatos: candidatos.map((candidato, indice) => ({
      posicao: indice + 1,
      nr_votavel: candidato.nr_votavel,
      nm_votavel: candidato.nm_votavel,
      sg_partido: candidato.sg_partido,
      votos: candidato.qt_votos,
      vencedor: candidato.nr_votavel === vencedor,
    })),
    pontos,
  };
}

function alinhar(pontosA, pontosB, posicao, campo) {
  const porMinuto = new Map(pontosB.map((ponto) => [ponto.minuto, ponto.candidatos[posicao][campo]]));
  const xs = [];
  const ys = [];
  for (const ponto of pontosA) {
    const valor = porMinuto.get(ponto.minuto);
    const proprio = ponto.candidatos[posicao][campo];
    if (valor === undefined || valor === null || proprio === null) continue;
    xs.push(proprio);
    ys.push(valor);
  }
  return correlacao(xs, ys);
}

function paresDeAnos(anos) {
  const pares = [];
  for (let i = 0; i < anos.length; i += 1) {
    for (let j = i + 1; j < anos.length; j += 1) pares.push([anos[i], anos[j]]);
  }
  return pares;
}

export async function compararAnos(db, { anos, uf }) {
  const ordenados = [...anos].sort((a, b) => a - b);
  const eleicoes = await eleicoesPresidente(db, ordenados);

  const porAno = new Map();
  const avisos = [];
  for (const ano of ordenados) {
    const doAno = eleicoes.filter((eleicao) => eleicao.ano_eleicao === ano);
    if (doAno.length === 0) continue;
    const turnos = [];
    for (const eleicao of doAno) {
      const turno = await turnoDoAno(db, eleicao, uf);
      if (turno) turnos.push(turno);
    }
    if (turnos.length === 0) {
      avisos.push({ ano, codigo: 'SEM_HORARIO' });
      continue;
    }
    porAno.set(ano, turnos);
  }

  const resultadoAnos = [];
  for (const [ano, turnos] of porAno) {
    const decisivo = turnos.reduce((a, b) => (b.turno > a.turno ? b : a));
    const vencedor = decisivo.candidatos[0].nr_votavel;
    resultadoAnos.push({ ano, turnos: turnos.map((turno) => formatarTurno(turno, vencedor)) });
  }

  const pares = [];
  for (const [anoA, anoB] of paresDeAnos([...porAno.keys()])) {
    for (const turnoA of porAno.get(anoA)) {
      const turnoB = porAno.get(anoB).find((turno) => turno.turno === turnoA.turno);
      if (!turnoB) continue;
      const posicoes = Math.min(turnoA.candidatos.length, turnoB.candidatos.length);
      for (let posicao = 0; posicao < posicoes; posicao += 1) {
        pares.push({
          ano_a: anoA,
          ano_b: anoB,
          turno: turnoA.turno,
          posicao: posicao + 1,
          votos_intervalo: alinhar(turnoA.pontos, turnoB.pontos, posicao, 'votos'),
          pct_acumulada: alinhar(turnoA.pontos, turnoB.pontos, posicao, 'pct_acumulada'),
        });
      }
    }
  }

  return { anos: resultadoAnos, pares, avisos };
}
