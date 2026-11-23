# 3-30 Node.js and MariaDB: queries with mysql2

You connect a Node.js program to the film database from 3-10, with the package `mysql2`. The settings for the
connection come from a file `.env`, the queries are `async` functions in a module of their own, and every value from
the user goes into the SQL through a placeholder. You also see what SQL injection is, and how the placeholder stops
it.

The module you write here, `film.js`, is used again in 3-35 by a terminal program and in week 4 by Express.

You need MariaDB running (3-05) and the `film` database loaded from `practice/3-10/create.sql` (3-10). When you are
done, your repo has:

```
practice/3-30/
├── .env.example    the settings, without your password
├── .env            your settings, not committed
├── database.js     the connection pool
├── film.js         the queries, as async functions
├── main.js         a program that tries the functions
└── injection.js    SQL injection, and how a placeholder stops it
```

## Background: a driver, a pool and placeholders

`mysql2` is a *driver*: it speaks the protocol of MariaDB (and MySQL), sends your SQL to the server and gives you the
rows as JavaScript objects. You import it as `mysql2/promise`, the version where each query returns a promise, so you
use it with `await` as in 3-20.

Opening a connection to a database takes time. A *pool* keeps a few connections open and lends one to each query, so
you create the pool once, in a module of its own, and import it where you need it.

A *placeholder* is a `?` in the SQL, with the value given next to it. The driver puts the value in safely, so it can
never be read as SQL. Never build an SQL string with `+` or `${}` from a value the user gave.

## 1. Install mysql2

In the root of your repo:

```bash
npm install mysql2
```

Check that your MariaDB is running and that the film database is there:

```bash
mariadb -u student -pP@ssw0rd film -e "SELECT COUNT(*) FROM film;"
```

If it says `Unknown database 'film'` or `Table 'film.film' doesn't exist`, do steps 1 and 7 of 3-10 first.

## 2. The settings in .env

The host, the port, the user and the password differ between computers, and the password must not be committed. So
they go in a file `.env`, which the repo's `.gitignore` keeps out of Git. Create `practice/3-30/.env.example`, the
version you commit, with a placeholder for the password:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=student
DB_PASSWORD=your-password
DB_DATABASE=film
```

Copy it to `.env` and put your real password in the copy:

```bash
cp practice/3-30/.env.example practice/3-30/.env
```

Change `DB_PORT` too if your MariaDB is on another port than 3306. Node.js reads the file with the flag
`--env-file`, and the values end up in `process.env`. Try it:

```bash
node --env-file=practice/3-30/.env -e "console.log(process.env.DB_USER, process.env.DB_DATABASE)"
```

```text
student film
```

Run `git status -u`: `.env.example` shows up as new, `.env` does not. The `-u` lists each file in a new
directory, not only the directory.

## 3. The connection pool

Create `practice/3-30/database.js`:

```js
import mysql from 'mysql2/promise'

// One pool for the whole program. The values come from .env (node --env-file).
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
})

export default pool
```

Create `practice/3-30/main.js` with a first query:

```js
import pool from './database.js'

const [rows] = await pool.query('SELECT * FROM director')
console.log(rows)

await pool.end()
```

`pool.query()` returns a promise of an array with two parts, the rows and a description of the columns; `[rows]` takes
the first part. Run it:

```bash
node --env-file=practice/3-30/.env practice/3-30/main.js
```

### 3.1 The directors as objects

```text
[
  { id: 1, name: 'Hayao Miyazaki', country: 'Japan' },
  { id: 2, name: 'Greta Gerwig', country: 'USA' },
  { id: 3, name: 'Ingmar Bergman', country: 'Sweden' }
]
```

Each row is an object with the column names as keys. Now remove the line `await pool.end()` and run again: the program
prints the rows and then hangs, since the pool keeps its connections open and waits for more queries. Stop it with
`Ctrl+C` and put the line back. A program that is done with the database ends the pool; a server never does.

## 4. The queries in a module

Put the SQL in functions in a module of their own, `practice/3-30/film.js`, so the rest of the program does not need
to know about SQL. Start with all the films, joined with the name of their director as in 3-10:

```js
import pool from './database.js'

/**
 * All films, with the name of their director, sorted by year.
 * @returns {Promise<object[]>}
 */
export async function getFilms() {
  const [rows] = await pool.query(`
    SELECT film.id, film.title, film.year, film.rating, director.name AS director
    FROM film
    JOIN director ON film.director_id = director.id
    ORDER BY film.year, film.title
  `)
  return rows
}
```

The backticks let the SQL span several lines. Change `main.js` to use the function:

```js
import pool from './database.js'
import { getFilms } from './film.js'

const films = await getFilms()
console.log(films[0])

await pool.end()
```

Run it as before:

```bash
node --env-file=practice/3-30/.env practice/3-30/main.js
```

### 4.1 The first film

```text
{
  id: 5,
  title: 'The Seventh Seal',
  year: 1957,
  rating: '8.1',
  director: 'Ingmar Bergman'
}
```

Look at `rating`: `'8.1'` is a string, not a number. `mysql2` gives `DECIMAL` columns as strings, since a decimal
number in the database can have more digits than a JavaScript number can hold exactly. For ratings and prices that is
no problem, so tell the pool to give numbers. Add the option to `createPool()` in `database.js`:

```js
  database: process.env.DB_DATABASE,
  // DECIMAL columns come back as numbers, not strings
  decimalNumbers: true,
})
```

Run again: now it is `rating: 8.1`. Remember it in Assignment 1, where `price` is a `DECIMAL` that the JSON must give
as a number.

## 5. A placeholder for the value

Add a function to `film.js` that gives one film by its id. The id goes into the SQL as a `?`, with the value in an
array after the SQL:

```js
/**
 * The film with the id, or undefined if there is none.
 * @param {number} id
 * @returns {Promise<object|undefined>}
 */
export async function getFilm(id) {
  const [rows] = await pool.query('SELECT * FROM film WHERE id = ?', [id])
  return rows[0]
}
```

A `SELECT` always gives an array, also for one row or none; `rows[0]` is the film, or `undefined` when the array is
empty.

Write two more functions yourself in `film.js`, in the same way:

- `getDirectors()` gives all directors, sorted by name.
- `searchFilms(text)` gives the films whose title contains `text`, with `LIKE` as in 3-10. The `%` belong to the value,
  not the SQL: make the pattern `%${text}%` first, and give it as the value of the `?`.

<details>
<summary>A solution: <code>getDirectors()</code></summary>

```js
/**
 * All directors, sorted by name.
 * @returns {Promise<object[]>}
 */
export async function getDirectors() {
  const [rows] = await pool.query('SELECT * FROM director ORDER BY name')
  return rows
}
```

</details>

<details>
<summary>A solution: <code>searchFilms()</code></summary>

```js
/**
 * The films whose title contains the text.
 * @param {string} text
 * @returns {Promise<object[]>}
 */
export async function searchFilms(text) {
  const pattern = `%${text}%`
  const [rows] = await pool.query('SELECT * FROM film WHERE title LIKE ? ORDER BY title', [pattern])
  return rows
}
```

</details>

## 6. Insert a row

Add the last function to `film.js`. An `INSERT` gives no rows back, but a result with the `id` the database chose,
`insertId`. Several placeholders take their values in order:

```js
/**
 * Add a film, and give its new id.
 * @param {object} film with title, year, rating and director_id
 * @returns {Promise<number>}
 */
export async function addFilm({ title, year, rating, director_id }) {
  const [result] = await pool.query(
    'INSERT INTO film (title, year, rating, director_id) VALUES (?, ?, ?, ?)',
    [title, year, rating, director_id]
  )
  return result.insertId
}
```

`{ title, year, rating, director_id }` in the parameter list takes the keys out of the object it is given
(*destructuring*). Now try all the functions from `main.js`:

```js
import pool from './database.js'
import { getFilms, getFilm, getDirectors, searchFilms, addFilm } from './film.js'

const films = await getFilms()
console.log(`${films.length} films`)
for (const film of films) {
  console.log(`${film.year}  ${film.rating}  ${film.title} (${film.director})`)
}

console.log(await getFilm(1))
console.log(await getFilm(42))
console.log((await getDirectors()).map((director) => director.name))
console.log((await searchFilms('aw')).map((film) => film.title))

const id = await addFilm({ title: 'Barbie', year: 2023, rating: 6.8, director_id: 2 })
console.log(`Added film ${id}`)

await pool.end()
```

Load the data again, so it is the same as here, and run:

```bash
mariadb -u student -pP@ssw0rd film < practice/3-10/create.sql
node --env-file=practice/3-30/.env practice/3-30/main.js
```

### 6.1 All the functions

```text
6 films
1957  8.1  The Seventh Seal (Ingmar Bergman)
1957  8.1  Wild Strawberries (Ingmar Bergman)
1988  8.1  My Neighbor Totoro (Hayao Miyazaki)
2001  8.6  Spirited Away (Hayao Miyazaki)
2017  7.4  Lady Bird (Greta Gerwig)
2019  7.8  Little Women (Greta Gerwig)
{
  id: 1,
  title: 'Spirited Away',
  year: 2001,
  rating: 8.6,
  director_id: 1
}
undefined
[ 'Greta Gerwig', 'Hayao Miyazaki', 'Ingmar Bergman' ]
[ 'Spirited Away', 'Wild Strawberries' ]
Added film 7
```

`'aw'` finds `Spirited Away` too: `LIKE` does not care about upper and lower case here. Run the program once more
without loading the data: Barbie is added again, as film 8. Each run changes the database; load `create.sql` to start
over.

## 7. SQL injection

Every function in `film.js` takes its values through a `?`. Here you see why: what the same query does when the
value is pasted into the SQL instead. Create `practice/3-30/injection.js`, which takes an id from the command line and
asks for the film in both ways:

```js
import pool from './database.js'

const id = process.argv[2] ?? '1'

// Wrong: the value becomes part of the SQL
const [unsafe] = await pool.query(`SELECT id, title FROM film WHERE id = ${id}`)
console.log('Pasted into the SQL:', unsafe)

// Right: the value goes through a placeholder
const [safe] = await pool.query('SELECT id, title FROM film WHERE id = ?', [id])
console.log('With a placeholder:', safe)

await pool.end()
```

First as intended, then with an id that is not only an id:

```bash
node --env-file=practice/3-30/.env practice/3-30/injection.js 2
node --env-file=practice/3-30/.env practice/3-30/injection.js "0 OR 1=1"
```

### 7.1 The injection

```text
Pasted into the SQL: [
  { id: 1, title: 'Spirited Away' },
  { id: 2, title: 'My Neighbor Totoro' },
  { id: 3, title: 'Lady Bird' },
  { id: 4, title: 'Little Women' },
  { id: 5, title: 'The Seventh Seal' },
  { id: 6, title: 'Wild Strawberries' }
]
With a placeholder: []
```

Your list also has the films that `main.js` added. Pasted in, the SQL became `WHERE id = 0 OR 1=1`, which is true for
every row: the input changed the query. Through the placeholder, the whole input is one value, the text
`'0 OR 1=1'`, and no film has that id. The same trick with a `DELETE` or a login would remove every row or let anyone
in. That is SQL injection, one of the most common security holes on the web, and the placeholder is what stops it.

> **Any value from outside is input.** The command line here, the URL and the body of a request in week 4. Every one
> of them goes into the SQL through a `?`. Names of tables and columns cannot be placeholders; write those in the SQL
> yourself, never from input.

## Check and commit

The functions in `film.js` have no tests in `npm run check` this week: such tests need the database running, and
`npm run check` must pass without it. You tested them by hand with `main.js`. Run the check and commit:

```bash
npm run check
git status -u
git add package.json package-lock.json practice/3-30
git commit -m "3-30 Node.js and MariaDB with mysql2"
```

Check in the output of `git status -u` that `.env` is not in the list, before you `git add`. If you have a remote of
your own, push with `git push`.

### Verify

- [ ] `main.js` prints the films with their directors, one film, the directors and a search, and adds a film.
- [ ] `rating` is a number, not a string.
- [ ] `.env.example` is committed, `.env` is not.
- [ ] Every value in the SQL of `film.js` goes through a `?`.
- [ ] You can explain with `injection.js` what SQL injection is and how the placeholder stops it.
- [ ] You can say why the program hangs without `pool.end()`.

An error from the database, such as `ECONNREFUSED`, `Access denied` or `Unknown database`, or
`.env: not found`: see "The database" in [Troubleshooting](../doc/troubleshooting.md#the-database).

<details>
<summary><code>Cannot find package 'mysql2'</code></summary>

Run `npm install mysql2` in the root of your repo, where `package.json` is.

</details>

## Read more

- `mysql2`, the documentation, with the promise API and `createPool()`: https://sidorares.github.io/node-mysql2/docs
- The flag `--env-file` in Node.js: https://nodejs.org/api/cli.html#--env-filefile
- SQL injection, from OWASP: https://owasp.org/www-community/attacks/SQL_Injection
- Destructuring: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring
