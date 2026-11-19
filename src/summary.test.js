import test from 'node:test'
import assert from 'node:assert/strict'
import { summarize, normalizeName, groupMenu, toText } from './summary.js'

const MENU = [
  { id: 'foul', name: 'فول', price: 10, category: 'فول' },
  { id: 'foul_tahina', name: 'فول طحينة', price: 12, category: 'فول' },
  { id: 'falafel_kiri', name: 'فلافل كيري', price: 20, category: 'فلافل' },
  { id: 'falafel', name: 'فلافل', price: 10, category: 'فلافل' },
  { id: 'falafel_tahina', name: 'فلافل طحينة', price: '12.00', category: 'فلافل' },
  { id: 'potato_roumi_mozz', name: 'بطاطس رومي موتزريلا', price: 38, category: 'بطاطس' },
]

test('receipt totals', () => {
  // Same quantities as the reference receipt (total 400).
  const s = summarize([
    { name: 'أ', items: { foul: 6, potato_roumi_mozz: 5 } },
    { name: 'ب', items: { falafel: 1, foul_tahina: 4, falafel_tahina: 1, falafel_kiri: 4 } },
  ], MENU, 0)
  assert.equal(s.total, 400)
  assert.equal(s.count, 21)
  assert.deepEqual(s.people.map((p) => p.total), [250, 150])
})

test('delivery fee split and deleted items ignored', () => {
  const s = summarize([
    { name: 'أ', items: { foul: 1, gone: 3 } },
    { name: 'ب', items: { foul: 1 } },
    { name: 'ج', items: { foul: 1 } },
  ], MENU, 10)
  assert.equal(s.total, 40)
  assert.deepEqual(s.people.map((p) => p.total), [13.33, 13.33, 13.33])
  assert.ok(!toText(s).includes('gone'))
})

test('groupMenu keeps category order and sorts by price', () => {
  const g = groupMenu(MENU)
  assert.deepEqual(g.map((x) => x.title), ['فول', 'فلافل', 'بطاطس'])
  assert.deepEqual(g[1].items.map((i) => i.id), ['falafel', 'falafel_tahina', 'falafel_kiri'])
})

test('empty', () => {
  assert.equal(summarize([], MENU, 15).total, 0)
})

test('normalizeName', () => {
  assert.equal(normalizeName('  أحمد   علي '), 'أحمد علي')
})
