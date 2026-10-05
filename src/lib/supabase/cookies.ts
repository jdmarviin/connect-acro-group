import { createChunks,stringFromBase64URL,stringToBase64URL,type CookieOptions } from '@supabase/ssr'
type Cookie={name:string;value:string;options:CookieOptions}
// Supabase's OAuth session can include provider credentials. Persist only app credentials.
export function withoutProviderTokens(cookies:Cookie[]):Cookie[] {
  const result=cookies.filter(c=>!/^sb-.+-auth-token(?:\.\d+)?$/.test(c.name))
  const groups=new Map<string,Cookie[]>()
  for(const cookie of cookies) {
    const match=cookie.name.match(/^(sb-.+-auth-token)(?:\.\d+)?$/)
    if(match) groups.set(match[1],[...(groups.get(match[1])||[]),cookie])
  }
  for(const [key,chunks] of groups) {
    const active=chunks.filter(c=>c.value).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}))
    if(!active.length) {result.push(...chunks);continue}
    const encoded=active.map(c=>c.value).join('')
    // Fail closed on malformed auth-cookie encoding rather than leaking unparsed tokens.
    const session=JSON.parse(encoded.startsWith('base64-')?stringFromBase64URL(encoded.slice(7)):encoded)
    delete session.provider_token
    delete session.provider_refresh_token
    const safe='base64-'+stringToBase64URL(JSON.stringify(session))
    result.push(...chunks.map(c=>({...c,value:'',options:{...c.options,maxAge:0}})))
    result.push(...createChunks(key,safe).map(c=>({...c,options:active[0].options})))
  }
  return result
}
