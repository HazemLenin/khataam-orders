import { useState } from 'react'
import { MENU, DELIVERY_FEE } from './menu.js'
import { summarize, money, toText } from './summary.js'

const nameOf = (id) => MENU.find((m) => m.id === id)?.name ?? id
const TONES = ['mustard', 'green', 'tomato', 'sky']
const toneOf = (name) => TONES[[...name].reduce((h, c) => h + c.codePointAt(0), 0) % TONES.length]

export default function Summary({ orders, highlight }) {
  const s = summarize(orders)
  const [copied, setCopied] = useState(null)

  async function copy() {
    try {
      await navigator.clipboard.writeText(toText(s))
      setCopied({ type: 'success', text: 'اتنسخ الطلب، الصقه في واتساب 📋' })
    } catch {
      setCopied({ type: 'error', text: 'النسخ مانفعش' })
    }
  }

  if (!orders.length) {
    return (
      <div className="cw">
        <section className="card">
          <h2>ملخص الطلب</h2>
          <p className="empty">لسه مفيش طلبات، كن أول واحد 👋</p>
        </section>
      </div>
    )
  }

  return (
    <div className="cw">
      <section className="card">
        <h2>ملخص الطلب</h2>

        <div className="stats">
          <div className="stat"><span>{orders.length}</span>أشخاص</div>
          <div className="stat"><span>{s.count}</span>ساندوتش</div>
          <div className="stat total"><span>{s.total.toLocaleString('en')}</span>الإجمالي (ج.م)</div>
        </div>

        <h3>الأصناف</h3>
        {s.items.map((i) => (
          <div className="line" key={i.id}>
            <span className="qty">{i.qty}×</span>
            <span>{i.name}</span>
            <span className="dots" />
            <strong>{money(i.total)}</strong>
          </div>
        ))}

        <h3>حساب كل واحد</h3>
        {s.people.map((p) => (
          <div className={`person ${p.name === highlight ? 'me' : ''}`} key={p.name}>
            <span className={`avatar ${toneOf(p.name)}`}>{[...p.name][0]}</span>
            <div className="grow">
              <div className="person-head">
                <strong>{p.name}{p.name === highlight && <span className="you">أنت</span>}</strong>
                <strong className="price">{money(p.total)}</strong>
              </div>
              <div className="chips">
                {Object.entries(p.items).map(([id, q]) => (
                  <span className="chip" key={id}>{q} {nameOf(id)}</span>
                ))}
              </div>
              {DELIVERY_FEE > 0 && (
                <div className="muted small">أصناف {money(p.subtotal)} + توصيل {money(p.feeShare)}</div>
              )}
            </div>
          </div>
        ))}

        <div className="totals">
          <div className="line"><span>الأصناف</span><span className="dots" /><span>{money(s.itemsTotal)}</span></div>
          <div className="line"><span>التوصيل</span><span className="dots" /><span>{money(s.fee)}</span></div>
          <div className="line grand"><span>المطلوب سداده</span><span className="dots" /><span>{money(s.total)}</span></div>
        </div>

        {copied && <p className={`alert ${copied.type}`}>{copied.text}</p>}
        <button className="btn ghost copy" onClick={copy}>📋 نسخ الطلب كنص</button>
      </section>
    </div>
  )
}
