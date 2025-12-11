#!/bin/bash

# Script de Deploy Rápido para Vercel
# Este script prepara o projeto para deploy na Vercel

echo "🚀 Preparando projeto para deploy na Vercel..."
echo ""

# Verificar se é um repositório Git
if [ ! -d .git ]; then
    echo "📦 Inicializando repositório Git..."
    git init
    echo "✅ Repositório Git criado!"
else
    echo "✅ Repositório Git já existe"
fi

# Adicionar todos os arquivos
echo ""
echo "📝 Adicionando arquivos ao Git..."
git add .

# Verificar se há mudanças para commitar
if git diff-index --quiet HEAD --; then
    echo "⚠️  Nenhuma mudança para commitar"
else
    echo "📦 Fazendo commit das mudanças..."
    git commit -m "chore: preparado para deploy na Vercel"
    echo "✅ Commit realizado!"
fi

echo ""
echo "🎯 Próximos passos:"
echo ""
echo "1. Se ainda não tiver um repositório remoto, crie no GitHub:"
echo "   https://github.com/new"
echo ""
echo "2. Adicione o repositório remoto (substitua pela sua URL):"
echo "   git remote add origin https://github.com/seu-usuario/seu-repo.git"
echo ""
echo "3. Faça push para o repositório:"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "4. Acesse a Vercel e importe o projeto:"
echo "   https://vercel.com/new"
echo ""
echo "5. Configure as variáveis de ambiente:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo ""
echo "6. Faça o deploy! 🎉"
echo ""
echo "📚 Para mais detalhes, consulte DEPLOY.md"
echo ""
