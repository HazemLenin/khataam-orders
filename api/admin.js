import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { randomInt, timingSafeEqual } from 'node:crypto'

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
})

function same(a, b) {
  const x = Buffer.from(String(a ?? ''))
  const y = Buffer.from(String(b ?? ''))
  return x.length === y.length && timingSafeEqual(x, y)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const { user, pass, action } = req.body ?? {}
  if (!process.env.ADMIN_USER || !same(user, process.env.ADMIN_USER) || !same(pass, process.env.ADMIN_PASS)) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  let emailed
  if (action === 'reset') {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const { error } = await db.rpc('reset_orders', { p_new_code: code })
    if (error) return res.status(500).json({ error: 'تعذر تصفير الطلبات' })

    try {
      await mailer.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.NOTIFY_EMAIL || process.env.GMAIL_USER,
        subject: `كود طلبات ختعم: ${code}`,
        text: `الكود الجديد لطلبات ختعم: ${code}`,
      })
      emailed = true
    } catch (e) {
      console.error('email failed', e)
      emailed = false
    }
  }

  const [settings, orders] = await Promise.all([
    db.from('settings').select('code').eq('id', 1).single(),
    db.from('orders').select('*').order('updated_at'),
  ])
  if (settings.error || orders.error) return res.status(500).json({ error: 'تعذر تحميل البيانات' })

  res.json({ code: settings.data.code, orders: orders.data, emailed })
}
