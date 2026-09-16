import { Plugin } from "@opencode/plugin"
import { makeStrategies } from "./strategy"

export default Plugin.define({
  id: "lane",
  async setup(ctx) {
    const strategies = makeStrategies(ctx.options)
    await ctx.worktree.transform((editor) => strategies.forEach((strategy) => editor.add(strategy)))
  },
})
