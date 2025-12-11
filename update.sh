#!/bin/bash

# Verifica se foi passada uma mensagem
if [ -z "$1" ]; then
    echo "❌ Erro: Por favor, digite uma mensagem descrevendo a alteração."
    echo "Exemplo: ./update.sh 'corrigi o erro no login'"
    exit 1
fi

echo "📦 Adicionando arquivos..."
git add .

echo "💾 Salvando commit..."
git commit -m "$1"

echo "🚀 Enviando para o GitHub..."
if git push; then
    echo ""
    echo "✅ SUCESSO! Código enviado."
    echo "🌍 A Vercel deve iniciar o deploy automaticamente em instantes."
else
    echo ""
    echo "❌ Erro ao enviar. Verifique sua conexão ou token."
fi
