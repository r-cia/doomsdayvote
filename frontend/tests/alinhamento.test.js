import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(path.resolve('src/styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const EXCECOES_CENTRALIZADAS = new Set([
  '.tracado__vazio',
  '.mapa-status',
  '.mapa-ausente',
  '.vazio',
  '.estado',
  '.tabela-fixa td .button--compacto',
])

const regras = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap((m) =>
  m[1].split(',').map((seletor) => ({
    seletor: seletor.trim(),
    alinhamento: /text-align:\s*([a-z-]+)/.exec(m[2])?.[1] ?? null,
    distribuicao: /justify-items:\s*(end|right)/.test(m[2]),
  })),
)

describe('alinhamento', () => {
  it('número e texto alinham sempre à esquerda: nenhuma regra alinha à direita ou ao fim', () => {
    const fora = regras
      .filter((r) => r.alinhamento && r.alinhamento !== 'left' && !EXCECOES_CENTRALIZADAS.has(r.seletor))
      .map((r) => `${r.seletor}: text-align ${r.alinhamento}`)
    expect(fora).toEqual([])
    expect(regras.filter((r) => r.distribuicao).map((r) => r.seletor)).toEqual([])
  })

  it('.num alinha à esquerda', () => {
    expect(regras.find((r) => r.seletor === '.num')?.alinhamento).toBe('left')
  })

  it('as exceções centralizadas continuam existindo (lista não envelhece)', () => {
    const existentes = new Set(regras.filter((r) => r.alinhamento === 'center').map((r) => r.seletor))
    expect([...EXCECOES_CENTRALIZADAS].filter((s) => !existentes.has(s))).toEqual([])
  })
})
