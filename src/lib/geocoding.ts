// Cache para coordenadas já consultadas
const coordinatesCache = new Map<string, { lat: number; lng: number; timestamp: number }>()

// Tempo de cache: 24 horas
const CACHE_DURATION = 24 * 60 * 60 * 1000

export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Obtém o endereço completo a partir do CEP usando ViaCEP
 */
async function getAddressFromCEP(cep: string): Promise<string | null> {
  try {
    const cleanCEP = cep.replace(/\D/g, '')
    if (cleanCEP.length !== 8) {
      throw new Error('CEP inválido')
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
    const data = await response.json()

    if (data.erro) {
      return null
    }

    // Montar endereço completo
    const addressParts = [
      data.logradouro,
      data.bairro,
      data.localidade,
      data.uf,
      'Brasil'
    ].filter(Boolean)

    return addressParts.join(', ')
  } catch (error) {
    console.error('Erro ao buscar endereço do CEP:', error)
    return null
  }
}

/**
 * Geocodifica um endereço para coordenadas usando Nominatim (OpenStreetMap)
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'MVP-Flow-App/1.0'
        }
      }
    )

    const data = await response.json()

    if (!data || data.length === 0) {
      return null
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon)
    }
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error)
    return null
  }
}

/**
 * Geocodifica um CEP para coordenadas (lat/lng)
 * Usa cache para evitar consultas repetidas
 */
export async function geocodificarCEP(cep: string): Promise<Coordinates | null> {
  const cleanCEP = cep.replace(/\D/g, '')

  // Verificar cache
  const cached = coordinatesCache.get(cleanCEP)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { lat: cached.lat, lng: cached.lng }
  }

  try {
    // 1. Buscar endereço do CEP via ViaCEP
    const address = await getAddressFromCEP(cleanCEP)
    if (!address) {
      return null
    }

    // 2. Geocodificar endereço para coordenadas
    const coordinates = await geocodeAddress(address)
    if (!coordinates) {
      return null
    }

    // Salvar no cache
    coordinatesCache.set(cleanCEP, {
      ...coordinates,
      timestamp: Date.now()
    })

    return coordinates
  } catch (error) {
    console.error('Erro ao geocodificar CEP:', error)
    return null
  }
}

/**
 * Calcula a distância em linha reta entre duas coordenadas usando a fórmula de Haversine
 * Retorna a distância em quilômetros
 */
export function calcularDistancia(
  origem: Coordinates,
  destino: Coordinates
): number {
  const R = 6371 // Raio da Terra em km

  const dLat = toRad(destino.lat - origem.lat)
  const dLon = toRad(destino.lng - origem.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origem.lat)) *
      Math.cos(toRad(destino.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distancia = R * c

  return Math.round(distancia * 100) / 100 // Arredondar para 2 casas decimais
}

/**
 * Converte graus para radianos
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Limpa o cache de coordenadas (útil para testes ou reset)
 */
export function limparCacheGeocodificacao(): void {
  coordinatesCache.clear()
}

