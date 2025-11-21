import { supabase } from './supabase'
import { geocodificarCEP, calcularDistancia } from './geocoding'

export interface FreightBand {
  id: string
  store_id: string
  radius_km: number
  delivery_price: number
  name?: string
}

export interface FreightCalculation {
  valor: number | null
  emArea: boolean
  distancia: number | null
  faixa?: FreightBand
  erro?: string
}

/**
 * Calcula o frete baseado na distância entre o estabelecimento e o CEP de destino
 */
export async function calcularFrete(
  estabelecimentoId: string,
  cepDestino: string
): Promise<FreightCalculation> {
  try {
    // 1. Buscar coordenadas do estabelecimento
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, address')
      .eq('id', estabelecimentoId)
      .single()

    if (storeError || !store) {
      console.error('❌ [calcularFrete] Erro ao buscar estabelecimento:', {
        error: storeError,
        estabelecimentoId
      })
      return {
        valor: null,
        emArea: false,
        distancia: null,
        erro: 'Estabelecimento não encontrado'
      }
    }

    // Tentar geocodificar o endereço do estabelecimento
    let storeCoordinates
    if (store.address) {
      // Tentar geocodificar o endereço diretamente
      const { geocodeAddress } = await import('./geocoding')
      storeCoordinates = await geocodeAddress(store.address)
    } else {
      console.error('❌ [calcularFrete] Estabelecimento não tem endereço cadastrado:', store)
      return {
        valor: null,
        emArea: false,
        distancia: null,
        erro: 'Estabelecimento não tem endereço cadastrado. Por favor, cadastre o endereço nas configurações da loja.'
      }
    }

    if (!storeCoordinates) {
      return {
        valor: null,
        emArea: false,
        distancia: null,
        erro: 'Não foi possível obter coordenadas do estabelecimento'
      }
    }

    // 2. Buscar coordenadas do CEP de destino
    const destinationCoordinates = await geocodificarCEP(cepDestino)
    if (!destinationCoordinates) {
      return {
        valor: null,
        emArea: false,
        distancia: null,
        erro: 'CEP de destino inválido ou não encontrado'
      }
    }

    // 3. Calcular distância
    const distancia = calcularDistancia(storeCoordinates, destinationCoordinates)
    
    // Garantir que a distância seja um número válido
    if (isNaN(distancia) || distancia < 0) {
      return {
        valor: null,
        emArea: false,
        distancia: null,
        erro: 'Erro ao calcular distância'
      }
    }

    // 4. Buscar faixas de frete do estabelecimento (ordenadas por distância máxima)
    const { data: faixas, error: faixasError } = await supabase
      .from('delivery_radius')
      .select('*')
      .eq('store_id', estabelecimentoId)
      .order('radius_km', { ascending: true })

    if (faixasError || !faixas || faixas.length === 0) {
      return {
        valor: null,
        emArea: false,
        distancia,
        erro: 'Nenhuma faixa de frete cadastrada para este estabelecimento'
      }
    }

    // 5. Determinar em qual faixa a distância se encaixa
    // Lógica: cada faixa cobre um intervalo
    // Faixa 1: 0 até radius_km[0] (inclusive)
    // Faixa 2: > radius_km[0] até radius_km[1] (inclusive)
    // Faixa 3: > radius_km[1] até radius_km[2] (inclusive)
    // etc.
    
    console.log('🔍 [calcularFrete] Verificando faixas:', {
      distancia,
      faixas: faixas.map(f => ({ id: f.id, radius_km: f.radius_km, delivery_price: f.delivery_price }))
    })
    
    // PRIMEIRO: Verificar se a distância ultrapassou a última faixa (verificação mais importante)
    const ultimaFaixa = faixas[faixas.length - 1]
    const distanciaMaximaPermitida = ultimaFaixa.radius_km
    
    console.log('🔍 [calcularFrete] Verificação de limite:', {
      distancia,
      distanciaMaximaPermitida,
      ultrapassou: distancia > distanciaMaximaPermitida,
      comparacao: `${distancia} > ${distanciaMaximaPermitida} = ${distancia > distanciaMaximaPermitida}`
    })
    
    if (distancia > distanciaMaximaPermitida) {
      // Distância claramente ultrapassou o máximo permitido
      console.log('❌ [calcularFrete] Distância ultrapassou o máximo permitido')
      return {
        valor: null,
        emArea: false,
        distancia,
        erro: 'Fora da área de entrega'
      }
    }

    // SEGUNDO: Procurar em qual faixa a distância se encaixa
    let faixaEncontrada: FreightBand | null = null
    let distanciaMinima = 0

    for (let i = 0; i < faixas.length; i++) {
      const faixa = faixas[i]
      
      // Para a primeira faixa, começa em 0 (inclusive)
      // Para as demais, começa após o máximo da faixa anterior (exclusive)
      const limiteInferior = i === 0 ? 0 : distanciaMinima
      
      console.log(`🔍 [calcularFrete] Verificando faixa ${i + 1}:`, {
        limiteInferior,
        limiteSuperior: faixa.radius_km,
        distancia,
        dentro: distancia >= limiteInferior && distancia <= faixa.radius_km
      })
      
      // Verificar se a distância está dentro desta faixa
      // IMPORTANTE: usar <= para incluir o valor exato do máximo
      const limiteSuperior = parseFloat(String(faixa.radius_km))
      const limiteInferiorNum = parseFloat(String(limiteInferior))
      const distanciaNum = parseFloat(String(distancia))
      
      console.log(`🔍 [calcularFrete] Verificando faixa ${i + 1}:`, {
        limiteInferior: limiteInferiorNum,
        limiteSuperior: limiteSuperior,
        distancia: distanciaNum,
        dentro: distanciaNum >= limiteInferiorNum && distanciaNum <= limiteSuperior,
        condicao1: `${distanciaNum} >= ${limiteInferiorNum} = ${distanciaNum >= limiteInferiorNum}`,
        condicao2: `${distanciaNum} <= ${limiteSuperior} = ${distanciaNum <= limiteSuperior}`
      })
      
      if (distanciaNum >= limiteInferiorNum && distanciaNum <= limiteSuperior) {
        faixaEncontrada = faixa
        console.log('✅ [calcularFrete] Faixa encontrada:', faixa)
        break
      }
      
      // Para a próxima faixa, o mínimo é o máximo da faixa atual
      distanciaMinima = parseFloat(String(faixa.radius_km))
    }

    if (faixaEncontrada) {
      console.log('✅ [calcularFrete] Retornando frete calculado:', {
        valor: faixaEncontrada.delivery_price,
        emArea: true,
        distancia
      })
      return {
        valor: faixaEncontrada.delivery_price,
        emArea: true,
        distancia,
        faixa: faixaEncontrada
      }
    } else {
      // Distância não se encaixou em nenhuma faixa (não deveria acontecer se passou na verificação acima)
      console.log('❌ [calcularFrete] Distância não se encaixou em nenhuma faixa')
      return {
        valor: null,
        emArea: false,
        distancia,
        erro: 'Fora da área de entrega'
      }
    }
  } catch (error: any) {
    console.error('Erro ao calcular frete:', error)
    return {
      valor: null,
      emArea: false,
      distancia: null,
      erro: error.message || 'Erro ao calcular frete'
    }
  }
}

