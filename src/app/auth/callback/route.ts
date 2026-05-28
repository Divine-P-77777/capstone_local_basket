import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect destination
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Fetch profile to redirect based on role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (profile) {
          const role = (profile as any).role
          if (role === 'shop_owner') {
            return NextResponse.redirect(`${origin}/shop/dashboard`)
          } else if (role === 'delivery_agent') {
            return NextResponse.redirect(`${origin}/delivery/dashboard`)
          } else if (role === 'admin') {
            return NextResponse.redirect(`${origin}/admin/dashboard`)
          }
        } else {
          // Create default profile for first-time Google sign-ins
          await supabase
            .from("profiles")
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || 'Customer',
              role: 'customer',
            } as any)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
