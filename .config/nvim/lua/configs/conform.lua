local options = {
  formatters_by_ft = {
    lua = { "stylua" },

    css = { "prettier" },
    html = { "prettier" },
    javascriptreact = { "prettier" },
    typescriptreact = { "prettier" },

    c = { "clang_format" },
    cpp = { "clang_format" },

    python = { "isort", "black" },
  },

  formatters = {
    prettier = {
      command = "prettier",
      args = {
        "--stdin-filepath", "$FILENAME",
        "--tab-width", "4",
        "--use-tabs", "false",
      },
    },
  },

  format_on_save = {
   -- These options will be passed to conform.format()
    timeout_ms = 500,
    lsp_fallback = true,
  },
}

return options
