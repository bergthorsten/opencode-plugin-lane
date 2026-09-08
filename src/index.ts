import { Plugin } from "@opencode/plugin"
import { makeStrategy } from "./strategy"

export default Plugin.define({
  id: "lane",
  async setup(ctx) {
    const strategy = makeStrategy(ctx.options)
    await ctx.worktree.transform((editor) => editor.add(strategy))
  },
})
