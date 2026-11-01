import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const RAIZ = path.resolve(__dirname, '../src')

const ESTRUTURAIS = ['ul', 'ol', 'dl', 'li', 'dt', 'dd', 'div', 'section', 'article', 'figure', 'nav', 'header', 'footer']
const LISTAS = ['ul', 'ol', 'dl']

// Raízes de bloco (BEM) cujos estilos ficam nos elementos filhos (`.bloco__elemento`) ou em outras classes do mesmo elemento.
const PERMITIDAS = new Set(['biometria', 'grupo', 'tabela-mapa', 'secoes'])

// Listas sem classe só são aceitas quando um seletor de descendente do CSS as estiliza (por exemplo `.pai ul`).
const LISTAS_SEM_CLASSE_PERMITIDAS = new Set([])

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

const arquivos = arquivosVue(RAIZ)
const css = [
  readFileSync(path.join(RAIZ, 'styles.css'), 'utf8'),
  ...arquivos.map((arquivo) => [...readFileSync(arquivo, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')),
].join('\n')

const classesDefinidas = new Set([...css.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1]))
const seletores = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)].map((m) => m[1])

function listaEstilizadaPorDescendente(tag) {
  return seletores.some((seletor) =>
    seletor.split(',').some((parte) => new RegExp(`[\\w\\]\\)-]\\s*(?:>\\s*|\\s)${tag}(?![\\w-])`).test(parte.trim())),
  )
}

function elementos(fonte) {
  const html = template(fonte)
  return [...html.matchAll(/<([a-z][a-z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g)].map((m) => ({ tag: m[1], atributos: m[2] }))
}

describe('toda classe de elemento estrutural tem regra de CSS', () => {
  for (const arquivo of arquivos) {
    it(path.relative(RAIZ, arquivo), () => {
      const problemas = []
      for (const { tag, atributos } of elementos(readFileSync(arquivo, 'utf8'))) {
        if (!ESTRUTURAIS.includes(tag)) continue
        const estatica = / class="([^"]*)"/.exec(atributos)
        const tokens = (estatica?.[1] ?? '').split(/\s+/).filter(Boolean)
        for (const token of tokens) {
          if (!classesDefinidas.has(token) && !PERMITIDAS.has(token)) problemas.push(`<${tag} class="${token}"> sem regra de CSS`)
        }
        if (LISTAS.includes(tag) && tokens.length === 0 && !/ :?class=/.test(atributos)) {
          const chave = `${path.relative(RAIZ, arquivo)}:${tag}`
          if (!listaEstilizadaPorDescendente(tag) && !LISTAS_SEM_CLASSE_PERMITIDAS.has(chave)) {
            problemas.push(`<${tag}> sem classe e sem seletor de descendente no CSS`)
          }
        }
      }
      expect([...new Set(problemas)]).toEqual([])
    })
  }
})

describe('nada de JSON na tela', () => {
  for (const arquivo of arquivos) {
    it(path.relative(RAIZ, arquivo), () => {
      expect(template(readFileSync(arquivo, 'utf8'))).not.toMatch(/JSON\.stringify/)
    })
  }
})
