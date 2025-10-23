require "nvchad.mappings"

-- add yours here

local map = vim.keymap.set

map("n", ";", ":", { desc = "CMD enter command mode" })
map("i", "jk", "<ESC>")

-- Format file with Shift+F
map("n", "<S-f>", function()
  vim.lsp.buf.format({ async = true })
end, { desc = "Format file" })

-- map({ "n", "i", "v" }, "<C-s>", "<cmd> w <cr>")
