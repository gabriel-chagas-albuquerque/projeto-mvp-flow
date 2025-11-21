import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lekxynwerqwjzefsliqw.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3h5bndlcnF3anplZnNsaXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMjE0OTYsImV4cCI6MjA3ODg5NzQ5Nn0.H3OBoRHBb4RoW0gnyzvrjIIVKC1gX930dBmBNwEzbkA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

