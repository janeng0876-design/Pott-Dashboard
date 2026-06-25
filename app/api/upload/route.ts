import { createClient } from '@/lib/supabase/server'
import { parseExcelFile } from '@/lib/excel-parser'
import { NextResponse } from 'next/server'

const CHUNK_SIZE = 500

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const rows = parseExcelFile(buffer)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data rows found in file' }, { status: 400 })
  }

  // Create upload record
  const { data: upload, error: uploadError } = await supabase
    .from('uploads')
    .insert({ filename: file.name, row_count: rows.length, uploaded_by: user.id })
    .select()
    .single()

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Attach upload_id to each row and insert in chunks
  const enriched = rows.map((r) => ({ ...r, upload_id: upload.id }))

  for (let i = 0; i < enriched.length; i += CHUNK_SIZE) {
    const chunk = enriched.slice(i, i + CHUNK_SIZE)
    const { error } = await supabase.from('sales').insert(chunk)
    if (error) {
      await supabase.from('uploads').delete().eq('id', upload.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, upload_id: upload.id, row_count: rows.length })
}
