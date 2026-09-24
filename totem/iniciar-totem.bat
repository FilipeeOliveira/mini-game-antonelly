@echo off
rem Abre o jogo em tela cheia (quiosque) no Edge, direto do arquivo - sem servidor e sem internet.
start "" msedge --kiosk "%~dp0index.html" --edge-kiosk-type=fullscreen --no-first-run
