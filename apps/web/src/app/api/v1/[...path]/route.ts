import { NextResponse } from 'next/server'
import { handleMockRequest } from '@/mocks/server'

/**
 * Мок-API для фронтенда (Части 2–4 в контрактах).
 * Активен при NEXT_PUBLIC_API_MODE=mock; при живом бэкенде NEXT_PUBLIC_API_URL выставляет baseURL, а эти роуты не вызываются.
 */

export const dynamic = 'force-dynamic'

async function run(request: Request, segments: string[]): Promise<NextResponse> {
  const url = new URL(request.url)
  let body: Record<string, unknown> = {}
  if (request.method !== 'GET' && request.method !== 'DELETE') {
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      body = {}
    }
  }

  const result = handleMockRequest({
    method: request.method,
    segments,
    query: url.searchParams,
    body,
    hostname: request.headers.get('host')?.split(':')[0] ?? 'localhost',
    auth: request.headers.get('authorization') ?? '',
    refreshTokenHeader: request.headers.get('x-refresh-token') ?? ''
  })

  return NextResponse.json(result.body, { status: result.status })
}

interface RouteContext {
  params: { path: string[] }
}

export async function GET(request: Request, { params }: RouteContext) {
  return run(request, params.path)
}

export async function POST(request: Request, { params }: RouteContext) {
  return run(request, params.path)
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return run(request, params.path)
}

export async function PUT(request: Request, { params }: RouteContext) {
  return run(request, params.path)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  return run(request, params.path)
}
