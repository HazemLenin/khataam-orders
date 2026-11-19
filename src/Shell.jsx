export default function Shell({ subtitle, children }) {
  return (
    <div className="page">
      <header className="hero">
        <div className="floaties" aria-hidden="true">
          <span>🧆</span><span>🫘</span><span>🍟</span><span>🌶️</span>
        </div>
        <span className="sticker">{subtitle}</span>
        <h1>ختعم</h1>
        <p className="tagline">فطار الشلة، طلب واحد ومن غير زحمة</p>
      </header>
      <main className="stack">{children}</main>
    </div>
  )
}
