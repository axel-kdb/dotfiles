require "nvchad.options"

-- add yours here!

-- local o = vim.o
-- o.cursorlineopt ='both' -- to enable cursorline!

-- tabs
local opt = vim.opt

opt.tabstop = 4        -- Number of visual spaces per TAB
opt.shiftwidth = 4     -- Number of spaces to use for autoindent
opt.expandtab = true   -- Convert tabs to spaces
opt.smartindent = true -- Smarter autoindenting
opt.autoindent = true

-- relative line numbers
local opt = vim.opt

opt.relativenumber = true  -- Show relative line numbers
opt.number = true          -- Still show the absolute number on the current line

