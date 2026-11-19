import test from 'node:test'
import assert from 'node:assert/strict'
import { summarize, normalizeName } from './summary.js'

test('receipt totals', () => {
  // Same quantities as the reference receipt (total 400).
  const s = summarize([
    { name: 'أ', items: { foul: 6, potato_roumi_mozz: 5 } },
    { name: 'ب', items: { falafel: 1, foul_tahina: 4, falafel_tahina: 1, falafel_kiri: 4 } },
  ])
  assert.equal(s.total, 400)
  assert.equal(s.count, 21)
  assert.deepEqual(s.people.map((p) => p.total), [250, 150])
})

test('empty', () => {
  assert.equal(summarize([]).total, 0)
})

test('normalizeName', () => {
  assert.equal(normalizeName('  أحمد   علي '), 'أحمد علي')
})
