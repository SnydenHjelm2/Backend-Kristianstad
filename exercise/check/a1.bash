#!/usr/bin/env bash
# Check your Assignment 1 before you hand it in. Run it from the root of your repo, with MariaDB running and
# db/create.sql loaded:
#
#   bash exercise/check/a1.bash
#
# It checks that the files are where they should be, runs your terminal program with commands.txt, starts your
# server on a free port, calls the routes and stops the server again, and runs npm run check. It changes no files;
# the product add in commands.txt adds a row to your database (load db/create.sql again to reset the data).

dir=assignment/a1
here=exercise/check
failed=0
vg_failed=0
vg_ran=no
pid=
log=

ok() { printf '  ok    %s\n' "$1"; }
fail() {
  printf '  FAIL  %s\n' "$1"
  failed=$((failed + 1))
}
failing() { printf '%s\n' "$1" | grep '✖' | grep -v 'failing tests' | sed -e 's/^ *//' -e 's/ ([0-9.]*ms)$//' | sort -u; }
show() { printf '%s\n' "$1" | tail -n "${2:-8}" | sed 's/^/        /'; }

stop_server() {
  if [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null
    wait "$pid" 2>/dev/null
    pid=
  fi
}
cleanup() {
  stop_server
  if [ -n "$log" ]; then rm -f "$log"; fi
}
trap cleanup EXIT

if [ ! -f package.json ] || [ ! -f "$here/a1-g.js" ]; then
  echo "Run this from the root of your repo: bash exercise/check/a1.bash" >&2
  exit 2
fi

echo "== The files in $dir/"
for file in README.md report.md .env.example db/create.sql cli.js commands.txt app.js; do
  if [ -f "$dir/$file" ]; then ok "$file"; else fail "$file is missing"; fi
done
if [ -f "$dir/.env.example" ]; then
  for var in PORT DB_HOST DB_PORT DB_USER DB_PASSWORD DB_DATABASE; do
    grep -q "^$var=" "$dir/.env.example" || fail ".env.example has no line $var="
  done
fi
if git ls-files --error-unmatch "$dir/.env" >/dev/null 2>&1; then
  fail ".env is committed; remove it from Git with: git rm --cached $dir/.env"
fi

echo "== The scripts in package.json"
for name in a1 a1:cli; do
  if [ "$(npm pkg get "scripts.$name")" = "{}" ]; then fail "no script \"$name\""; else ok "npm run $name"; fi
done

if [ ! -f "$dir/.env" ]; then
  fail "no $dir/.env: create it with cp $dir/.env.example $dir/.env"
  echo "== The terminal program and the server: skipped, they need $dir/.env"
else
  echo "== The terminal program"
  if out=$(node "$here/a1-cli.js" 2>&1); then
    ok "$(printf '%s\n' "$out" | head -n 1)"
  else
    fail "npm run a1:cli --silent < $dir/commands.txt:"
    show "$out" 20
  fi

  echo "== The server"
  port=$((20000 + RANDOM % 20000))
  log=$(mktemp)
  PORT=$port node --env-file="$dir/.env" "$dir/app.js" >"$log" 2>&1 &
  pid=$!
  up=no
  for _ in $(seq 50); do
    if curl -s -o /dev/null "http://localhost:$port/api/products"; then
      up=yes
      break
    fi
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.2
  done
  if [ $up = no ]; then
    fail "the server does not start on PORT=$port:"
    show "$(cat "$log")"
  else
    ok "the server answers on PORT=$port"
    echo "== The API, for G"
    if out=$(BASE_URL=http://localhost:$port node --test "$here/a1-g.js" 2>&1); then
      ok "all checks pass"
    else
      fail "some checks fail:"
      show "$(failing "$out")" 20
    fi
    echo "== The API, for VG (only needed for VG)"
    vg_ran=yes
    if out=$(BASE_URL=http://localhost:$port node --test "$here/a1-vg.js" 2>&1); then
      ok "all checks pass"
    else
      printf '  FAIL  %s\n' "some checks fail:"
      vg_failed=1
      show "$(failing "$out")" 20
    fi
  fi
  stop_server
fi

echo "== npm run check"
if out=$(npm run check 2>&1); then ok "npm run check passes"; else
  fail "npm run check fails:"
  show "$out" 15
fi

echo
if [ $failed -eq 0 ]; then echo "All checks for G pass."; else echo "$failed checks for G fail."; fi
if [ $vg_ran = yes ] && [ $vg_failed -eq 0 ]; then echo "The checks of the API for VG pass."; fi
echo "The script checks a part of the requirements: read them again in exercise/assignment-1.md before you hand in."
[ $failed -eq 0 ]
