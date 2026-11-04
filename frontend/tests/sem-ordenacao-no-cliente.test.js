import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const arquivos = ['src/components', 'src/views'].flatMap((pasta) =>
  readdirSync(pasta)
    .filter((nome) => nome.endsWith('.vue'))
    .map((nome) => join(pasta, nome)),
)

describe('ordenação de tabelas', () => {
  it('o cliente não reordena linhas: nenhuma ordenação local por coluna nos componentes e telas', () => {
    for (const caminho of arquivos) {
      const fonte = readFileSync(caminho, 'utf8')
      expect(fonte, caminho).not.toMatch(/function alternar\(/)
      expect(fonte, caminho).not.toMatch(/localeCompare\(vb\)/)
    }
  })

  it('só o cabeçalho ThOrdenavel dispara ordenação, com aria-sort', () => {
    const fonte = readFileSync('src/components/ThOrdenavel.vue', 'utf8')
    expect(fonte).toContain(':aria-sort="ariaSort"')
  })
})
