return {
  {
    "windwp/nvim-ts-autotag",
    config = function()
      require("nvim-ts-autotag").setup()
    end,
    event = "InsertEnter",
    dependencies = { "nvim-treesitter/nvim-treesitter" },
  },
}

