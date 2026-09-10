'use client'
import dynamic from 'next/dynamic'

const ZoomPlayer = dynamic(() => import('./ZoomPlayer'), { ssr: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ZoomPlayerWrapper(props: any) {
  return <ZoomPlayer {...props} />
}
