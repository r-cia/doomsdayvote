import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import ptBR from '../src/i18n/locales/pt-BR.json'
import enUS from '../src/i18n/locales/en-US.json'
import esES from '../src/i18n/locales/es-ES.json'
import { definirIdioma, i18n } from '../src/i18n'
import { formatarNumero } from '../src/lib/format'

const achatar = (objeto, prefixo = '') =>
  Object.entries(objeto).flatMap(([chave, valor]) =>
    typeof valor === 'object' ? achatar(valor, `${prefixo}${chave}.`) : [[`${prefixo}${chave}`, valor]],
  )

const mapa = (locale) => new Map(achatar(locale))
const placeholders = (texto) => [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

function arquivos(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome)
    if (statSync(caminho).isDirectory()) return nome === 'locales' ? [] : arquivos(caminho)
    return /\.(vue|js)$/.test(nome) ? [caminho] : []
  })
}

const codigo = arquivos('src').map((caminho) => readFileSync(caminho, 'utf8')).join('\n')
const usos = [...codigo.matchAll(/(?:\$t|\bt|\$te|\bte)\(\s*(['`])([A-Za-z0-9_.${}\-' ]+?)\1/g)].map((m) => m[2])
const textos = [...codigo.matchAll(/(['`])([A-Za-z][A-Za-z0-9_.${}?\-]*\.[A-Za-z0-9_.${}?\-]+)\1/g)].map((m) => m[2])
const todos = [...usos, ...textos]
const literais = usos.filter((chave) => !chave.includes('${'))
const dinamicas = todos
  .filter((chave) => chave.includes('${'))
  .map((chave) => new RegExp(`^${chave.replace(/\./g, '\\.').replace(/\$\{[^}]*\}/g, '[^.]+')}$`))

describe('i18n', () => {
  const pt = mapa(ptBR)

  it('os três idiomas têm exatamente as mesmas chaves e os mesmos placeholders', () => {
    for (const locale of [enUS, esES]) {
      const outro = mapa(locale)
      expect([...outro.keys()].sort()).toEqual([...pt.keys()].sort())
      for (const [chave, texto] of pt) expect(placeholders(outro.get(chave)), chave).toEqual(placeholders(texto))
    }
  })

  it('nenhuma chave usada no código falta', () => {
    const faltando = literais.filter((chave) => !pt.has(chave))
    expect(faltando).toEqual([])
  })

  it('nenhuma chave existe sem uso', () => {
    const semUso = [...pt.keys()].filter(
      (chave) => !todos.includes(chave) && !dinamicas.some((padrao) => padrao.test(chave)),
    )
    expect(semUso).toEqual([])
  })

  it('trocar o idioma atualiza lang, título e formatação', () => {
    definirIdioma('en-US')
    expect(document.documentElement.lang).toBe('en-US')
    expect(document.title).toBe(enUS.app.titulo)
    expect(formatarNumero(1234.5)).toBe('1,234.5')
    definirIdioma('es-ES')
    expect(document.documentElement.lang).toBe('es-ES')
    definirIdioma('pt-BR')
    expect(formatarNumero(1234.5)).toBe('1.234,5')
    expect(i18n.global.locale.value).toBe('pt-BR')
  })
})
