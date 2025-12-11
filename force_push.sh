#!/bin/bash

echo "🚀 Modo Turbo de Autenticação Git"
echo "==================================="
echo ""
echo "Este script vai ignorar as senhas salvas e usar seu token diretamente."
echo ""
echo "Cole seu token do GitHub abaixo (começa com ghp_...):"
read -s TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Erro: O token não pode estar vazio."
    exit 1
fi

echo ""
echo "🔄 Configurando acesso para xatila2..."

# Monta a URL com o token embutido
GIT_URL="https://xatila2:$TOKEN@github.com/xatila2/contaju-app.git"

# Força a troca da URL
git remote set-url origin "$GIT_URL"

echo "✅ Acesso configurado!"
echo "📦 Enviando arquivos para o GitHub..."
echo ""

# Tenta fazer o push
if git push -u origin main; then
    echo ""
    echo "🎉 SUCESSO! Seus arquivos foram enviados."
    echo "Agora você pode ir na Vercel e importar o projeto."
else
    echo ""
    echo "❌ Ainda deu erro. Verifique se:"
    echo "1. O token foi copiado corretamente"
    echo "2. O repositório https://github.com/xatila2/contaju-app.git  realmente existe"
fi
