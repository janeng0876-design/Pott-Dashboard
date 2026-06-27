import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function generatePassword(): string {
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '@#$!'
  let pwd = ''
  for (let i = 0; i < 8; i++) pwd += letters[Math.floor(Math.random() * letters.length)]
  pwd += digits[Math.floor(Math.random() * digits.length)]
  pwd += digits[Math.floor(Math.random() * digits.length)]
  pwd += special[Math.floor(Math.random() * special.length)]
  return pwd.split('').sort(() => Math.random() - 0.5).join('')
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function requireAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (user.app_metadata?.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { data, error } = await adminClient().auth.admin.listUsers()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const members = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name ?? '',
    role: (u.app_metadata?.role as string) ?? 'member',
    created_at: u.created_at,
  }))

  return NextResponse.json({ members })
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { email, name } = await request.json()
  if (!email || !name) return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })

  const password = generatePassword()

  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    user_metadata: { name },
    app_metadata: { role: 'member' },
    email_confirm: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.user.id, email, name, password })
}

export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { id, role } = await request.json()
  if (!id || !role) return NextResponse.json({ error: 'ID and role are required' }, { status: 400 })
  if (!['admin', 'member'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  const { error } = await adminClient().auth.admin.updateUserById(id, {
    app_metadata: { role },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

  const { error } = await adminClient().auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
