# opencode-plugin-lane

[Lane](https://github.com/lukeed/lane) copy-on-write worktrees as an **OpenCode V2 worktree strategy**.

Registers the clean `lane` worktree strategy through `ctx.worktree.transform`. OpenCode automatically selects it; unloading the plugin restores the previous strategy.

## Setup

1. Install [Lane](https://lane.lukeed.com/#installation) and Git on the machine running the OpenCode server. Tested with Lane **0.2.0**, OpenCode **2.0.3**, and `@opencode/plugin` **2.0.3**.
2. Install the plugin directly from GitHub over HTTPS:

```sh
opencode plugin add git+https://github.com/bergthorsten/opencode-plugin-lane.git
```

OpenCode downloads the plugin and its dependencies and adds it to your global `opencode.jsonc`. No local clone, manual `bun install`, or npm publication is needed.

**Note:** Lane manages its own worktree directories under `<primary-checkout>/.lane/trees/` and ignores OpenCode's `worktree.directory` setting.

Lane creates `.lane/trees` and its Git exclusion on first creation. For Lane's memory workflow, run `lane init` yourself in the repository; that command also edits `AGENTS.md` and configures memory files.

## Options

To configure the plugin manually or pass options, use the Git HTTPS URL as the package target:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "git+https://github.com/bergthorsten/opencode-plugin-lane.git",
      "options": {
        "executable": "/home/me/.local/bin/lane"
      },
    },
  ],
}
```

| Option | Default | Behavior |
| --- | --- | --- |
| `executable` | auto-detected | Absolute binary path or command name. When omitted, the plugin checks the server's `PATH`, `LANE_INSTALL`, and conventional macOS/Linux locations (including `~/.local/bin/lane`, `~/.cargo/bin/lane`, mise, asdf, Volta, Homebrew, MacPorts, and Linuxbrew), verifying that candidate executables are actually Lukeed's Lane CLI. |

Git targets also accept a branch, tag, or full commit hash after `#`, such as `git+https://github.com/bergthorsten/opencode-plugin-lane.git#main`.

## Behavior

The strategy always creates from committed state without `--dirty`. There is no option for copying tracked edits or ordinary untracked files into a new Lane.

- **Create:** takes the last component of OpenCode's suggested destination as the lane name and calls `lane new` under the primary checkout's `.lane/trees/`. Existing paths and branch names get a numeric suffix, with up to 10 candidates. The starting ref is resolved from OpenCode's explicit `branch` or the source checkout's current HEAD, including detached HEAD. The actual created directory is returned to OpenCode.
- **List:** filters `lane ls --json` to native `.lane/trees` worktrees with Lane's per-worktree identity stamp and matching branch name. Ordinary Git worktrees are not claimed. The primary checkout is reported as a root.
- **Remove:** calls `lane rm` from the primary checkout. Lane's refusal to discard edits, pending notes, or unmerged commits becomes OpenCode's `forceRequired` error. Confirmed force passes `--force`. Lane removes the branch as well as the directory.
- **Cancellation:** subprocesses receive the operation's abort signal. Errors are surfaced to OpenCode; it does not retry creation using Git.

The plugin automatically resolves the **primary checkout** from Git's shared repository directory, so creation, listing, and removal work from linked checkouts and their subdirectories. Tracked edits and ordinary untracked files are never copied; eligible Git-ignored caches may still be reflinked. Bare repositories and separate Git directories are unsupported by Lane's layout discovery.

Reflink-capable APFS, btrfs, or XFS filesystems get warm ignored caches; Lane skips those caches when reflinks are unavailable. Startup commands and inventory bookkeeping remain OpenCode's responsibility.

## Development

```sh
bun install
bun run typecheck
LANE_BIN=/absolute/path/to/lane bun test
```

Integration tests use disposable Git repositories and the real Lane CLI, covering lifecycle, ownership, source/ref handling, clean creation, force confirmation, path validation, and cancellation. Without `LANE_BIN` or `lane` on PATH, CLI integration tests are skipped.
