import { execFile } from "node:child_process"

export class CommandError extends Error {
  constructor(
    readonly executable: string,
    readonly code: number | string | null | undefined,
    readonly stderr: string,
    stdout: string,
  ) {
    super(`${executable}: ${stderr.trim() || stdout.trim() || `command failed (${code})`}`)
  }
}

export function run(executable: string, args: string[], cwd: string, signal: AbortSignal): Promise<string> {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const child = execFile(
      executable,
      args,
      { cwd, signal, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (signal.aborted) return reject(signal.reason)
        if (error) return reject(new CommandError(executable, error.code, stderr || error.message, stdout))
        resolve(stdout.trimEnd())
      },
    )
    // Lane is used as a CLI, without its interactive shell wrapper.
    child.stdin?.end()
  })
}
