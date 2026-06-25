import * as XLSX from 'xlsx'

const COLUMN_MAP: Record<string, string> = {
  'Sales No': 'sales_no',
  'Date': 'date',
  'Sales Type': 'sales_type',
  'Manual Receipt No.': 'manual_receipt_no',
  'Station ID': 'station_id',
  'Brand': 'brand',
  'Item Code': 'item_code',
  'Type': 'type',
  'Model': 'model',
  'Description': 'description',
  'Description 2': 'description_2',
  'Description 3': 'description_3',
  'Size': 'size',
  'Color': 'color',
  'Unit Of Measure': 'unit_of_measure',
  'Is Bundle Item': 'is_bundle_item',
  'Supplier': 'supplier',
  'Branch': 'branch',
  'Cost Price': 'cost_price',
  'Unit RRP': 'unit_rrp',
  'Unit Price (Sold At)': 'unit_price',
  'Qty': 'qty',
  'Sales Amt Before Discount': 'sales_amt_before_discount',
  'Discount Amt': 'discount_amt',
  'Discount Percent': 'discount_percent',
  'Sales Amt After Discount': 'sales_amt_after_discount',
  'GST Amt': 'gst_amt',
  'Profit': 'profit',
  'Min Selling Price': 'min_selling_price',
  'Min Selling Price 2': 'min_selling_price_2',
  'Final Collection Amt': 'final_collection_amt',
  'Amt Received': 'amt_received',
  'Sold Below Min Selling Price': 'sold_below_min_price',
  'Sold Below Min Selling Price 2': 'sold_below_min_price_2',
  'Customer': 'customer',
  'I/C No.': 'ic_no',
  'Qty Balance': 'qty_balance',
  'Tax Code': 'tax_code',
  'Note': 'note',
  'Remarks': 'remarks',
  'Sales Person': 'sales_person',
  'Sales Person 2': 'sales_person_2',
  'Dispenser': 'dispenser',
}

const NUMERIC_FIELDS = new Set([
  'cost_price', 'unit_rrp', 'unit_price', 'qty',
  'sales_amt_before_discount', 'discount_amt', 'discount_percent',
  'sales_amt_after_discount', 'gst_amt', 'profit',
  'min_selling_price', 'min_selling_price_2',
  'final_collection_amt', 'amt_received', 'qty_balance',
])

function excelDateToISO(value: unknown): string | null {
  if (!value) return null
  // Already a JS Date
  if (value instanceof Date) return value.toISOString()
  // Excel serial number
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    if (date) {
      const d = new Date(Date.UTC(date.y, date.m - 1, date.d, date.H, date.M, date.S))
      return d.toISOString()
    }
  }
  // String date
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  return null
}

// Normalize a header string for fuzzy matching (lowercase + collapse whitespace)
function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

// Build a normalized lookup: normalized header → db column name
const NORMALIZED_MAP: Record<string, string> = {}
for (const [excelCol, dbCol] of Object.entries(COLUMN_MAP)) {
  NORMALIZED_MAP[normalize(excelCol)] = dbCol
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseExcelFile(buffer: ArrayBuffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Scan raw rows to find the actual header row (some files have a title row on top)
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][]
  const headerRowIdx = rawRows.findIndex((row) =>
    Array.isArray(row) &&
    row.some((cell) => typeof cell === 'string' && NORMALIZED_MAP[normalize(cell)])
  )
  if (headerRowIdx === -1) return []

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, range: headerRowIdx }) as Record<string, unknown>[]

  if (rows.length > 0) {
    const unrecognized = Object.keys(rows[0]).filter((k) => !NORMALIZED_MAP[normalize(k)])
    if (unrecognized.length > 0) {
      console.warn('Unrecognized Excel columns (will be ignored):', unrecognized)
    }
  }

  return rows.map((row) => {
    const mapped: Record<string, unknown> = {}

    for (const [rawKey, rawVal] of Object.entries(row)) {
      const dbCol = NORMALIZED_MAP[normalize(rawKey)]
      if (!dbCol) continue

      if (dbCol === 'date') {
        mapped[dbCol] = excelDateToISO(rawVal)
      } else if (dbCol === 'is_bundle_item') {
        mapped[dbCol] = rawVal === 1 || rawVal === '1' || rawVal === true
      } else if (NUMERIC_FIELDS.has(dbCol)) {
        mapped[dbCol] = rawVal !== null && rawVal !== '' ? Number(rawVal) : null
      } else {
        mapped[dbCol] = rawVal !== null && rawVal !== '' ? String(rawVal) : null
      }
    }

    return mapped
  })
}
