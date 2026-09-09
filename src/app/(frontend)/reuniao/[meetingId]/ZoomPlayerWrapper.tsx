'use client'
import dynamic from 'next/dynamic'

const ZoomPlayer = dynamic(() => import('./ZoomPlayer'), { ssr: false })

export default function ZoomPlayerWrapper(props: any) {
  return <ZoomPlayer {...props} />
}
