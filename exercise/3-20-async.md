# 3-20 Asynchronous code: callbacks, promises and async/await

A database answers after a while, not at once. Node.js does not stop and wait meanwhile: it goes on with other work
and comes back when the answer is there. You learn the three ways to write code like that, callbacks, promises and
`async`/`await`, with a file instead of a database, so you can try it without MariaDB. In 3-30 the same `await` gets
rows from MariaDB.

When you are done, your repo has:

```
practice/3-20/
├── films.json      the films, as JSON
├── callback.js     read the file with a callback
├── promise.js      read the file with a promise and .then()
├── await.js        read the file with await, and catch the errors
├── film.js         a module with async functions
├── film.test.js    tests of the async functions
└── parallel.js     wait for one thing at a time, or for all at once
```

## Background: the program does not wait

Some things take time: reading a file, asking a database, calling another server. A synchronous function would stop
the whole program until the answer is there, and a server would answer no one else meanwhile. In Node.js such a
function starts the work and returns at once; the answer comes later. You say what to do with the answer in one of
three ways:

| Way | Looks like | Since |
|---|---|---|
| Callback | `readFile(path, (err, data) => { ... })` | The start of Node.js |
| Promise | `readFile(path).then((data) => { ... })` | ES2015 |
| `async`/`await` | `const data = await readFile(path)` | ES2017, what the course uses |

A *promise* is an object for an answer that comes later. It is *pending* at first, then either *fulfilled* with a
value or *rejected* with an error. `await` waits for a promise and gives its value, or throws its error.

## 1. The data

Create `practice/3-20/films.json` with the films from 3-10:

```json
[
  { "id": 1, "title": "Spirited Away", "year": 2001, "director_id": 1 },
  { "id": 2, "title": "My Neighbor Totoro", "year": 1988, "director_id": 1 },
  { "id": 3, "title": "Lady Bird", "year": 2017, "director_id": 2 },
  { "id": 4, "title": "Little Women", "year": 2019, "director_id": 2 },
  { "id": 5, "title": "The Seventh Seal", "year": 1957, "director_id": 3 },
  { "id": 6, "title": "Wild Strawberries", "year": 1957, "director_id": 3 }
]
```

## 2. A callback

Create `practice/3-20/callback.js`:

```js
import { readFile } from 'node:fs'

const path = new URL('films.json', import.meta.url)

console.log('1. Start reading')

readFile(path, 'utf8', (err, text) => {
  if (err) {
    console.error('Could not read the file:', err.message)
    return
  }
  const films = JSON.parse(text)
  console.log(`3. Read ${films.length} films`)
})

console.log('2. The program goes on')
```

`new URL('films.json', import.meta.url)` is the file next to this one, wherever you run the program from. Run it from
the root of your repo:

```bash
node practice/3-20/callback.js
```

### 2.1 The order of the lines

```text
1. Start reading
2. The program goes on
3. Read 6 films
```

Line 2 comes before line 3, even though it is last in the code. `readFile()` starts the reading and returns at once;
the callback, the function you gave it, is called when the file has been read. The first argument of the callback is
the error, or `null` if all went well: always check it first.

Callbacks work, but when one answer is needed for the next question, the callbacks end up inside each other, deeper
and deeper. That is why promises came.

## 3. A promise

`node:fs/promises` has the same functions, but they return a promise instead of taking a callback. Create
`practice/3-20/promise.js`:

```js
import { readFile } from 'node:fs/promises'

const path = new URL('films.json', import.meta.url)

console.log('1. Start reading')

readFile(path, 'utf8')
  .then((text) => JSON.parse(text))
  .then((films) => console.log(`3. Read ${films.length} films`))
  .catch((err) => console.error('Could not read the file:', err.message))

console.log('2. The program goes on')
```

Run it: the same three lines, in the same order. Each `.then()` gets the value of the step before, and a `.catch()`
at the end takes an error from any step. The steps come one after another instead of inside each other.

## 4. async and await

`await` waits for a promise and gives its value, so the code reads from top to bottom as if it were synchronous.
Create `practice/3-20/await.js`:

```js
import { readFile } from 'node:fs/promises'

const path = new URL('films.json', import.meta.url)

console.log('1. Start reading')
const text = await readFile(path, 'utf8')
const films = JSON.parse(text)
console.log(`2. Read ${films.length} films`)

for (const film of films) {
  console.log(`${film.year} ${film.title}`)
}
```

Run it. Now the reading is done before the next line runs, so the numbers are in the order of the code. The program
still does not block: while it waits, Node.js can do other work, for example answer other requests in a server.

`await` can be used at the top of a module, as here, and inside a function marked `async`. Without `async` you get a
`SyntaxError`.

### 4.1 Errors with try and catch

When the promise is rejected, `await` throws the error, so you catch it with `try` and `catch`. Change the file name
to `missing.json` in `await.js`, run it, and read the error. Then put the reading in a `try`:

```js
let films = []
try {
  const text = await readFile(path, 'utf8')
  films = JSON.parse(text)
} catch (err) {
  console.error('Could not read the films:', err.message)
}
console.log(`2. Read ${films.length} films`)
```

```text
1. Start reading
Could not read the films: ENOENT: no such file or directory, open '.../practice/3-20/missing.json'
2. Read 0 films
```

Change the name back to `films.json` when you are done.

<details>
<summary>A solution</summary>

```js
import { readFile } from 'node:fs/promises'

const path = new URL('films.json', import.meta.url)

console.log('1. Start reading')
let films = []
try {
  const text = await readFile(path, 'utf8')
  films = JSON.parse(text)
} catch (err) {
  console.error('Could not read the films:', err.message)
}
console.log(`2. Read ${films.length} films`)

for (const film of films) {
  console.log(`${film.year} ${film.title}`)
}
```

</details>

## 5. Async functions in a module

An `async` function always returns a promise, also when it returns an ordinary value. So whoever calls it uses
`await` too. Create `practice/3-20/film.js` with two functions that read the file:

```js
import { readFile } from 'node:fs/promises'

const path = new URL('films.json', import.meta.url)

/**
 * All the films, read from films.json.
 * @returns {Promise<object[]>}
 */
export async function getFilms() {
  const text = await readFile(path, 'utf8')
  return JSON.parse(text)
}

/**
 * The film with the id, or undefined if there is none.
 * @param {number} id
 * @returns {Promise<object|undefined>}
 */
export async function getFilm(id) {
  const films = await getFilms()
  return films.find((film) => film.id === id)
}
```

These are the functions you write in 3-30, with a database instead of a file. Whoever calls them does not need to
know where the data comes from.

### 5.1 Forget the await

Try in a terminal what happens without `await`. Start Node in the root of your repo with `node` and type:

```js
const { getFilm } = await import('./practice/3-20/film.js')
getFilm(1)
await getFilm(1)
```

The first call gives `Promise { <pending> }`, a promise and not the film; the second gives the film. A missing
`await` is the most common bug with async code: you get a promise where you expected the value. Leave with `.exit`.

## 6. Test async functions

The functions in `film.js` give promises, so a test has to wait for them, just as the code that uses them does. With
`node:test` that is easy: make the test function `async` and use `await` in it. The test runner then waits for the
promise of the test function, and the test passes when the promise is resolved, and fails when it is rejected, for
example when an `assert` throws after an `await`.

Create `practice/3-20/film.test.js`, with two tests, one for each function:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getFilms, getFilm } from './film.js'

test('getFilms gives all six films', async () => {
  const films = await getFilms()
  assert.equal(films.length, 6)
})

test('getFilm gives the film with the id', async () => {
  const film = await getFilm(1)
  assert.equal(film.title, 'Spirited Away')
})
```

Each test awaits the function, and then checks the value it got, as in the tests of week 1. Run the tests of the
exercise:

```bash
npm test -- practice/3-20
```

Both pass.

### 6.1 A test of your own

`getFilm()` has one more case to test: an id that no film has. `films.find()` then finds nothing, so the function
gives `undefined`. Add a third test to `film.test.js` that calls `getFilm(42)` and checks that the answer is
`undefined`, with `assert.equal()`. Write it the same way as the two above, and run the tests again: all three pass.

<details>
<summary>A solution</summary>

```js
test('getFilm gives undefined for an id that does not exist', async () => {
  const film = await getFilm(42)
  assert.equal(film, undefined)
})
```

</details>

### 6.2 A test without await

See what a missing `await` does in a test too. Remove the `await` in the first test, `const films = getFilms()`, and
run the tests again. The test fails: `films` is a promise and not an array, and `films.length` of a promise is
`undefined`, not `6`. Put the `await` back, and see the test pass again.

## 7. One at a time, or all at once

Each `await` waits until its promise is done before the next line runs. When the questions do not depend on each
other, you can start them all and wait for all of them with `Promise.all()`. Create `practice/3-20/parallel.js`, with
a function that pretends to be a slow database:

```js
import { setTimeout as sleep } from 'node:timers/promises'

/** Wait for ms milliseconds, then give the value, like a slow database. */
async function slow(value, ms) {
  await sleep(ms)
  return value
}

let start = Date.now()
const a = await slow('Spirited Away', 500)
const b = await slow('Lady Bird', 500)
console.log(`One at a time: ${a}, ${b} in ${Date.now() - start} ms`)

start = Date.now()
const [c, d] = await Promise.all([slow('Spirited Away', 500), slow('Lady Bird', 500)])
console.log(`All at once: ${c}, ${d} in ${Date.now() - start} ms`)
```

Run it:

```bash
node practice/3-20/parallel.js
```

```text
One at a time: Spirited Away, Lady Bird in 1003 ms
All at once: Spirited Away, Lady Bird in 501 ms
```

Your times differ by a few milliseconds. Both calls were started at once and the waits overlapped. `Promise.all()`
gives the values in the same order as the promises, whichever is done first, and is rejected if any one of them is.

## Check and commit

```bash
npm run check
git add practice/3-20
git commit -m "3-20 Asynchronous code: callbacks, promises and async/await"
```

If you have a remote of your own, push with `git push`.

### Verify

- [ ] `callback.js`, `promise.js`, `await.js` and `parallel.js` run and print what the text shows.
- [ ] `npm run check` passes, with your own test of `getFilm(42)`.
- [ ] You can say why line 2 came before line 3 in `callback.js`.
- [ ] You can say what a promise is, and what you get if you forget `await`.
- [ ] You can catch the error of an `await` with `try` and `catch`.

<details>
<summary><code>SyntaxError: await is only valid in async functions and the top level bodies of modules</code></summary>

You used `await` inside a function that is not `async`. Put `async` before the function: `async function name()`, or
`async () => { ... }` for an arrow function.

</details>

<details>
<summary>A test passes even though it should fail</summary>

The test function is not `async`, or a promise in it is not awaited, so the test is over before the check runs.
Write `async () => { ... }` and `await` every call to an async function.

</details>

<details>
<summary><code>ENOENT: no such file or directory, open '.../films.json'</code></summary>

The file is not where the code looks. With `new URL('films.json', import.meta.url)` it must be next to the `.js` file,
in `practice/3-20/`. Check the spelling of the name.

</details>

## Read more

- [Testing with Node.js](../doc/testing-with-node.md), the section "Async tests".
- Asynchronous JavaScript, the introduction at MDN, with promises and `async`/`await`:
  https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Async_JS
- `async function`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
- `Promise.all()`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
- The promise API of the file system in Node.js: https://nodejs.org/api/fs.html#promises-api
- The event loop, how Node.js runs async code: https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
