import { getData } from '@/lib/getData'
import Dashboard from '@/components/Dashboard'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const data = await getData()
  return <Dashboard data={data} />
}
