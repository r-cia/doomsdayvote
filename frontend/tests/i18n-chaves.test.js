import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import enUS from '../src/i18n/locales/en-US.json'
import esES from '../src/i18n/locales/es-ES.json'
import ptBR from '../src/i18n/locales/pt-BR.json'

const RAIZ = path.resolve(__dirname, '../src')
const LOCALES = { 'pt-BR': ptBR, 'en-US': enUS, 'es-ES': esES }

function achatar(objeto, prefixo = '') {
  return Object.entries(objeto).flatMap(([chave, valor]) =>
    valor && typeof valor === 'object' ? achatar(valor, `${prefixo}${chave}.`) : [[`${prefixo}${chave}`, valor]],
  )
}

function arquivosFonte(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = path.join(dir, nome)
    if (statSync(caminho).isDirectory()) return nome === 'locales' ? [] : arquivosFonte(caminho)
    return /\.(vue|js)$/.test(caminho) ? [caminho] : []
  })
}

const GRUPOS = new Set(Object.keys(ptBR))
const CHAMADA = /\b(?:t|te|\$t)\(\s*['"`]([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)+)['"`]/g
const LITERAL = /['"`]([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)+)['"`]/g
const DINAMICA = /`([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)*\.)\$\{/g

const usadas = new Set()
const prefixos = new Set()
for (const arquivo of arquivosFonte(RAIZ)) {
  const fonte = readFileSync(arquivo, 'utf8')
  const padrao = arquivo.endsWith('.js') ? LITERAL : CHAMADA
  for (const [, chave] of fonte.matchAll(padrao)) {
    if (GRUPOS.has(chave.split('.')[0])) usadas.add(chave)
  }
  for (const [, chave] of fonte.matchAll(CHAMADA)) {
    if (GRUPOS.has(chave.split('.')[0])) usadas.add(chave)
  }
  for (const [, prefixo] of fonte.matchAll(DINAMICA)) {
    if (GRUPOS.has(prefixo.split('.')[0])) prefixos.add(prefixo)
  }
}

const chavesPt = achatar(ptBR).map(([chave]) => chave)

function placeholders(texto) {
  return [...String(texto).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
}

describe('chaves de i18n', () => {
  it('os três idiomas têm exatamente o mesmo conjunto de chaves', () => {
    for (const [nome, mensagens] of Object.entries(LOCALES)) {
      expect(achatar(mensagens).map(([chave]) => chave).sort(), nome).toEqual([...chavesPt].sort())
    }
  })

  it('placeholders e formas de plural coincidem entre os idiomas', () => {
    const pt = new Map(achatar(ptBR))
    for (const [nome, mensagens] of Object.entries(LOCALES)) {
      for (const [chave, valor] of achatar(mensagens)) {
        expect(placeholders(valor), `${nome} ${chave}`).toEqual(placeholders(pt.get(chave)))
        expect(String(valor).split('|').length, `${nome} ${chave}`).toBe(String(pt.get(chave)).split('|').length)
      }
    }
  })

  it('nenhum texto é vazio', () => {
    for (const [nome, mensagens] of Object.entries(LOCALES)) {
      for (const [chave, valor] of achatar(mensagens)) {
        expect(String(valor).trim(), `${nome} ${chave}`).not.toBe('')
      }
    }
  })

  it('toda chave usada no código existe', () => {
    const existentes = new Set(chavesPt)
    expect([...usadas].filter((chave) => !existentes.has(chave)).sort()).toEqual([])
  })

  it('toda chave existente é usada no código', () => {
    const naoUsadas = chavesPt.filter(
      (chave) => !usadas.has(chave) && ![...prefixos].some((prefixo) => chave.startsWith(prefixo)),
    )
    expect(naoUsadas).toEqual([])
  })
})
