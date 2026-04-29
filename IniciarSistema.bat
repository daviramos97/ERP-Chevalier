@echo off
title Sistema Chevalier - Servidor
echo =========================================
echo Iniciando o Servidor do Sistema CHEVALIER
echo =========================================
echo.
echo Por favor, mantenha esta janela preta aberta enquanto estiver usando o sistema.
echo Para desligar o sistema, basta fechar esta janela.
echo.
echo Aguarde, abrindo o navegador...

:: Abre o navegador no endereço do sistema após 3 segundos (tempo para o servidor iniciar)
start "" "http://localhost:5173"

:: Inicia o servidor do projeto
cd /d v:\CHEVALIER
npm run dev
