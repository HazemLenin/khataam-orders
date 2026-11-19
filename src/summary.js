import { MENU, DELIVERY_FEE } from './menu.js'

const round2 = (x) => Math.round(x * 100) / 100

export const normalizeName = (s) => s.trim().replace(/\s+/g, ' ')

export const money = (n) => `${n.toLocaleString('en', { maximumFractionDigits: 2 })} ج.م`

export const subtotalOf = (items) => MENU.reduce((sum, m) => sum + (items[m.id] || 0) * m.price, 0)

export function summarize(orders) {
  const fee = orders.length ? DELIVERY_FEE : 0
  const feeShare = orders.length ? round2(fee / orders.length) : 0

  const people = orders.map((o) => {
    const subtotal = subtotalOf(o.items)
    return { name: o.name, items: o.items, subtotal, feeShare, total: round2(subtotal + feeShare) }
  })

  const items = MENU.map((m) => {
    const qty = orders.reduce((sum, o) => sum + (o.items[m.id] || 0), 0)
    return { ...m, qty, total: qty * m.price }
  }).filter((i) => i.qty > 0)

  const itemsTotal = items.reduce((sum, i) => sum + i.total, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return { people, items, count, itemsTotal, fee, total: round2(itemsTotal + fee) }
}

export function toText(s) {
  const lines = ['🧆 طلب ختعم', '']
  for (const i of s.items) lines.push(`${i.qty} × ${i.name}`)
  lines.push('', `الإجمالي: ${money(s.total)}`, '', '— حساب كل واحد —')
  for (const p of s.people) {
    const items = Object.entries(p.items)
      .map(([id, q]) => `${q} ${MENU.find((m) => m.id === id)?.name ?? id}`)
      .join('، ')
    lines.push(`${p.name}: ${money(p.total)} (${items})`)
  }
  return lines.join('\n')
}
