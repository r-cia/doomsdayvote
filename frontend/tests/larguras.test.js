import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const pasta = 'src/components'
const arquivos = readdirSync(pasta).filter((nome) => nome.endsWith('.vue'))

describe('larguras fixas das tabelas', () => {
  it('cada colgroup em porcentagem soma 100', () => {
    let total = 0
    for (const nome of arquivos) {
      const fonte = readFileSync(join(pasta, nome), 'utf8')
      for (const grupo of fonte.matchAll(/<colgroup[^>]*>([\s\S]*?)<\/colgroup>/g)) {
        const larguras = [...grupo[1].matchAll(/width: ([\d.]+)%/g)].map((m) => Number(m[1]))
        if (larguras.length === 0) continue
        total += 1
        expect(larguras.reduce((a, b) => a + b, 0), nome).toBe(100)
      }
    }
    expect(total).toBe(10)
  })

  it('toda tabela com colgroup usa a classe de largura fixa', () => {
    for (const nome of arquivos) {
      const fonte = readFileSync(join(pasta, nome), 'utf8')
      const comGrupo = (fonte.match(/<colgroup/g) ?? []).length
      const fixas = (fonte.match(/<table[^>]*tabela-fixa/g) ?? []).length
      expect(fixas, nome).toBeGreaterThanOrEqual(comGrupo > 0 ? 1 : 0)
    }
  })
})
