# 3-05 MariaDB: a user for the course

You log in to your MariaDB as its administrator, `root`, and create the user that the rest of the course works with:
`student`. Then you log in as `student`. From 3-10 on you work with databases, from the terminal and from Node.js.

You need MariaDB first. Install it as [Install MariaDB](../doc/mariadb-install.md) says, or, if you already use
Docker, run it in a container as [MariaDB in Docker](../doc/mariadb-docker.md) says. A MySQL you already have works
too (see the end of [Install MariaDB](../doc/mariadb-install.md#mysql-instead)).

This is what you end up with:

| What | Name |
|---|---|
| The database server, on port `3306` | MariaDB |
| The client, the program you talk to the server with | `mariadb`, in your terminal |
| The database server's own administrator | `root` |
| A user for the course | `student`, password `P@ssw0rd` |

The course is built on this user: create it with exactly the name `student` and the password `P@ssw0rd`. The
commands in the exercises use them, and so do the `.env` files from 3-30 on. It is a password for a database on your
own computer only; never use it anywhere else.

## 1. Log in as root

Open the client as root, the way your installation does it:

| MariaDB | Log in as root |
|---|---|
| Installed on Windows | `mariadb -u root -p`, and the root password you chose in the installer |
| Installed on macOS or Linux | `sudo mariadb` |
| In Docker | `docker compose exec mariadb bash` first, then `mariadb -u root -p` in the container |

Nothing shows while you type a password. You get the prompt `MariaDB [(none)]>`. Try a first SQL statement; each
statement ends with `;`:

```sql
SELECT VERSION();
SHOW DATABASES;
```

The list has the databases MariaDB keeps for itself, such as `mysql` and `information_schema`.

## 2. Create a user for the course

Still logged in as root, create the user `student` and give it all rights:

```sql
CREATE USER 'student'@'%' IDENTIFIED BY 'P@ssw0rd';
CREATE USER 'student'@'localhost' IDENTIFIED BY 'P@ssw0rd';
GRANT ALL PRIVILEGES ON *.* TO 'student'@'%';
GRANT ALL PRIVILEGES ON *.* TO 'student'@'localhost';
```

- A user in MariaDB is a name *and* the host it connects from: `'student'@'%'` connects from anywhere (`%`), and
  `'student'@'localhost'` from your own computer. You create both, with the same password. Some installations have an
  *anonymous* user for `localhost`, with no name, that MariaDB would otherwise choose before `'student'@'%'` when you
  connect from your own computer, and you would get `Access denied`. With `'student'@'localhost'` it works
  everywhere.
- `ON *.*` gives the user all rights on all databases, so it can create the databases of the exercises and the
  assignments itself. That is fine on your own computer, never on a real server.

Log out with `exit`.

## 3. Log in as student

```bash
mariadb -u student -p
```

Type the password `P@ssw0rd`. Check who you are and what you see:

```sql
SELECT CURRENT_USER();
SHOW DATABASES;
```

`CURRENT_USER()` answers `student@localhost`: you connected from your own computer. Log out with `exit`. You
create your first database in 3-10.

The server runs in the background, also when no client is connected, and starts with your computer. If a login says
`Can't connect to server`, start it: see "Start and stop the server" in
[Install MariaDB](../doc/mariadb-install.md#start-and-stop-the-server), or `docker compose start` in Docker.

## Check and commit

This exercise changes no code in your repo, unless you added a `compose.yaml` for Docker. Start your report for the
week: write a few lines in `report/week-03.md` about how the installation went (you add to it later in the week), and
commit:

```bash
git add report/week-03.md
git commit -m "3-05 MariaDB"
```

With Docker, add `compose.yaml` to the commit too.

### Verify

- [ ] You can log in with `mariadb -u student -p`, also after a restart of your computer.
- [ ] `SELECT CURRENT_USER();` answers `student@localhost`.
- [ ] You can say what the server and the client are, and why the course uses `student` and not `root`.

<details>
<summary>The client shows no prompt, or the password cannot be typed, in Git Bash</summary>

Put `winpty` in front of the command, when the client is interactive:

```bash
winpty mariadb -u student -p
```

</details>

<details>
<summary><code>ERROR 1396 (HY000): Operation CREATE USER failed for 'student'@...</code></summary>

The user is there already, maybe from an earlier try. Remove both, as root, and run the four lines of step 2 again:

```sql
DROP USER IF EXISTS 'student'@'%', 'student'@'localhost';
```

</details>

<details>
<summary><code>Access denied for user 'student'@'localhost'</code></summary>

Check the password: `P@ssw0rd`, with a capital `P` and a zero. Then check, as root, that both users are there:

```sql
SELECT user, host FROM mysql.user WHERE user = 'student';
```

If one is missing, do as in the box above.

</details>

## Read more

- The recorded lecture 4 in Canvas, on databases and schemas. Lecture 5 installs MySQL, which works the same way.
- `CREATE USER` and `GRANT` in MariaDB: https://mariadb.com/docs/server/reference/sql-statements/account-management-sql-statements
