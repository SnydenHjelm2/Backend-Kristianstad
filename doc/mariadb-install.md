# Install MariaDB

From week 3 the course works with a relational database, MariaDB. This article installs it on your computer, so that
you can do exercise [3-05](../exercise/3-05-mariadb.md), where you create the user of the course. Do it before the
Friday of week 3.

Would you rather not install a database server on your computer? If you already use Docker, run MariaDB in a
container instead: [MariaDB in Docker](mariadb-docker.md). Already have MySQL? See [MySQL instead](#mysql-instead)
at the end.

## A database server and a client

MariaDB comes in two parts, and it helps to keep them apart:

- The **server** is a program that runs in the background, all the time, and keeps the databases. It listens on a
  port, `3306`, for anyone who wants to talk to it. You do not see it; it has no window.
- A **client** connects to the server, sends it SQL and shows the answer. The client of MariaDB is the command
  `mariadb`, which you run in your terminal. From 3-30 on, your Node.js program is a client too: it connects to the
  same server, on the same port.

When you install MariaDB you get both. The server is set up to start when your computer starts, so it is there when
you need it.

MariaDB is a relational database that speaks SQL. It started as a copy of MySQL and works the same way for everything
we do in the course, so where a text or a package says MySQL, it works with MariaDB too. The assignments are run with
MariaDB.

Install the latest **LTS** version (long-term support): it gets fixes for years, and it is what the course is tested
with. MariaDB also has newer versions with shorter support; you do not need them.

## Windows

MariaDB has an installer for Windows, an MSI package, that installs both the server and the client, and sets the
server up as a Windows *service*: a program that Windows starts in the background when the computer starts.

1. Go to https://mariadb.org/download/. Choose the latest version marked **LTS**, the operating system **Windows**,
   the architecture **x86_64** and the package type **MSI Package**, and download it.
2. Run the downloaded file. Accept the license, and keep the features that are chosen in *Custom Setup*.
3. **User settings:** choose a password for `root`, the administrator of the database server, and type it twice.
   Remember it: you need it in 3-05. Leave *Enable access from remote machines for 'root' user* unticked, so root can
   only log in from your own computer. Tick *Use UTF8 as default server's character set*, so that letters such as
   å, ä and ö are stored as they are.
4. **Default instance properties:** keep *Install as service* with the service name `MariaDB`, *Enable networking*
   and the TCP port `3306`. Windows may ask whether MariaDB may use the network; allow it on private networks.
5. Install, and finish.

The installer also gives you **HeidiSQL**, a program with windows where you can look at your databases. The course
uses the terminal, but HeidiSQL is good for looking around.

The installer adds the folder with the commands of MariaDB to the list of folders where your terminal looks for
commands, `PATH`. A terminal reads that list when it starts, so **close Git Bash and open a new one**. Then check that
it finds the client:

```bash
mariadb --version
```

It answers with the version, something like `mariadb from 12.3.3-MariaDB`. If it says `command not found`, see
[Troubleshooting](#troubleshooting).

## macOS

On macOS you install MariaDB with Homebrew, the package manager most developers on a Mac use. If you do not have it,
install it first, as https://brew.sh/ says, and follow what it prints at the end about adding `brew` to your `PATH`.

Then install MariaDB, and start the server:

```bash
brew install mariadb
brew services start mariadb
```

`brew services start` starts the server now, and again each time you log in to your Mac. Check that it runs, and that
your terminal finds the client:

```bash
brew services list
mariadb --version
```

`brew services list` shows `mariadb` with the status `started`.

## Linux

On Ubuntu and Debian, also in WSL on Windows, MariaDB is a package:

```bash
sudo apt update
sudo apt install mariadb-server
```

The package starts the server right away, and each time the computer starts. Check that it runs, and that your
terminal finds the client:

```bash
systemctl status mariadb
mariadb --version
```

`systemctl status` says `active (running)`; press `q` to leave it. In WSL without systemd, start the server with
`sudo service mariadb start` instead.

On other distributions, the package is also called `mariadb-server` or `mariadb`; see
https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/installing-mariadb.

## Start and stop the server

The server starts with your computer, so you seldom need to think about it. But if the client says
`Can't connect to server`, or Node.js says `ECONNREFUSED`, the server is not running. Start it:

| System | Start the server | Stop it |
|---|---|---|
| Windows | In *Services* (search for it in the Start menu), right-click `MariaDB` and choose *Start* | *Stop* |
| macOS | `brew services start mariadb` | `brew services stop mariadb` |
| Linux | `sudo systemctl start mariadb` | `sudo systemctl stop mariadb` |

You can also stop it when you do not use it, to save memory, and start it when you work with the course.

## Log in as root

The administrator of the server is called `root`. You log in as root when you create users and give them rights, as
in 3-05; the rest of the course uses the user you create there.

- **Windows:** with the root password you chose in the installer. Type the password when the client asks; nothing
  shows while you type:

  ```bash
  mariadb -u root -p
  ```

- **macOS and Linux:** root has no password. It logs in as the administrator of your computer instead, so you start
  the client with `sudo` and type the password of your computer, if `sudo` asks for it:

  ```bash
  sudo mariadb
  ```

You get the prompt `MariaDB [(none)]>`. Log out with `exit`. Now go on with exercise
[3-05](../exercise/3-05-mariadb.md).

## MySQL instead

If you already have MySQL installed, you may use it: it works the same way for what we do in the course. Keep it
running and go on with 3-05. The client is called `mysql` instead of `mariadb`, so write `mysql` wherever the
exercises write `mariadb`.

The assignments are run with MariaDB, so write your SQL files by hand, as the exercises do, and do not export them
from MySQL Workbench: a MySQL 8 export has a `COLLATE` that MariaDB does not know.

Do not install both MariaDB and MySQL: they both want port 3306.

## Troubleshooting

<details>
<summary><code>mariadb: command not found</code> in Git Bash</summary>

Close Git Bash and open a new one: it reads `PATH` when it starts. If it is still not found, the installer did not add
MariaDB to it. Look up the folder in `C:\Program Files`, its name has the version number, and add a line like this
last in the file `~/.bashrc`, with your version:

```bash
export PATH="$PATH:/c/Program Files/MariaDB 12.3/bin"
```

Then open a new Git Bash.

</details>

<details>
<summary>The client shows no prompt, or the password cannot be typed, in Git Bash</summary>

Put `winpty` in front of the command, when the client is interactive:

```bash
winpty mariadb -u root -p
```

</details>

<details>
<summary><code>Can't connect to server on 'localhost'</code></summary>

The server is not running; start it as in [Start and stop the server](#start-and-stop-the-server). On Windows, if the
service `MariaDB` is missing, the installer did not install it as a service: run the installer again, choose *Change*,
and tick *Install as service*.

</details>

<details>
<summary>The installer says the port 3306 is in use</summary>

Another database server already runs on your computer, often a MySQL installed earlier. Use it (see
[MySQL instead](#mysql-instead)), or uninstall it before you install MariaDB.

</details>

<details>
<summary><code>Access denied for user 'root'@'localhost'</code>: forgot the root password (Windows)</summary>

If you can already log in as `student` (3-05), you have all you need for the course. Otherwise uninstall MariaDB,
remove the folder `C:\Program Files\MariaDB ...` with its data, and install again.

</details>

## Read more

- Installing MariaDB: https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/installing-mariadb
- The recorded lecture 5 in Canvas installs MySQL, which works the same way.
