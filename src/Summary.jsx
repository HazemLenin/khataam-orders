import { MENU, DELIVERY_FEE } from './menu.js'
import { summarize, money } from './summary.js'

const nameOf = (id) => MENU.find((m) => m.id === id)?.name ?? id
const TONES = ['mustard', 'green', 'tomato', 'sky']
const toneOf = (name) => TONES[[...name].reduce((h, c) => h + c.codePointAt(0), 0) % TONES.length]

export default function Summary({ orders, highlight }) {
  const s = summarize(orders)

  if (!orders.length) {
    return (
      <section className="card">
        <h2>ملخص الطلب</h2>
        <p className="empty">لسه مفيش طلبات، كن أول واحد 👋</p>
      </section>
    )
  }

  return (
    <>
      <div className="stats">
        <div className="stat mustard"><span>{orders.length}</span>أشخاص</div>
        <div className="stat green"><span>{s.count}</span>ساندوتش</div>
        <div className="stat tomato"><span>{s.total.toLocaleString('en')}</span>ج.م</div>
      </div>

      <div className="receipt-wrap">
        <section className="receipt">
          <div className="receipt-head">
            <h2>ختعم</h2>
            <div className="muted small">ملخص الطلب · {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
          {s.items.map((i) => (
            <div className="line" key={i.id}>
              <span className="qty">{i.qty}×</span>
              <span>{i.name}</span>
              <span className="dots" />
              <strong>{money(i.total)}</strong>
            </div>
          ))}
          <div className="receipt-totals">
            <div className="line"><span>الأصناف</span><span className="dots" /><span>{money(s.itemsTotal)}</span></div>
            <div className="line"><span>التوصيل</span><span className="dots" /><span>{money(s.fee)}</span></div>
            <div className="line grand"><span>المطلوب سداده</span><span className="dots" /><span>{money(s.total)}</span></div>
          </div>
        </section>
      </div>

      <section className="card">
        <h2>حساب كل واحد</h2>
        <div className="people">
          {s.people.map((p) => (
            <div className={`person ${p.name === highlight ? 'me' : ''}`} key={p.name}>
              <div className={`avatar ${toneOf(p.name)}`}>{[...p.name][0]}</div>
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
        </div>
      </section>
    </>
  )
}
