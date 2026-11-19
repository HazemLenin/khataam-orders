import { createClient } from '@supabase/supabase-js'
import { randomInt, timingSafeEqual } from 'node:crypto'

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function same(a, b) {
  const x = Buffer.from(String(a ?? ''))
  const y = Buffer.from(String(b ?? ''))
  return x.length === y.length && timingSafeEqual(x, y)
}

const isPrice = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100000

// Returns an error message, or null when the action succeeded.
async function act(action, body) {
  if (action === 'reset') {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const { error } = await db.rpc('reset_orders', { p_new_code: code })
    return error && 'تعذر تصفير الطلبات'
  }

  if (action === 'save_item') {
    const { id, name, price, category } = body.item ?? {}
    const row = { name: String(name ?? '').trim(), price, category: String(category ?? '').trim() }
    if (!row.name || row.name.length > 40 || !row.category || row.category.length > 30 || !isPrice(price)) {
      return 'اكتب اسم وقسم وسعر صحيح للصنف'
    }
    const { error } = id
      ? await db.from('menu_items').update(row).eq('id', id)
      : await db.from('menu_items').insert(row)
    return error && 'تعذر حفظ الصنف'
  }

  if (action === 'delete_item') {
    const { error } = await db.rpc('delete_menu_item', { p_id: String(body.id ?? '') })
    return error && 'تعذر حذف الصنف'
  }

  if (action === 'set_fee') {
    if (!isPrice(body.fee)) return 'سعر التوصيل لازم يكون رقم صحيح'
    const { error } = await db.from('settings').update({ delivery_fee: body.fee }).eq('id', 1)
    return error && 'تعذر حفظ سعر التوصيل'
  }

  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const body = req.body ?? {}
  if (!process.env.ADMIN_USER || !same(body.user, process.env.ADMIN_USER) || !same(body.pass, process.env.ADMIN_PASS)) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const error = await act(body.action, body)
  if (error) return res.status(400).json({ error })

  const [settings, orders, menu] = await Promise.all([
    db.from('settings').select('code, delivery_fee').eq('id', 1).single(),
    db.from('orders').select('*').order('updated_at'),
    db.from('menu_items').select('*').order('created_at'),
  ])
  if (settings.error || orders.error || menu.error) return res.status(500).json({ error: 'تعذر تحميل البيانات' })

  res.json({ code: settings.data.code, delivery_fee: Number(settings.data.delivery_fee), orders: orders.data, menu: menu.data })
}
