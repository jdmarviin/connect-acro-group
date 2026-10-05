import 'server-only'
import { cache } from 'react'
import { supabaseReader } from '../supabase/read'

export const getData = cache(supabaseReader)
