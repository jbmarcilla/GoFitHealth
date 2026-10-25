import { createHash } from 'crypto'
import { supabase } from './db.js'

let _userId: string | null = null

export async function getUserId(): Promise<string> {
  if (_userId) return _userId

  const apiKey = process.env.GOFIT_API_KEY
  if (!apiKey) throw new Error('GOFIT_API_KEY is required')

  const keyHash = createHash('sha256').update(apiKey).digest('hex')
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', keyHash)
    .single()

  if (error || !data) throw new Error('Invalid GOFIT_API_KEY')

  _userId = data.user_id as string

  await supabase
    .from('api_keys')
    .update({ last_used: new Date().toISOString() })
    .eq('key_hash', keyHash)

  return _userId
}
