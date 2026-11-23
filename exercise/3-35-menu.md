# 3-35 A terminal program: commands for the film database

You build a program for the terminal that shows and adds films in the database, with commands such as `film list` and
`film show 1`. You use the package `@dbwebb/tui`, which gives you the prompt, the help, the command history and a way
to run the commands from a file. You write the commands, each one an `async` method that calls a function in
`film.js` from 3-30 and returns the text to print.

That shape is on purpose: in week 4 the same functions are called from Express routes, and a command such as
`film show 1` becomes the route `GET /api/films/1`.

You need 3-30 done, with its `.env`, and MariaDB running. When you are done, your repo has:

```
practice/3-35/
├── cli.js            starts the program and registers the commands
├── commands/
│   ├── director.js   the command group director
│   └── film.js       the command group film
└── commands.txt      commands to run from a file
```

## Background: commands, groups and arguments

A command line has a *group*, an *action* and the *arguments*, separated by spaces:

```text
film show 1
│    │    └── the arguments: ['1']
│    └── the action: the method show()
└── the group: an object of the class FilmCommands
```

A group is a class that extends `BaseCommand` from the package; each of its methods is an action. The method gets the
arguments as strings, and returns a string, which the program prints. The package does the rest: it reads the line,
finds the group and the method, calls it, prints the answer, and shows the help.

`@dbwebb/tui` is written by the teacher of the course, and is used here because it lets you write only the commands.
A menu written from scratch with `node:readline` needs a loop, a `switch` and its own help, which this package
already has. The docs are on its npm page, linked at the end.

## 1. Install the package

In the root of your repo:

```bash
npm install @dbwebb/tui
```

## 2. The first command group

Create `practice/3-35/commands/director.js` with a group that has one action, `list`:

```js
import { BaseCommand } from '@dbwebb/tui'
import { getDirectors } from '../../3-30/film.js'

export class DirectorCommands extends BaseCommand {
  static descriptions = {
    list: 'list            All directors',
  }

  async list() {
    const directors = await getDirectors()
    let output = ''
    for (const director of directors) {
      output += `${director.id}  ${director.name}, ${director.country}\n`
    }
    return output.trimEnd()
  }
}
```

- The import of `getDirectors()` goes to the module from 3-30, two directories up. The SQL stays there; the command
  only turns the rows into text.
- `static descriptions` is the help text of each action.
- The loop adds one line per director to the string `output`; `\n` ends each line. `trimEnd()` removes the last `\n`,
  so the program prints no empty line after the list.

Create `practice/3-35/cli.js`, which registers the group under the name `director` and starts the program:

```js
import os from 'node:os'
import path from 'node:path'
import { CommandRegistry, TuiShell } from '@dbwebb/tui'
import { DirectorCommands } from './commands/director.js'

const registry = new CommandRegistry()
registry.register('director', new DirectorCommands())

new TuiShell(registry, {
  welcomeMessage: 'The film database',
  historyFile: path.join(os.homedir(), '.dbwtui', 'film_history'),
}).start()
```

- `historyFile` saves the commands you type in a file in your home directory, so the arrow up gives you the
  commands from the last time you ran the program too. `os.homedir()` and `path.join()` give the right path on
  Windows, macOS and Linux.

Start it with the `.env` from 3-30, which has the settings of the database:

```bash
node --env-file=practice/3-30/.env practice/3-35/cli.js
```

Type `help` to see the commands. Then type `director list`, and `q` to quit:

```text
The film database
Type "help" or "?" to see available commands, "exit" to quit.
> director list
2  Greta Gerwig, USA
1  Hayao Miyazaki, Japan
3  Ingmar Bergman, Sweden
> q
Bye.
```

Try the arrow keys up and down, for the commands you typed before, and the `Tab` key, which completes a command you
have started to type.

The program does not call `pool.end()`: it ends the whole process when you quit, and the connections go with it.

## 3. The film commands

Create `practice/3-35/commands/film.js` with the group `film`. It starts with two actions, `list` and `show`:

```js
import { BaseCommand } from '@dbwebb/tui'
import { getFilms, getFilm, searchFilms, addFilm } from '../../3-30/film.js'

/** Turn a string from the command line into an id, or undefined if it is not a whole number. */
function toId(value) {
  return /^\d+$/.test(value ?? '') ? Number(value) : undefined
}

export class FilmCommands extends BaseCommand {
  static descriptions = {
    list: 'list            All films, with their director',
    show: 'show <id>       One film',
    search: 'search <text>   Films whose title contains the text',
    add: 'add ...         Add a film: <title> <year> <rating> <director_id>',
  }

  async list() {
    const films = await getFilms()
    let output = ''
    for (const film of films) {
      output += `${film.id}  ${film.year}  ${film.rating}  ${film.title} (${film.director})\n`
    }
    return output.trimEnd()
  }

  async show(value) {
    const id = toId(value)
    if (id === undefined) {
      return this.fail('Usage: film show <id>, where id is a whole number')
    }
    const film = await getFilm(id)
    if (!film) {
      return this.fail(`Film ${id} not found`)
    }
    return `${film.id}  ${film.title}, ${film.year}, rating ${film.rating}, director ${film.director_id}`
  }
}
```

- The argument is a string, `'1'`. `toId()` checks that it is a whole number and turns it into one, the same check as
  `toId()` in the routes of your to-do API in 2-50.
- `this.fail()` tells the package that the command did not succeed: the message is printed in red, and it counts as a
  failure when the commands come from a file (step 5).

Register the group in `cli.js`, next to `director`:

```js
import { FilmCommands } from './commands/film.js'
```

```js
registry.register('film', new FilmCommands())
```

Restart the program and try `film list`, `film show 1`, `film show 42` and `film show abc`. Type only `film` to see
the help of the group.

### 3.1 Search and add

Write the two last actions yourself, in the class `FilmCommands`:

- `search(text)` gives the id and title of the films that `searchFilms(text)` finds, one per line. Without a text it
  fails with a usage message. When nothing matches, it returns `this.warn(...)` with a message: a warning, not an
  error, since a search with no match is not wrong.
- `add(title, year, rating, directorId)` adds the film with `addFilm()` and answers `Added film 7: Barbie`, with the
  new id. Without a title, or with a director id that is not a whole number, it fails with a usage message. The year
  and the rating are strings too: turn them into numbers with `Number()`.

<details>
<summary>A solution</summary>

```js
  async search(text) {
    if (!text) {
      return this.fail('Usage: film search <text>')
    }
    const films = await searchFilms(text)
    if (films.length === 0) {
      return this.warn(`No film matches "${text}"`)
    }
    let output = ''
    for (const film of films) {
      output += `${film.id}  ${film.title}\n`
    }
    return output.trimEnd()
  }

  async add(title, year, rating, directorId) {
    if (!title || toId(directorId) === undefined) {
      return this.fail('Usage: film add <title> <year> <rating> <director_id>')
    }
    const id = await addFilm({
      title,
      year: Number(year),
      rating: Number(rating),
      director_id: Number(directorId),
    })
    return `Added film ${id}: ${title}`
  }
```

</details>

## 4. Arguments with spaces

The line is split on spaces, so `film add Free Guy 2021 7.1 2` gives the title `Free`, the year `Guy` and the
director id `7.1`, and `add` fails with its usage message. Put an argument with spaces in quotes:

```text
> film add "The Wind Rises" 2013 7.7 1
Added film 7: The Wind Rises
> film search wind
7  The Wind Rises
```

## 5. Commands from a file

The program can also read the commands from a file instead of the keyboard. Create `practice/3-35/commands.txt`:

```text
# Commands for the film database, one per line
film list
film show 1
film show 42
director list
film search aw
```

Load the data again first, so the films are the six from 3-10 and not the ones you added in 3-30 and step 4. Then
send the file to the program with `<`, as with the SQL files in 3-10, and look at the exit code with `echo $?`:

```bash
mariadb -u student -pP@ssw0rd film < practice/3-10/create.sql
node --env-file=practice/3-30/.env practice/3-35/cli.js < practice/3-35/commands.txt
echo $?
```

### 5.1 The commands from the file

```text
> film list
5  1957  8.1  The Seventh Seal (Ingmar Bergman)
6  1957  8.1  Wild Strawberries (Ingmar Bergman)
2  1988  8.1  My Neighbor Totoro (Hayao Miyazaki)
1  2001  8.6  Spirited Away (Hayao Miyazaki)
3  2017  7.4  Lady Bird (Greta Gerwig)
4  2019  7.8  Little Women (Greta Gerwig)

> film show 1
1  Spirited Away, 2001, rating 8.6, director 1

> film show 42
Film 42 not found

> director list
2  Greta Gerwig, USA
1  Hayao Miyazaki, Japan
3  Ingmar Bergman, Sweden

> film search aw
1  Spirited Away
6  Wild Strawberries

4 ok, 0 warn, 1 failed
```

(The output above has `> ` before each command; on your screen the command is in bold.) The last line counts the
commands, and since one failed, `echo $?` prints `1`: the exit code that tells a script that something went wrong.
Remove the line `film show 42` and run again: `4 ok, 0 warn, 0 failed`, and the exit code is `0`.

### 5.2 Why a file of commands

`commands.txt` is a test of your program, written once and run as often as you like:

- **The same commands every time.** After a change in `film.js` or a command, run the file and see that all the
  commands still answer as before, not only the one you just changed. Typing them by hand, you soon try only a few.
- **The same data every time.** Load `create.sql` first, and the answers are the same on each run, so a difference
  in the output means that the code changed something.
- **Errors you meant.** `film show 42` is in the file on purpose: an error message is an answer too, and it should
  stay the right one. Keep a line for each error your commands handle.
- **A script can check it.** The exit code says if all went well, without anyone reading the output. That is how a
  test program, or a teacher grading your assignment, runs your commands.

Add a line to `commands.txt` each time you write a new command, and run the file before you commit.

## Check and commit

```bash
npm run check
git add package.json package-lock.json practice/3-35
git commit -m "3-35 A terminal program with commands for the film database"
```

If you have a remote of your own, push with `git push`.

### Verify

- [ ] `film list`, `film show <id>`, `film search <text>`, `film add ...` and `director list` work in the program.
- [ ] `film show abc` and `film show 42` fail with a message, and do not crash the program.
- [ ] `commands.txt` runs with `<`, and you can say what the exit code tells.
- [ ] You can say which part of the program has the SQL, and what a command does with the rows.

`ECONNREFUSED` or `Access denied` after a command: start the program with `--env-file=practice/3-30/.env`, and see
"The database" in [Troubleshooting](../doc/troubleshooting.md#the-database).

<details>
<summary><code>"list" is not a valid action</code> or <code>Unknown command: "film"</code></summary>

The group is not registered, or under another name. Check the line `registry.register('film', new FilmCommands())` in
`cli.js`, and that the method is in the class and is `async`.

</details>

<details>
<summary><code>Cannot find module '.../3-30/film.js'</code></summary>

The import path is relative to the file it is in. From `practice/3-35/commands/` it is two levels up to `practice/`:
`'../../3-30/film.js'`.

</details>

<details>
<summary>The program prints <code>undefined</code> or <code>[object Object]</code></summary>

The method returns a row or an array of rows, not a string. Build the text with a template string, and a loop as in
`director list` for several rows.

</details>

## Read more

- `@dbwebb/tui`, the README, with the help texts, `--file`, `--json` and `ask()` for questions in several steps:
  https://www.npmjs.com/package/@dbwebb/tui
- Classes and `extends`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
- `for...of`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of
- Exit codes in the shell, `$?`: https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html
