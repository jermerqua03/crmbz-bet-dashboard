import { NextResponse } from 'next/server'
import { getData } from '@/lib/getData'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const data = await getData()
  return NextResponse.json(data)
}
