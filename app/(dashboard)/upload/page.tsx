'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { parseExcelFile } from '@/lib/excel-parser'
import { Upload as UploadType } from '@/types'
import { UploadCloud, Trash2, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react'

export default function UploadPage() {
  const supabase = createClient()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [authChecked, setAuthChecked] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [preview, setPreview] = useState<Record<string, any>[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [history, setHistory] = useState<UploadType[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.app_metadata?.role !== 'admin') {
        router.replace('/')
      } else {
        setAuthChecked(true)
        fetchHistory()
      }
    })
  }, [])

  async function fetchHistory() {
    setHistoryLoading(true)
    const { data } = await supabase
      .from('uploads')
      .select('*')
      .order('uploaded_at', { ascending: false })
    setHistory((data as UploadType[]) ?? [])
    setHistoryLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this upload and all its sales data?')) return
    setDeletingId(id)
    await supabase.from('uploads').delete().eq('id', id)
    setDeletingId(null)
    fetchHistory()
  }

  function processFile(f: File) {
    setFile(f)
    setStatus(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      const rows = parseExcelFile(buffer)
      setRowCount(rows.length)
      setPreview(rows.slice(0, 5))
    }
    reader.readAsArrayBuffer(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }, [])

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setStatus(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()

      if (res.ok) {
        setStatus({ type: 'success', msg: `${json.row_count.toLocaleString()} rows uploaded successfully.` })
        setFile(null)
        setPreview([])
        setRowCount(0)
        fetchHistory()
      } else {
        setStatus({ type: 'error', msg: json.error ?? 'Upload failed.' })
      }
    } catch {
      setStatus({ type: 'error', msg: 'Upload failed. Please try again.' })
    }
    setUploading(false)
  }

  if (!authChecked) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const previewCols = preview[0] ? Object.keys(preview[0]).slice(0, 7) : []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Upload Sales Data</h1>
        <p className="text-sm text-gray-500 mt-1">Upload your Pott Glasses Excel (.xlsx) file</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }}
        />
        <UploadCloud size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-700">
          {file ? file.name : 'Drag & drop your Excel file here, or click to browse'}
        </p>
        {file && <p className="text-xs text-gray-400 mt-1">{rowCount.toLocaleString()} rows detected</p>}
        {!file && <p className="text-xs text-gray-400 mt-1">Supports .xlsx and .xls</p>}
      </div>

      {/* Status */}
      {status && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm ${
          status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {status.msg}
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">
              Preview — first 5 rows of {rowCount.toLocaleString()} total
            </p>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {uploading ? 'Uploading…' : 'Confirm Upload'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {previewCols.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {preview.map((row, i) => (
                  <tr key={i}>
                    {previewCols.map((c) => (
                      <td key={c} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[180px] truncate">
                        {String(row[c] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload history */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Upload History</h3>
        </div>
        {historyLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">No uploads yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={18} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.filename}</p>
                    <p className="text-xs text-gray-400">
                      {u.row_count.toLocaleString()} rows · {new Date(u.uploaded_at).toLocaleString('en-MY')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(u.id)}
                  disabled={deletingId === u.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
