import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const RAIZ = path.resolve('src')

const CLASSES_MORTAS = ['tabela__numero']

function arquivosVue(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = path.join(dir, nome)
    if (statSync(caminho).isDirectory()) return arquivosVue(caminho)
    return caminho.endsWith('.vue') ? [caminho] : []
  })
}

const arquivos = arquivosVue(RAIZ)

describe('classes mortas não voltam', () => {
  it.each(CLASSES_MORTAS)('%s não é usada em nenhum componente', (classe) => {
    const usos = arquivos
      .filter((arquivo) => readFileSync(arquivo, 'utf8').includes(classe))
      .map((arquivo) => path.relative(RAIZ, arquivo))
    expect(usos).toEqual([])
  })
})
