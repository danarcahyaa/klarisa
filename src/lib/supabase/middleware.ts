import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh and verify the authentication session before routing.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isDashboardRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  const isGuestOnlyRoute = pathname === '/login' || pathname === '/register'

  const redirectWithRefreshedCookies = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectResponse.cookies.set(name, value, options)
    })
    return redirectResponse
  }

  if (!user && isDashboardRoute) {
    const loginUrl = request.nextUrl.clone()
    const destination = `${pathname}${request.nextUrl.search}`
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('next', destination)
    return redirectWithRefreshedCookies(loginUrl)
  }

  if (user && isGuestOnlyRoute) {
    const requestedNext = request.nextUrl.searchParams.get('next')
    const safeDestination =
      requestedNext?.startsWith('/') && !requestedNext.startsWith('//')
        ? requestedNext
        : '/dashboard/search'
    return redirectWithRefreshedCookies(new URL(safeDestination, request.url))
  }

  return supabaseResponse
}
