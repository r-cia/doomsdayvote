import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AvisoBanner from '../src/components/AvisoBanner.vue'
import i18n from '../src/i18n'
import { ApiError, api } from '../src/api/client'
import { mensagemErroApi } from '../src/lib/erros-api'
import { avisoMensagem } from '../src/lib/status'

const BACKEND = path.resolve(__dirname, '../../backend/src')
const NAO_EXIBIDOS = new Set(['ENCODING_SUSPEITO', 'VERSAO_BU_CONFLITANTE', 'METADADO_DERIVADO_DIVERGENTE', 'LARGURA_INVALIDA', 'TIPO_INVALIDO', 'FORMATO_DATA_INVALIDO', 'FORMATO_HORA_INVALIDO', 'ERRO_INTERNO'])

function arquivos(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = path.join(dir, nome)
    if (statSync(caminho).isDirectory()) return nome === 'migrations' ? [] : arquivos(caminho)
    return caminho.endsWith('.js') ? [caminho] : []
  })
}

function codigosDoBackend() {
  const avisos = new Set()
  const erros = new Set()
  for (const arquivo of arquivos(BACKEND)) {
    const fonte = readFileSync(arquivo, 'utf8')
    for (const [, codigo] of fonte.matchAll(/codigo:\s*'([A-Z_]+)'/g)) avisos.add(codigo)
    for (const [, codigo] of fonte.matchAll(/new AppError\(\s*'([A-Z_]+)'/g)) erros.add(codigo)
    for (const [, codigo] of fonte.matchAll(/code:\s*'([A-Z_]+)'/g)) erros.add(codigo)
  }
  return { avisos, erros }
}

afterEach(() => {
  i18n.global.locale.value = 'pt-BR'
  vi.unstubAllGlobals()
})

describe('textos da API traduzidos pelo código', () => {
  it.skipIf(!existsSync(BACKEND))('todo código de aviso exibido e todo código de erro do backend tem chave de i18n', () => {
    const { avisos, erros } = codigosDoBackend()
    const exibidos = [...avisos].filter((codigo) => !NAO_EXIBIDOS.has(codigo))
    expect(exibidos.length).toBeGreaterThan(0)
    for (const codigo of exibidos) expect(i18n.global.te(`avisos.mensagem.${codigo}`), codigo).toBe(true)
    for (const codigo of erros) {
      const coberto = i18n.global.te(`erros.codigo.${codigo}`) || codigo === 'NOT_FOUND'
      expect(coberto, codigo).toBe(true)
    }
  })

  it('traduz o aviso pelo código no idioma ativo, com a quantidade', () => {
    const aviso = { codigo: 'PRECISAO_INSUFICIENTE', quantidade: 12, mensagem: 'texto do servidor' }
    expect(avisoMensagem(aviso)).toContain('12 BUs')
    i18n.global.locale.value = 'en-US'
    expect(avisoMensagem(aviso)).toBe(
      '12 BUs in this selection do not have a receipt time at the requested precision and are not included in this cutoff',
    )
    i18n.global.locale.value = 'es-ES'
    expect(avisoMensagem({ codigo: 'METADADOS_DERIVADOS', mensagem: 'x' })).toBe('Año y vuelta derivados del nombre del archivo')
  })

  it('usa a mensagem da API só quando o código é desconhecido', () => {
    expect(avisoMensagem({ codigo: 'CODIGO_NOVO', mensagem: 'texto do servidor' })).toBe('texto do servidor')
  })

  it('o banner traduz o aviso quando o idioma muda', async () => {
    const wrapper = mount(AvisoBanner, {
      props: { avisos: [{ codigo: 'METADADOS_DERIVADOS', mensagem: 'Ano e turno derivados do nome do arquivo' }] },
    })
    expect(wrapper.text()).toContain('Metadados derivados')
    i18n.global.locale.value = 'en-US'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Derived metadata')
    expect(wrapper.text()).toContain('Year and round derived from the file name')
  })

  it('traduz erros da API pelo código e cai na mensagem para códigos desconhecidos', () => {
    expect(mensagemErroApi({ codigo: 'VALIDATION', mensagem: 'Parâmetro inválido' }, 400)).toBe('Parâmetro inválido')
    expect(mensagemErroApi({ codigo: 'NOT_FOUND', mensagem: 'Seção não encontrada' }, 404)).toBe('Seção não encontrada')
    expect(mensagemErroApi({ codigo: 'OUTRO', mensagem: 'texto do servidor' }, 418)).toBe('texto do servidor')
    expect(mensagemErroApi({}, 502)).toBe('Falha ao consultar a API (502)')
    i18n.global.locale.value = 'en-US'
    expect(mensagemErroApi({ codigo: 'NOT_FOUND', mensagem: 'Seção não encontrada' }, 404)).toBe('Section not found')
    expect(mensagemErroApi({ codigo: 'INTERNAL', mensagem: 'Erro interno' }, 500)).toBe('Internal error')
    expect(mensagemErroApi({}, 502)).toBe('Failed to query the API (502)')
  })

  it('o cliente lança ApiError traduzido a partir do corpo { error: { code, message } }', async () => {
    i18n.global.locale.value = 'es-ES'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: { code: 'NOT_FOUND', message: 'Eleição não encontrada' } }),
      }),
    )
    const erro = await api.eleicoes().catch((e) => e)
    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.codigo).toBe('NOT_FOUND')
    expect(erro.message).toBe('Elección no encontrada')
  })
})
