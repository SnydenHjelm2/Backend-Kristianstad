# MariaDB in Docker, with Docker Compose

[Install MariaDB](mariadb-install.md) installs MariaDB as an ordinary program. If you already use Docker, you can run
MariaDB in a container instead. It is the same database server, on the same port, so everything in the course works
the same way. Only one thing differs: you open a terminal *in the container*, and run the commands of the exercises
there, as they are written.

Docker Compose starts the container from a file, `compose.yaml`, that says everything about it: the image, the port,
where the data is kept, and which files the container sees. You write the file once, and start and stop the database
with short commands.

## What you need

Docker with Docker Compose: Docker Desktop on Windows and macOS, Docker Engine and its Compose plugin on Linux
(https://docs.docker.com/get-started/get-docker/). Check that both work:

```bash
docker --version
docker compose version
```

Nothing else may use port 3306 on your computer: stop a MariaDB or MySQL you installed earlier, or remove it.

## The file `compose.yaml`

Create `compose.yaml` in the root of your repo, with this content. Choose your own root password instead of
`MyRootPassword`:

```yaml
# MariaDB for the course: start it with docker compose up -d
name: mariadb

services:
  mariadb:
    image: mariadb:lts
    restart: unless-stopped
    environment:
      MARIADB_ROOT_PASSWORD: MyRootPassword
    ports:
      - "127.0.0.1:3306:3306"
    volumes:
      - data:/var/lib/mysql
      - .:/repo:ro
    working_dir: /repo

volumes:
  data:
```

| Part | Means |
|---|---|
| `name: mariadb` | The name of the project, and the start of the names of its container and volume |
| `image: mariadb:lts` | The official MariaDB image, the latest long-term support version, from https://hub.docker.com/_/mariadb |
| `restart: unless-stopped` | The container starts again with Docker, after a restart of your computer, until you stop it |
| `MARIADB_ROOT_PASSWORD` | The password of `root`, the administrator. It is set the first time only, when the volume is empty |
| `ports` | Port 3306 on your computer leads to the server in the container, so Node.js reaches it. `127.0.0.1`: only your own computer can connect |
| `data:/var/lib/mysql` | The databases are kept in the volume `data`, outside the container, so they survive when the container is removed |
| `.:/repo:ro` | Your repo is seen in the container as `/repo`, read-only, so the client there can read your SQL files |
| `working_dir: /repo` | A terminal in the container starts in your repo, as yours does on your computer |

Commit the file, so it follows your repo to another computer. The password in it is for a database on your own
computer only.

## Start the server

From the root of your repo:

```bash
docker compose up -d
```

The first time, Docker downloads the image and the server sets itself up, which takes a little while. See that it
runs, and what it says:

```bash
docker compose ps
docker compose logs mariadb
```

Wait for `ready for connections` in the log.

## A terminal in the container

Open a terminal in the container, from the root of your repo:

```bash
docker compose exec mariadb bash
```

The prompt changes to something like `root@3f2a9c1b7d4e:/repo#`. You are in the container now, in your repo, and the
client `mariadb` is here. Run the commands of the exercises as they are written, for example to log in as root in
3-05:

```bash
mariadb -u root -p
```

Leave the terminal in the container with `exit`.

Keep two terminals open while you work: one in the container, for the client and your SQL files, and one on your
computer, for `npm`, `node` and `git`. The container sees your files but cannot change them, and the Node.js programs
of the course run on your computer and connect to the server through the port.

## Stop, start and remove

```bash
docker compose stop     # stop the server
docker compose start    # start it again, with the same data
docker compose ps       # is it running?
docker compose down     # remove the container; the data stays in the volume
docker compose up -d    # a new container, with the data from the volume
```

Only if you want to throw away all the data too, the user of the course with it, and start over from an empty server:

```bash
docker compose down -v
```

On Windows and macOS, Docker Desktop must be running for the database to run. You can let it start when you log in,
in its settings.

## Troubleshooting

<details>
<summary><code>no configuration file provided: not found</code></summary>

`docker compose` looks for `compose.yaml` where you stand and in the directories above. Go to the root of your repo.

</details>

<details>
<summary><code>Bind for 127.0.0.1:3306 failed: port is already allocated</code></summary>

Something else uses port 3306, often a MariaDB or MySQL you installed earlier, or an old container. `docker ps`
shows the running containers. Stop the other one, or use it instead and remove the container with
`docker compose down`.

</details>

<details>
<summary><code>the input device is not a TTY</code> in Git Bash</summary>

Put `winpty` first: `winpty docker compose exec mariadb bash`.

</details>

<details>
<summary>The container does not see a file, or sees an old version of it</summary>

The container sees the repo where `compose.yaml` is. Check that you stand in `/repo`, and that the path is relative to
the root of your repo. A file you just saved on your computer is seen in the container right away.

</details>

<details>
<summary><code>Access denied for user 'root'@'localhost'</code>: forgot the root password</summary>

The root password is set only the first time, when the volume is empty; changing it in `compose.yaml` later does not
change it. If you can still log in as `student`, you have all you need for the course. Otherwise start over and throw
away the data with `docker compose down -v`, then `docker compose up -d`, and do 3-05 again.

</details>

## Read more

- Docker Compose, get started: https://docs.docker.com/compose/gettingstarted/
- The MariaDB image, with all its settings: https://hub.docker.com/_/mariadb
