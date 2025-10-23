return {
  "mfussenegger/nvim-lint",
  event = "BufReadPost",
  config = function()
    local lint = require("lint")
    lint.linters_by_ft = {
      python = { "pylint" },
      javascript = { "eslint_d" },
      typescript = { "eslint_d" },
      cpp = { "clangtidy" },
      c = { "clangtidy" },
    }

    -- Run lint on save
    vim.api.nvim_create_autocmd({ "BufWritePost" }, {
      callback = function()
        lint.try_lint()
      end,
    })
  end,
}

