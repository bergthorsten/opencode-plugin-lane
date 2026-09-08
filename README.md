# opencode-plugin-lane

[Lane](https://github.com/lukeed/lane) copy-on-write worktrees as an **OpenCode V2 worktree strategy**.

Registers strategy `lane` through `ctx.worktree.transform`. OpenCode automatically selects the last registered strategy; unloading the plugin restores the previous strategy.

## Setup

1. Install [Lane](https://lane.lukeed.com/#installation) and Git on the machine running the OpenCode server. Tested with Lane **0.1.0** and `@opencode/plugin` **0.0.0-beta-19296**.
2. Install this plugin's dependencies with `bun install` in this directory.
3. Add the following to **`opencode.jsonc` at your repository root**:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "worktree": { "directory": ".lane/trees" },
  "plugins": ["/root/projects/opencode-plugin-lane"],
}
```

Use the absolute path where you placed this plugin. If your config is in `.opencode/opencode.jsonc`, use `../.lane/trees`: OpenCode resolves the destination relative to the declaring config file. An absolute destination also works.

Lane creates `.lane/trees` and its Git exclusion on first creation. For Lane's memory workflow, run `lane init` yourself in the repository; that command also edits `AGENTS.md` and configures memory files.

## Options

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "worktree": { "directory": ".lane/trees" },
  "plugins": [
    {
      "package": "/root/projects/opencode-plugin-lane",
      "options": {
        "executable": "/home/me/.local/bin/lane",
        "dirty": false,
      },
    },
  ],
}
```

| Option | Default | Behavior |
| --- | --- | --- |
| `executable` | `lane` | Command on the server's PATH, or an absolute binary path. |
| `dirty` | `false` | Pass `--dirty` to carry primary-checkout edits and untracked files. |

## Behavior

- **Create:** calls `lane new` at OpenCode's resolved destination. The destination's path beneath `.lane/trees/` becomes the new branch name. An explicit OpenCode `branch` is passed as Lane's starting `--base` ref; otherwise the primary checkout's current HEAD is used. Existing same-named branches are refused rather than adopted at a different starting ref.
- **List:** filters `lane ls --json` to native `.lane/trees` worktrees with Lane's per-worktree identity stamp and matching branch name. Ordinary Git worktrees are not claimed. The primary checkout is reported as a root.
- **Remove:** calls `lane rm` from the primary checkout. Lane's refusal to discard edits, pending notes, or unmerged commits becomes OpenCode's `forceRequired` error. Confirmed force passes `--force`. Lane removes the branch as well as the directory.
- **Cancellation:** subprocesses receive the operation's abort signal. Errors are surfaced to OpenCode; it does not retry creation using Git.

Lane 0.1.0 always creates under **`<primary-checkout>/.lane/trees/`** and copies caches from the **primary checkout**. The plugin rejects other destinations and creation from linked checkouts. From a session in a linked checkout, supply `from: "/absolute/primary-checkout"` to the OpenCode worktree API. Listing and removal work from linked checkouts. Bare repositories and separate Git directories are unsupported by Lane's layout discovery.

Reflink-capable APFS, btrfs, or XFS filesystems get warm ignored caches; Lane skips those caches when reflinks are unavailable. `dirty` follows Lane's own materialization behavior. Startup commands and inventory bookkeeping remain OpenCode's responsibility.

## Development

```sh
bun install
bun run typecheck
LANE_BIN=/absolute/path/to/lane bun test
```

Integration tests use disposable Git repositories and the real Lane CLI, covering lifecycle, ownership, source/ref handling, dirty carry-over, force confirmation, path validation, and cancellation. Without `LANE_BIN` or `lane` on PATH, CLI integration tests are skipped.
