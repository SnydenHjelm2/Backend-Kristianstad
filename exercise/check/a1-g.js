// Assignment 1: checks of the API for G. Run by exercise/check/a1.bash, or by hand against your running
// server, from the root of your repo:
//   BASE_URL=http://localhost:3000 node --test exercise/check/a1-g.js
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

function assertProduct(product) {
  for (const key of ['id', 'name', 'description', 'price', 'quantity', 'supplier_id']) {
    assert.ok(key in product, `a product has the key ${key}`)
  }
  assert.equal(typeof product.price, 'number', 'price is a number, not a string')
  assert.equal(typeof product.quantity, 'number', 'quantity is a number')
}

test('GET /api/products gives at least 5 products as JSON', async () => {
  const { status, body } = await get('/api/products')
  assert.equal(status, 200)
  assert.ok(Array.isArray(body), 'the body is a JSON array')
  assert.ok(body.length >= 5, `at least 5 products, got ${body.length}`)
  body.forEach(assertProduct)
})

test('the products come from both suppliers 1 and 2', async () => {
  const { body } = await get('/api/products')
  const suppliers = new Set(body.map((product) => product.supplier_id))
  assert.ok(suppliers.has(1) && suppliers.has(2), 'products with supplier_id 1 and 2')
})

test('GET /api/products/1 gives product 1', async () => {
  const { status, body } = await get('/api/products/1')
  assert.equal(status, 200)
  assertProduct(body)
  assert.equal(body.id, 1)
})

test('GET /api/products/1/supplier gives the supplier of product 1', async () => {
  const product = (await get('/api/products/1')).body
  const { status, body } = await get('/api/products/1/supplier')
  assert.equal(status, 200)
  for (const key of ['id', 'name', 'email']) {
    assert.ok(key in body, `the supplier has the key ${key}`)
  }
  assert.equal(body.id, product.supplier_id)
})

test('GET /api/suppliers gives at least 2 suppliers', async () => {
  const { status, body } = await get('/api/suppliers')
  assert.equal(status, 200)
  assert.ok(Array.isArray(body) && body.length >= 2)
  for (const key of ['id', 'name', 'email']) {
    assert.ok(key in body[0], `a supplier has the key ${key}`)
  }
})
