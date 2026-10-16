@echo off
rem Запуск киоска: локальный сервер + главное меню в браузере.
rem Статистика викторины пишется в data\stats.json рядом с этим файлом.
chcp 65001 >nul
cd /d "%~dp0"
start "" http://localhost:8000/index.html
python server.py 8000
