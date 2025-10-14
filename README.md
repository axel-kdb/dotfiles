-Install zsh and change it to be the default shell
-Install kitty
-Install nerd font
-Install oh-my-zsh from the github repo
-Install powerlevel10k from github
-Install zsh-autosuggestions and zsh-syntax-highlighting
-Install nvim and clone lazyvim repo


Hyprland:

sudo pacman -S waybar rofi swaync hyprpaper hyprlock thunar yazi btop cliphist
yay -S wlogout

rofi themes: https://github.com/adi1090x/rofi
waybar themes: https://github.com/Alexays/Waybar/wiki/Examples
hyprlock themes: https://github.com/MrVivekRajan/Hyprlock-Styles
swaync themes: https://github.com/ErikReider/SwayNotificationCenter/discussions/183

dotfile setups: 

https://github.com/zDyant/HyprNova
https://github.com/elifouts/Dotfiles

gtk/qt/gnome:

https://github.com/vinceliuice/Graphite-gtk-theme

# hide gnome apps buttons
gsettings set org.gnome.desktop.wm.preferences button-layout :

Edit /etc/environment as root and add the line QT_QPA_PLATFORMTHEME=qt6ct

cursor:

https://github.com/ndom91/rose-pine-hyprcursor

screenshots:

https://www.reddit.com/r/hyprland/comments/13ivh0c/what_tool_do_you_recommend_to_take_screenshot_in/

screen sharing:

https://gist.github.com/brunoanc/2dea6ddf6974ba4e5d26c3139ffb7580
