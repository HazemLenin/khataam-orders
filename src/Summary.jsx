import { MENU, DELIVERY_FEE } from './menu.js'
import { summarize, money } from './summary.js'

const nameOf = (id) => MENU.find((m) => m.id === id)?.name ?? id

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
    <section className="card">
      <h2>ملخص الطلب</h2>

      <div className="stats">
        <div className="stat"><span>{orders.length}</span>أشخاص</div>
        <div className="stat"><span>{s.count}</span>ساندوتش</div>
        <div className="stat accent"><span>{s.total.toLocaleString('en')}</span>ج.م</div>
      </div>

      <h3>الأصناف</h3>
      <div className="table">
        {s.items.map((i) => (
          <div className="row" key={i.id}>
            <span className="qty">{i.qty}×</span>
            <span className="grow">{i.name}</span>
            <span className="muted">{money(i.price)}</span>
            <strong>{money(i.total)}</strong>
          </div>
        ))}
      </div>

      <h3>حساب كل واحد</h3>
      <div className="people">
        {s.people.map((p) => (
          <div className={`person ${p.name === highlight ? 'me' : ''}`} key={p.name}>
            <div className="person-head">
              <strong>{p.name}</strong>
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
        ))}
      </div>

      <div className="totals">
        <div><span>الأصناف</span><span>{money(s.itemsTotal)}</span></div>
        <div><span>التوصيل</span><span>{money(s.fee)}</span></div>
        <div className="grand"><span>الإجمالي المطلوب</span><span>{money(s.total)}</span></div>
      </div>
    </section>
  )
}
