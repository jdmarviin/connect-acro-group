import { redirect } from 'next/navigation'

// The old social feed contained sample content only. The product's activity lives in the dashboard.
export default function FeedPage() { redirect('/dashboard') }
