# 🔐 Resolver Erro de Autenticação do GitHub

## Problema Identificado

```
remote: Permission to xatila2/contaju-app.git denied to econtaju.
fatal: unable to access 'https://github.com/xatila2/contaju-app.git/': The requested URL returned error: 403
```

O Git está usando credenciais antigas do usuário `econtaju` ao invés de `xatila2`.

## 🔧 Solução

### Método 1: Limpar Credenciais do Keychain (Recomendado)

1. Abra o aplicativo **"Keychain Access"** (Acesso às Chaves)
   - Você pode encontrar em: `/Applications/Utilities/Keychain Access.app`
   - Ou use Spotlight: `Cmd + Space` e digite "Keychain Access"

2. No Keychain Access:
   - Procure por `github.com` na barra de busca
   - Encontre entradas relacionadas ao GitHub
   - Selecione e delete todas as entradas do GitHub (clique com botão direito → Delete)

3. Feche o Keychain Access

4. Tente fazer push novamente:
   ```bash
   cd /Users/leonardoricardoarantes/Downloads/app-oficial-ctj--07_12
   git push -u origin main
   ```

5. Quando solicitado, entre com suas credenciais do GitHub:
   - **Username**: `xatila2`
   - **Password**: Use um **Personal Access Token** (não a senha normal)

### Método 2: Usar Token Diretamente na URL

Se o Método 1 não funcionar, use esta alternativa:

1. **Criar um Personal Access Token**:
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token (classic)"
   - Configurações:
     - **Note**: `Contaju Deploy`
     - **Expiration**: 90 days
     - **Scopes**: Marque apenas `repo`
   - Clique em "Generate token"
   - **COPIE O TOKEN** (você só verá uma vez!)

2. **Configure o remote com o token**:
   ```bash
   # Remover remote atual
   git remote remove origin
   
   # Adicionar com token (substitua SEU_TOKEN pelo token copiado)
   git remote add origin https://xatila2:SEU_TOKEN@github.com/xatila2/contaju-app.git
   
   # Fazer push
   git push -u origin main
   ```

### Método 3: Usar SSH (Mais Seguro)

Se preferir usar SSH ao invés de HTTPS:

1. **Verificar se você tem uma chave SSH**:
   ```bash
   ls -la ~/.ssh
   ```

2. **Se não tiver, criar uma nova**:
   ```bash
   ssh-keygen -t ed25519 -C "seu-email@example.com"
   ```
   (Pressione Enter para todas as perguntas)

3. **Copiar a chave pública**:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   Copie todo o texto que aparecer

4. **Adicionar no GitHub**:
   - Acesse: https://github.com/settings/keys
   - Clique em "New SSH key"
   - Cole a chave copiada
   - Clique em "Add SSH key"

5. **Atualizar o remote para SSH**:
   ```bash
   git remote remove origin
   git remote add origin git@github.com:xatila2/contaju-app.git
   git push -u origin main
   ```

## ✅ Comandos Rápidos

### Limpar todas as credenciais do Git

```bash
# Remover credenciais do cache
git credential-osxkeychain erase
host=github.com
protocol=https

# Pressione Enter duas vezes
```

### Verificar configuração atual

```bash
# Ver remote configurado
git remote -v

# Ver configuração global
git config --global --list
```

## 🆘 Se Nada Funcionar

Execute este comando para ver logs detalhados:

```bash
GIT_CURL_VERBOSE=1 git push -u origin main
```

Copie o erro e me envie para análise detalhada.

---

**Recomendação**: Use o **Método 1** primeiro (Keychain Access). É o mais simples e seguro.
