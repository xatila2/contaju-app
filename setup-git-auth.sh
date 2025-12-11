#!/bin/bash

# Script para configurar autenticação do Git com token

echo "🔐 Configurando autenticação do GitHub"
echo ""
echo "IMPORTANTE: Você precisará de um Personal Access Token do GitHub"
echo ""
echo "Para criar o token:"
echo "1. Acesse: https://github.com/settings/tokens"
echo "2. Clique em 'Generate new token (classic)'"
echo "3. Marque o scope 'repo'"
echo "4. Copie o token gerado"
echo ""
echo "Cole o token quando solicitado abaixo:"
echo ""

read -p "Digite seu GitHub username (xatila2): " username
read -sp "Digite seu Personal Access Token: " token
echo ""
echo ""

# Atualizar a URL do remote para incluir o token
git remote remove origin
git remote add origin https://${username}:${token}@github.com/xatila2/CONTAJU-OFICIAL---11-12.git

echo "✅ Remote configurado com autenticação"
echo ""
echo "Agora você pode executar:"
echo "git push -u origin main"
