import type { SheetData } from 'write-excel-file/browser'
import type { ExpenseEntry, IncomeEntry } from '../data/types'
import { formatAmount, formatDate } from './format'
import { monthAndYear } from './months'
import { isExpensePaid, isIncomeReceived } from './totals'

export interface ExportLabels {
  income: string
  expenses: string
  month: string
  source: string
  date: string
  expected: string
  received: string
  receivedDate: string
  expense: string
  dueDate: string
  due: string
  paid: string
  total: string
}

export interface ExportTables {
  income: { head: string[]; body: string[][]; totals: string[] }
  expenses: { head: string[]; body: string[][]; totals: string[] }
  rowCount: number
}

/**
 * Builds the exact table the user sees in the preview, and the same one that
 * goes into the .xlsx and the PDF — one shape, three renderers, so what you
 * download is what you previewed.
 */
export function buildExportTables(
  income: IncomeEntry[],
  expenses: ExpenseEntry[],
  labels: ExportLabels,
  locale: string,
): ExportTables {
  const incomeHead = [
    labels.month,
    labels.source,
    labels.date,
    labels.expected,
    labels.received,
    labels.receivedDate,
    '✓',
  ]

  const incomeBody = income.map((e) => [
    monthAndYear(e.period, locale),
    e.source,
    formatDate(e.expected_date),
    formatAmount(e.expected_amount),
    formatAmount(e.received_amount),
    formatDate(e.received_date),
    isIncomeReceived(e) ? 'X' : '',
  ])

  const incomeTotals = [
    labels.total,
    '',
    '',
    formatAmount(income.reduce((s, e) => s + e.expected_amount, 0)),
    formatAmount(income.reduce((s, e) => s + e.received_amount, 0)),
    '',
    '',
  ]

  const expenseHead = [
    labels.month,
    labels.expense,
    labels.dueDate,
    labels.due,
    labels.paid,
    '✓',
  ]

  const expenseBody = expenses.map((e) => [
    monthAndYear(e.period, locale),
    e.name,
    formatDate(e.due_date),
    formatAmount(e.amount_due),
    formatAmount(e.amount_paid),
    isExpensePaid(e) ? 'X' : '',
  ])

  const expenseTotals = [
    labels.total,
    '',
    '',
    formatAmount(expenses.reduce((s, e) => s + e.amount_due, 0)),
    formatAmount(expenses.reduce((s, e) => s + e.amount_paid, 0)),
    '',
  ]

  return {
    income: { head: incomeHead, body: incomeBody, totals: incomeTotals },
    expenses: { head: expenseHead, body: expenseBody, totals: expenseTotals },
    rowCount: income.length + expenses.length,
  }
}

/** Both exporters are imported lazily — neither library should be in the bundle
 *  that loads when you just want to look at a month. */

export async function downloadXlsx(tables: ExportTables, labels: ExportLabels, fileName: string) {
  // The package has no root export — /browser is the DOM build that triggers a
  // download rather than writing to the filesystem.
  const writeXlsxFile = (await import('write-excel-file/browser')).default

  // Annotated as SheetData so TypeScript picks the multi-sheet overload rather
  // than the "array of objects + schema" one.
  const toSheet = (head: string[], body: string[][], totals: string[]): SheetData => [
    head.map((value) => ({ value, fontWeight: 'bold' as const })),
    ...body.map((row) => row.map((value) => ({ value }))),
    totals.map((value) => ({ value, fontWeight: 'bold' as const })),
  ]

  // Two sheets, one per table, so Excel/Sheets opens with Income up front.
  // Called without a fileName the browser build resolves to a Blob, which we
  // save ourselves — the library's own download path isn't in its typings.
  const blob = (await writeXlsxFile([
    {
      sheet: labels.income,
      data: toSheet(tables.income.head, tables.income.body, tables.income.totals),
    },
    {
      sheet: labels.expenses,
      data: toSheet(tables.expenses.head, tables.expenses.body, tables.expenses.totals),
    },
  ])) as unknown as Blob

  saveBlob(blob, fileName)
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function downloadPdf(
  tables: ExportTables,
  labels: ExportLabels,
  fileName: string,
  title: string,
) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const autoTable = autoTableModule.default

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  doc.setFontSize(16)
  doc.text(title, 40, 44)

  doc.setFontSize(11)
  doc.text(labels.income, 40, 74)
  autoTable(doc, {
    startY: 84,
    head: [tables.income.head],
    body: [...tables.income.body, tables.income.totals],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [90, 90, 90] },
    // Right-align the two money columns and the received date.
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 6: { halign: 'center' } },
  })

  const afterIncome =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 84

  doc.text(labels.expenses, 40, afterIncome + 28)
  autoTable(doc, {
    startY: afterIncome + 38,
    head: [tables.expenses.head],
    body: [...tables.expenses.body, tables.expenses.totals],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [90, 90, 90] },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'center' } },
  })

  doc.save(fileName)
}
