# Assignment 1: products and suppliers, in the terminal and as a JSON API

You build the backend of a small inventory: products and the suppliers that deliver them. The data lives in a
relational database. A terminal program with commands adds and shows products, and an Express server gives the
products as JSON.

The deadline and the hand-in are in Canvas.

## Where and how

You solve the assignment in your own course repo. Create the directory `assignment/a1/` and these files and
directories in it, with exactly these names, since your solution is tested and graded from them:

```
assignment/a1/
├── README.md       how to set up and run your solution, in a few lines
├── report.md       your report
├── .env.example    the variables your app needs, without your own secrets
├── db/
│   └── create.sql  creates the tables and fills them with data
├── cli.js          the terminal program
├── commands.txt    commands to run the terminal program with
├── app.js          the Express server
└── src/            your own modules (database connection, queries, routes); name them as you like
```

Other files may go in `assignment/a1/` too, for example an image that your report shows.

The app reads these variables from `.env`; use exactly these names, since we run your solution with our own
`.env`:

```
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=student
DB_PASSWORD=
DB_DATABASE=a1
```

`.env.example` has the same lines, with a placeholder instead of your password, and is committed. Your own `.env` is a
copy of it with your values, and is not committed.

Add two scripts to the `package.json` in the root of your repo:

```json
"a1": "node --env-file=assignment/a1/.env assignment/a1/app.js",
"a1:cli": "node --env-file=assignment/a1/.env assignment/a1/cli.js"
```

Then `npm run a1` starts the server, on `PORT` from `.env`, and `npm run a1:cli` the terminal program.

## The database

We run your solution with MariaDB (the LTS version, as in the exercises). MySQL works too, but `create.sql` must
load in MariaDB: write it by hand, without a `COLLATE` from MySQL 8.

Create the database `a1` yourself, as the user `student`; `db/create.sql` does not create it. Then load the file into
it. It drops the tables first (`DROP TABLE IF EXISTS`), so it can be loaded again to reset the data. It has two
tables:

| Table | Columns |
|---|---|
| `supplier` | `id`, `name`, `email` |
| `product` | `id`, `name`, `description`, `price`, `quantity`, `supplier_id` (a foreign key to `supplier`) |

The data: at least 2 suppliers, with id 1 and 2, and at least 5 products, where both suppliers deliver at least one
product. Make the products up yourself.

## Requirements for G

- [ ] `db/create.sql` creates both tables, with primary keys and the foreign key, and fills them as above.
- [ ] `cli.js` is a terminal program built with `@dbwebb/tui`, with these commands:

  | Command | Does |
  |---|---|
  | `product list` | lists all products with the name of their supplier (a JOIN), one per line |
  | `product show <id>` | shows one product, with the name of its supplier |
  | `product add <name> <description> <price> <quantity> <supplier_id>` | adds a product and prints its new id |
  | `supplier list` | lists all suppliers |

  An argument with spaces is written in quotes: `product add "Claw hammer" "500 g, steel" 129 40 1`.

  These fail with a message (`this.fail()`), without crashing the program:
  - a product that does not exist,
  - an id that is not a whole number,
  - an `add` with too few arguments, or with a supplier that does not exist.

  How the output looks is up to you.
- [ ] `commands.txt` runs every command at least once, and at least one that fails, with
  `npm run a1:cli --silent < assignment/a1/commands.txt`.
- [ ] `app.js` answers with JSON on these routes:

  | Route | Answer |
  |---|---|
  | `GET /api/products` | all products, as an array |
  | `GET /api/products/:id` | one product |
  | `GET /api/products/:id/supplier` | the supplier of the product |
  | `GET /api/suppliers` | all suppliers, as an array |

  A product has the keys `id`, `name`, `description`, `price`, `quantity` and `supplier_id`, and a supplier `id`,
  `name` and `email`, as in the tables. `price` and `quantity` are numbers in the JSON, not strings:

  ```json
  { "id": 1, "name": "Hammer", "description": "Claw hammer, 500 g", "price": 129, "quantity": 40, "supplier_id": 1 }
  ```

- [ ] Every SQL query that uses a value from the user has placeholders (`?`), never a value pasted into the SQL string.
- [ ] The code uses MariaDB (or MySQL) with `mysql2/promise`, `async`/`await`, ES modules and Express 5.
- [ ] The database settings come from `.env`, with the names above; `.env.example` shows them, without your password.
- [ ] `package.json` in the root of your repo has the scripts `a1` and `a1:cli` as above.
- [ ] `README.md` says how to create the database and run your solution.
- [ ] `npm run check` passes for your whole repo (ESLint, Prettier and the tests).
- [ ] `report.md` covers the points under [Report](#report).

## Requirements for VG

All of G, and:

- [ ] `GET /api/products` filters with the query string: `?supplier_id=1` gives the products of supplier 1, and
  `?max_quantity=5` the products with a quantity of 5 or less (time to order more). The two work together.
- [ ] Errors are answered with a status code and JSON with an error message, `{ "error": "Product 42 not found" }`:
  - 404 for a product that does not exist, also on `/supplier`.
  - 400 for an id or a filter value that is not a whole number of 0 or more (`/api/products/abc`, `?max_quantity=many`).
  - A filter that matches nothing, for example `?supplier_id=99`, is not an error: it gives `[]`.
- [ ] Your report explains how the placeholders protect against SQL injection, with an example from your code.

## Report

`report.md` is about one A4 page:

- What went well, and what would you do differently next time?
- Your database: the two tables and how they are related (a screenshot of `SHOW CREATE TABLE` or a drawing).
- For VG: the part on SQL injection.

## Check your solution

`exercise/check/a1.bash` checks a part of the requirements: that the files are where they should be, that the terminal
program runs `commands.txt`, that the routes answer as they should, for G and for VG, and that `npm run check` passes.

Start MariaDB, load `db/create.sql`, and run the script from the root of your repo:

```bash
bash exercise/check/a1.bash
```

It starts your server on a port of its own and stops it again when it is done. It changes none of your files, but the
`product add` in `commands.txt` adds a product: load `db/create.sql` again to reset the data.

The script does not grade your solution: the code and the report are looked at too, so go through the requirements
again before you hand in.

## Grading

Assignment 1 is graded U, G or VG:

- **G**: every requirement for G is met.
- **VG**: every requirement for G and for VG is met.
- **U**: something that G requires is missing. You get feedback on what, and hand in again.

Together with Assignment 2 it makes up module 2 of the examination, the programming assignments, graded U/G/VG. VG on
the course requires VG on module 2.

## Hand in

1. Commit, and tag your solution: `git tag a1`. If you have a remote of your own, `git push --tags` too.
2. In Canvas, hand in either the link to your repo (if it is on GitHub or GitLab, open to the teacher), or a zip made
   from the tag:

   ```bash
   git archive -o a1.zip a1
   ```

If you hand in again after feedback, move the tag to your latest commit with `git tag -f a1`, and hand in again. If you
have a remote of your own, replace the tag there too with `git push -f --tags`.
