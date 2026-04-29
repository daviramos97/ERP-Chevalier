@echo off
title Sistema Chevalier
echo =========================================
echo Abrindo o Sistema CHEVALIER...
echo =========================================
echo.

:: Abre o navegador no endereço padrão do sistema
start http://localhost:5173

:: Inicia o servidor
npm run dev
