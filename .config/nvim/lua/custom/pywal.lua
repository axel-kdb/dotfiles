local M = {}

function M.load_pywal_colors()
  local wal_path = os.getenv("HOME") .. "/.cache/wal/colors.json"
  local file = io.open(wal_path, "r")
  if not file then
    vim.notify("Pywal colors.json not found", vim.log.levels.WARN)
    return
  end

  local json = vim.fn.json_decode(file:read("*a"))
  file:close()

  -- Apply some key highlights
  vim.cmd("highlight Normal guibg=" .. json.special.background .. " guifg=" .. json.special.foreground)
  vim.cmd("highlight Comment guifg=" .. json.colors.color8)
  vim.cmd("highlight CursorLine guibg=" .. json.colors.color1)
  vim.cmd("highlight Visual guibg=" .. json.colors.color2)
  vim.cmd("highlight LineNr guifg=" .. json.colors.color4)
end

return M

