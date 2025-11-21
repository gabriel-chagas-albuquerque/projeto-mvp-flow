import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// Inferir o tipo User do retorno do Supabase Auth
type User = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']

interface AuthContextType {
  user: User | null
  userProfile: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, cpf: string, phone: string, whatsapp: string, address: string) => Promise<void>
  signOut: () => Promise<void>
  clearUserProfile: () => void
  disableAutoProfileLoad: () => void
  enableAutoProfileLoad: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const fetchingProfile = useRef<string | null>(null)
  const profileFetchPromise = useRef<Promise<void> | null>(null)
  const autoProfileLoadDisabled = useRef(false)

  useEffect(() => {
    let mounted = true

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user && !autoProfileLoadDisabled.current) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Ouvir mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        // Só buscar se não estiver desabilitado e não estiver já buscando para este usuário
        if (!autoProfileLoadDisabled.current && fetchingProfile.current !== session.user.id) {
        fetchUserProfile(session.user.id)
        }
      } else {
        setUserProfile(null)
        setLoading(false)
        fetchingProfile.current = null
        profileFetchPromise.current = null
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string, skipLoading = false) => {
    // Se já está buscando este perfil, retornar a promise existente
    if (fetchingProfile.current === userId && profileFetchPromise.current) {
      return profileFetchPromise.current
    }

    // Se já está buscando outro perfil, esperar
    if (fetchingProfile.current !== null && fetchingProfile.current !== userId) {
      if (profileFetchPromise.current) {
        await profileFetchPromise.current
      }
    }

    fetchingProfile.current = userId

    const fetchPromise = (async () => {
      try {
        if (!skipLoading) {
          setLoading(true)
        }

        // Verificar autenticação atual
        const authResponse = await supabase.auth.getUser()
        const { data: { user: authUser }, error: authError } = authResponse

      if (authError || !authUser) {
        setUserProfile(null)
        if (!skipLoading) setLoading(false)
        return
      }

        // Verificar se o userId ainda é o mesmo (pode ter mudado durante a requisição)
        if (fetchingProfile.current !== userId) {
          return
        }

        // Verificar se o userId da autenticação corresponde ao solicitado
        if (authUser.id !== userId) {
          setUserProfile(null)
          if (!skipLoading) setLoading(false)
          return
        }

        const queryResponse = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

        const { data, error } = queryResponse

        // Verificar novamente se o userId ainda é o mesmo
        if (fetchingProfile.current !== userId) {
          return
        }

        if (error) {
        setUserProfile(null)
      } else if (data) {
        setUserProfile(data)
      } else {
          // Tentar resolver o problema: pode haver um registro com email mas ID diferente
          if (authUser?.email) {
            try {
              // Primeiro, tentar buscar por email para ver se existe com ID diferente
              const { data: existingByEmail } = await supabase
                .from('users')
                .select('*')
                .eq('email', authUser.email)
                .maybeSingle()
              
              if (existingByEmail) {
                // Como o ID é chave primária, não podemos atualizá-lo diretamente
                // Precisamos deletar o antigo e criar um novo com o ID correto
                const { error: deleteError } = await supabase
                  .from('users')
                  .delete()
                  .eq('id', existingByEmail.id)
                
                if (deleteError) {
                  setUserProfile(null)
                } else {
                  // Criar novo com o ID correto, preservando os dados existentes
                  const { data: newProfile, error: createError } = await supabase
                    .from('users')
                    .insert({
                      id: userId,
                      email: authUser.email,
                      name: existingByEmail.name || authUser.email.split('@')[0],
                      cpf: existingByEmail.cpf || null,
                      phone: existingByEmail.phone || null,
                      whatsapp: existingByEmail.whatsapp || null,
                      address: existingByEmail.address || null,
                      role: existingByEmail.role || 'customer',
                      store_id: existingByEmail.store_id || null,
                      created_at: existingByEmail.created_at || new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                    .select()
                    .single()
                  
                  if (createError) {
                    setUserProfile(null)
                  } else if (newProfile) {
                    setUserProfile(newProfile)
                    return
                  }
                }
              } else {
                // Não existe registro com esse email, criar novo
                const { data: newProfile, error: createError } = await supabase
                  .from('users')
                  .insert({
                    id: userId,
                    email: authUser.email,
                    name: authUser.email.split('@')[0],
                    role: 'customer',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .select()
                  .single()
                
                if (createError) {
                  setUserProfile(null)
                } else if (newProfile) {
                  setUserProfile(newProfile)
                  return
                }
              }
            } catch (createException) {
              // Silenciosamente falha
            }
          }
          
        setUserProfile(null)
      }
    } catch (error) {
        if (fetchingProfile.current === userId) {
      setUserProfile(null)
        }
    } finally {
        if (fetchingProfile.current === userId) {
          fetchingProfile.current = null
          profileFetchPromise.current = null
        }
        if (!skipLoading) {
          setLoading(false)
    }
      }
    })()

    profileFetchPromise.current = fetchPromise
    return fetchPromise
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    // O onAuthStateChange vai chamar fetchUserProfile automaticamente
    // Não precisamos chamar aqui para evitar chamadas duplicadas
  }

  const signUp = async (
    email: string,
    password: string,
    name: string,
    cpf: string,
    phone: string,
    whatsapp: string,
    address: string
  ) => {
    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })
    if (authError) throw authError

    if (authData.user) {
      // Criar perfil do usuário na tabela users
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          cpf,
          phone,
          whatsapp,
          address,
          role: 'customer',
        })

      if (profileError) {
        // Se der erro, tenta fazer login para pegar o perfil
      }
      await fetchUserProfile(authData.user.id)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUserProfile(null)
  }

  const clearUserProfile = useCallback(() => {
    setUserProfile(null)
    fetchingProfile.current = null
    profileFetchPromise.current = null
  }, [])

  const disableAutoProfileLoad = useCallback(() => {
    autoProfileLoadDisabled.current = true
  }, [])

  const enableAutoProfileLoad = useCallback(() => {
    autoProfileLoadDisabled.current = false
  }, [])

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signUp, signOut, clearUserProfile, disableAutoProfileLoad, enableAutoProfileLoad }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

