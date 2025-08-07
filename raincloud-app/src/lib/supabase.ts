import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface UserData {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at?: string
}

export async function fetchUserData(userId?: string): Promise<UserData[]> {
  try {
    let query = supabase
      .from('users')
      .select('*')
    
    if (userId) {
      query = query.eq('id', userId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching user data:', error)
      return []
    }
    
    console.log('Fetched user data:', data)
    return data || []
  } catch (error) {
    console.error('Unexpected error fetching user data:', error)
    return []
  }
}