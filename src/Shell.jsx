export default function Shell({ subtitle, children }) {
  return (
    <div className="page">
      <header className="hero">
        <span className="floaty a" aria-hidden="true">🧆</span>
        <span className="floaty b" aria-hidden="true">🍟</span>
        <span className="stamp">{subtitle}</span>
        <h1>ختعم</h1>
      </header>
      <main className="stack">{children}</main>
    </div>
  )
}
