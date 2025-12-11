# 🚀 Guia Rápido: Conectar ao GitHub

## ✅ Já Feito

- ✅ Git inicializado
- ✅ Arquivos adicionados
- ✅ Primeiro commit criado

## 📝 Próximos Passos

### 1. Criar Repositório no GitHub

1. Acesse: **https://github.com/new**
2. Preencha os campos:
   - **Repository name**: `CONTAJU-OFICIAL---11-12`
   - **Description**: `Sistema de Gestão Financeira - Contaju`
   - **Visibilidade**: Escolha Private ou Public
   - ⚠️ **IMPORTANTE**: **NÃO** marque nenhuma opção de inicialização (deixe tudo desmarcado)
3. Clique em **"Create repository"**

### 2. Conectar ao Repositório Remoto

Após criar o repositório, o GitHub mostrará instruções. Use os comandos abaixo:

#### Se o repositório for: `https://github.com/xatila2/CONTAJU-OFICIAL---11-12.git`

Execute no terminal:

```bash
# Adicionar o repositório remoto
git remote add origin https://github.com/xatila2/CONTAJU-OFICIAL---11-12.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push do código
git push -u origin main
```

### 3. Autenticação

Quando fizer o `git push`, você precisará se autenticar:

#### Opção A: Token de Acesso Pessoal (Recomendado)

1. Acesse: **https://github.com/settings/tokens**
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Configurações:
   - **Note**: "Contaju Deploy"
   - **Expiration**: 90 days (ou sua preferência)
   - **Scopes**: Marque apenas `repo` (acesso completo a repositórios)
4. Clique em **"Generate token"**
5. **COPIE O TOKEN** (você só verá ele uma vez!)
6. Quando o terminal pedir senha, cole o token

#### Opção B: GitHub CLI (Mais Fácil)

```bash
# Instalar GitHub CLI (se não tiver)
brew install gh

# Fazer login
gh auth login

# Seguir instruções interativas
```

### 4. Verificar Conexão

Após fazer o push, verifique:

```bash
# Ver o status
git status

# Ver repositórios remotos
git remote -v
```

## 🎯 Comandos Úteis para o Terminal

Execute estes comandos na pasta do projeto:

```bash
cd /Users/leonardoricardoarantes/Downloads/app-oficial-ctj--07_12

# Adicionar repositório remoto (substitua pela SUA URL)
git remote add origin https://github.com/xatila2/CONTAJU-OFICIAL---11-12.git

# Garantir que está na branch main
git branch -M main

# Fazer push
git push -u origin main
```

## 🔧 Troubleshooting

### Erro: "remote origin already exists"

```bash
# Remover o remoto existente
git remote remove origin

# Adicionar novamente
git remote add origin https://github.com/seu-usuario/seu-repo.git
```

### Erro: "failed to push some refs"

```bash
# Fazer pull primeiro (se o repo tiver conteúdo)
git pull origin main --allow-unrelated-histories

# Depois fazer push
git push -u origin main
```

### Erro de autenticação

- Use um **Personal Access Token** ao invés da senha
- Ou instale e use o **GitHub CLI** (`gh auth login`)

## 📱 Depois do Push

Após fazer o push com sucesso:

1. ✅ Seu código estará no GitHub
2. ✅ Você poderá importar na Vercel
3. ✅ Deploy automático configurado

**Próximo passo**: Importar o projeto na Vercel seguindo o guia [DEPLOY.md](./DEPLOY.md)

---

## 🆘 Precisa de Ajuda?

Se encontrar algum problema:
1. Verifique se o repositório foi criado no GitHub
2. Confirme que você tem permissão de escrita no repositório
3. Certifique-se de estar autenticado corretamente
