import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const RAIZ = path.resolve(__dirname, '../src')

const PERMITIDOS = new Set(['BU', 'BUs', 'UF', 'SHA', 'SHA-256', 'PT-BR', 'EN-US', 'ES-ES', 'Doomsday', 'Vote', 'LOF', 'IF', 'MAD', 'TSE', 'Benford', 'IBGE', 'GeoJSON'])

const ATRIBUTOS_TEXTO = ['aria-label', 'title', 'placeholder', 'alt', 'titulo', 'descricao', 'acao']

function arquivosVue(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = path.join(dir, nome)
    if (statSync(caminho).isDirectory()) return arquivosVue(caminho)
    return caminho.endsWith('.vue') ? [caminho] : []
  })
}

function template(fonte) {
  const inicio = fonte.indexOf('<template>')
  const fim = fonte.lastIndexOf('</template>')
  return inicio === -1 || fim === -1 ? '' : fonte.slice(inicio + '<template>'.length, fim)
}

const IDENTIFICADOR = /^[a-z0-9_]+$/

function temTextoVisivel(texto) {
  if (IDENTIFICADOR.test(texto.trim())) return false
  const palavras = texto.match(/[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9-]*/g) ?? []
  return palavras.some((palavra) => palavra.length > 1 && !PERMITIDOS.has(palavra))
}

const TAG = /<\/?[a-zA-Z][^>"']*(?:"[^"]*"|'[^']*'|[^>"'])*>/g
const MUSTACHE = /\{\{[\s\S]*?\}\}/g
const SEM_CHAMADA_I18N = /\$?\bt\(\s*(['"`])[^'"`]*\1[^)]*\)/g

function achados(fonte) {
  const html = template(fonte)
  const problemas = []

  for (const tag of html.match(TAG) ?? []) {
    for (const atributo of ATRIBUTOS_TEXTO) {
      const estatico = new RegExp(`\\s${atributo}="([^"]*)"`).exec(tag)
      if (estatico && temTextoVisivel(estatico[1])) problemas.push(`${atributo}="${estatico[1]}"`)
      const dinamico = new RegExp(`\\s:${atributo}="([^"]*)"`).exec(tag)
      if (dinamico) {
        const restante = dinamico[1].replace(SEM_CHAMADA_I18N, '')
        for (const literal of restante.match(/(['"`])(?:(?!\1)[^\\])*\1/g) ?? []) {
          if (temTextoVisivel(literal.slice(1, -1).replace(/\$\{[^}]*\}/g, ''))) problemas.push(`:${atributo}=${literal}`)
        }
      }
    }
  }

  for (const mustache of html.match(MUSTACHE) ?? []) {
    const restante = mustache.replace(SEM_CHAMADA_I18N, '')
    for (const literal of restante.match(/(['"`])(?:(?!\1)[^\\])*\1/g) ?? []) {
      if (temTextoVisivel(literal.slice(1, -1).replace(/\$\{[^}]*\}/g, ''))) problemas.push(`{{ ${literal} }}`)
    }
  }

  const soTexto = html.replace(MUSTACHE, ' ').replace(TAG, '\n')
  for (const linha of soTexto.split('\n')) {
    const texto = linha.trim()
    if (texto && temTextoVisivel(texto)) problemas.push(texto)
  }
  return problemas
}

describe('textos fixos nos templates', () => {
  for (const arquivo of arquivosVue(RAIZ)) {
    it(path.relative(RAIZ, arquivo), () => {
      expect(achados(readFileSync(arquivo, 'utf8'))).toEqual([])
    })
  }
})
