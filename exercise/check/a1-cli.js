// Assignment 1: runs your terminal program with commands.txt and checks the result. Run by
// exercise/check/a1.bash, or by hand from the root of your repo:
//   node exercise/check/a1-cli.js
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const dir = 'assignment/a1'
const commands = readFileSync(`${dir}/commands.txt`, 'utf8')
const run = spawnSync(process.execPath, [`--env-file=${dir}/.env`, `${dir}/cli.js`, '--json'], {
  input: commands,
  encoding: 'utf8',
})

const results = []
let summary
for (const line of run.stdout.split('\n')) {
  try {
    const result = JSON.parse(line)
    if (result.summary) {
      summary = result
    } else {
      results.push(result)
    }
  } catch {
    // not a line from --json
  }
}

const problems = []
if (!summary) {
  const output = `${run.stdout}\n${run.stderr}`.trim().split('\n').slice(-6).join('\n')
  problems.push(`the program stops before the end of commands.txt:\n${output}`)
}
for (const command of ['product list', 'product show', 'product add', 'supplier list']) {
  if (!results.some((result) => result.command.startsWith(command))) {
    problems.push(`commands.txt does not run "${command}"`)
  }
}
if (summary && !results.some((result) => result.status === 'fail')) {
  problems.push('commands.txt has no command that fails, such as a product that does not exist')
}
for (const result of results) {
  if (result.status === 'fail' && String(result.message).startsWith('Error: ')) {
    problems.push(`"${result.command}" throws an error: ${result.message}`)
  }
}
const dbError = problems.find((problem) =>
  /ECONNREFUSED|Access denied|Unknown database/.test(problem)
)
if (dbError) {
  problems.length = 0
  problems.push(
    dbError,
    `it cannot reach the database: is MariaDB running, and are the values in ${dir}/.env right?`
  )
}

if (summary) {
  console.log(
    `${summary.total} commands: ${summary.ok} ok, ${summary.warned} warn, ${summary.failed} failed`
  )
}
for (const problem of problems) {
  console.log(`FAIL ${problem}`)
}
process.exitCode = problems.length > 0 ? 1 : 0
