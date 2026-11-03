import { describe, expect, it, vi } from 'vitest'
import { api } from '../src/api/client'
import { formatarDuracao } from '../src/lib/format'
import TempoVotoPanel from '../src/components/TempoVotoPanel.vue'
import BiometriaFaixasPanel from '../src/components/BiometriaFaixasPanel.vue'
import { montar } from './helpers'

vi.mock('../src/api/client', () => ({
  api: new Proxy({}, { get: (alvo, nome) => (alvo[nome] ??= vi.fn().mockResolvedValue({})) }),
}))

const metricas = {
  tempo: { quantidade: 120, mediaMs: 45000, medianaMs: 40000, maisRapidoMs: 5000, maisDemoradoMs: 125000 },
  biometria: { falhou1: 3, falhou2: 2, falhou3: 1, falhou4: 4, manual: 7 },
  complementares: { secoes: 10 },
}

describe('formatarDuracao', () => {
  it('formata segundos, minutos e nulo', () => {
    expect(formatarDuracao(45000)).toBe('45 s')
    expect(formatarDuracao(125000)).toBe('2 min 5 s')
    expect(formatarDuracao(null)).toBe('—')
  })
})

describe('painéis da totalização', () => {
  it('tempo de voto mostra os quatro tempos e a quantidade', async () => {
    api.totalizacaoMetricas.mockResolvedValue(metricas)
    const texto = (await montar(TempoVotoPanel)).text()
    expect(texto).toContain('45 s')
    expect(texto).toContain('40 s')
    expect(texto).toContain('5 s')
    expect(texto).toContain('2 min 5 s')
    expect(texto).toContain('120')
  })

  it('biometria mostra as cinco faixas', async () => {
    api.totalizacaoMetricas.mockResolvedValue(metricas)
    const texto = (await montar(BiometriaFaixasPanel)).text()
    for (const rotulo of ['Falhou 1 tentativa', 'Falhou 2 tentativas', 'Falhou 3 tentativas', 'Falhou 4 ou mais tentativas', 'Habilitação manual']) {
      expect(texto).toContain(rotulo)
    }
  })

  it('recorte sem dados mostra estado vazio', async () => {
    api.totalizacaoMetricas.mockResolvedValue({ ...metricas, complementares: { secoes: 0 } })
    expect((await montar(TempoVotoPanel)).text()).toContain('Sem dados da totalização')
  })

  it('erro mostra nova tentativa', async () => {
    api.totalizacaoMetricas.mockRejectedValue(new Error('falhou'))
    expect((await montar(BiometriaFaixasPanel)).text()).toContain('Tentar novamente')
  })
})
