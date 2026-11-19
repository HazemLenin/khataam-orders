const round2 = (x) => Math.round(x * 100) / 100

const ICONS = { 'فول': '🫘', 'فلافل': '🧆', 'طعمية': '🧆', 'بطاطس': '🍟', 'مشروبات': '🥤', 'عيش': '🫓' }

export const normalizeName = (s) => s.trim().replace(/\s+/g, ' ')

export const money = (n) => `${n.toLocaleString('en', { maximumFractionDigits: 2 })} ج.م`

// Categories in the order they were first added, cheapest item first inside each.
export function groupMenu(menu) {
  const groups = []
  for (const m of menu) {
    let g = groups.find((x) => x.title === m.category)
    if (!g) groups.push((g = { title: m.category, icon: ICONS[m.category] ?? '🍽️', items: [] }))
    g.items.push({ ...m, price: Number(m.price) })
  }
  for (const g of groups) g.items.sort((a, b) => a.price - b.price)
  return groups
}

export const subtotalOf = (items, menu) =>
  menu.reduce((sum, m) => sum + (items[m.id] || 0) * Number(m.price), 0)

export function summarize(orders, menu, deliveryFee) {
  const ordered = groupMenu(menu).flatMap((g) => g.items)
  const fee = orders.length ? Number(deliveryFee) || 0 : 0
  const feeShare = orders.length ? round2(fee / orders.length) : 0

  const people = orders.map((o) => {
    const subtotal = subtotalOf(o.items, ordered)
    const lines = ordered.filter((m) => o.items[m.id]).map((m) => ({ id: m.id, name: m.name, qty: o.items[m.id] }))
    return { name: o.name, lines, subtotal, feeShare, total: round2(subtotal + feeShare) }
  })

  const items = ordered
    .map((m) => {
      const qty = orders.reduce((sum, o) => sum + (o.items[m.id] || 0), 0)
      return { ...m, qty, total: qty * m.price }
    })
    .filter((i) => i.qty > 0)

  const itemsTotal = items.reduce((sum, i) => sum + i.total, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return { people, items, count, itemsTotal, fee, total: round2(itemsTotal + fee) }
}

export function toText(s) {
  const lines = ['🧆 طلب ختعم', '']
  for (const i of s.items) lines.push(`${i.qty} × ${i.name}`)
  lines.push('', `الإجمالي: ${money(s.total)}`, '', '— حساب كل واحد —')
  for (const p of s.people) {
    lines.push(`${p.name}: ${money(p.total)} (${p.lines.map((l) => `${l.qty} ${l.name}`).join('، ')})`)
  }
  return lines.join('\n')
}
