// Assignment 1: checks of the API for VG, the filters and the errors. Run by exercise/check/a1.bash, or by
// hand against your running server, from the root of your repo:
//   BASE_URL=http://localhost:3000 node --test exercise/check/a1-vg.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

const base = process.env.BASE_URL ?? 'http://localhost:3000'

async function get(path) {
  const res = await fetch(`${base}${path}`)
  const body = res.headers.get('content-type')?.includes('application/json')
    ? await res.json()
    : await res.text()
  return { status: res.status, body }
}

function assertError(body) {
  assert.equal(typeof body?.error, 'string', 'the body is JSON with an error message')
}

test('?supplier_id=1 gives exactly the products of supplier 1', async () => {
  const all = (await get('/api/products')).body
  const { status, body } = await get('/api/products?supplier_id=1')
  assert.equal(status, 200)
  const expected = all.filter((product) => product.supplier_id === 1).map((p) => p.id)
  assert.ok(expected.length > 0)
  assert.deepEqual(
    body.map((product) => product.id),
    expected
  )
})

test('?max_quantity=N gives the products with quantity N or less', async () => {
  const all = (await get('/api/products')).body
  const limit = Math.min(...all.map((product) => product.quantity))
  const { status, body } = await get(`/api/products?max_quantity=${limit}`)
  assert.equal(status, 200)
  const expected = all.filter((product) => product.quantity <= limit).map((p) => p.id)
  assert.deepEqual(
    body.map((product) => product.id),
    expected
  )
})

test('the two filters work together', async () => {
  const all = (await get('/api/products')).body
  const { body } = await get('/api/products?supplier_id=2&max_quantity=1000000')
  const expected = all.filter((product) => product.supplier_id === 2).map((p) => p.id)
  assert.deepEqual(
    body.map((product) => product.id),
    expected
  )
})

test('a filter that matches nothing gives an empty array', async () => {
  const { status, body } = await get('/api/products?supplier_id=999999')
  assert.equal(status, 200)
  assert.deepEqual(body, [])
})

test('a missing product gives 404 with an error message', async () => {
  for (const path of ['/api/products/999999', '/api/products/999999/supplier']) {
    const { status, body } = await get(path)
    assert.equal(status, 404, path)
    assertError(body)
  }
})

test('an id that is not a number gives 400 with an error message', async () => {
  for (const path of ['/api/products/abc', '/api/products/abc/supplier']) {
    const { status, body } = await get(path)
    assert.equal(status, 400, path)
    assertError(body)
  }
})

test('a filter value that is not a number gives 400', async () => {
  for (const path of ['/api/products?max_quantity=abc', '/api/products?supplier_id=1%20OR%201=1']) {
    const { status, body } = await get(path)
    assert.equal(status, 400, path)
    assertError(body)
  }
})
