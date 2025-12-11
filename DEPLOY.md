# Guia de Deploy na Vercel - Contaju

Este guia contém todos os passos necessários para fazer o deploy do aplicativo Contaju na Vercel.

## 📋 Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Conta na [Supabase](https://supabase.com) (já configurada)
3. Código versionado no Git (GitHub, GitLab ou Bitbucket)

## 🚀 Passos para Deploy

### 1. Preparar o Repositório Git

Se ainda não tiver um repositório Git, crie um:

```bash
cd /Users/leonardoricardoarantes/Downloads/app-oficial-ctj--07_12
git init
git add .
git commit -m "Initial commit - preparado para deploy na Vercel"
```

Em seguida, crie um repositório no GitHub e faça o push:

```bash
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git branch -M main
git push -u origin main
```

### 2. Importar Projeto na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New..."** → **"Project"**
3. Selecione seu repositório Git
4. Clique em **"Import"**

### 3. Configurar Variáveis de Ambiente

Na página de configuração do projeto na Vercel, adicione as seguintes variáveis de ambiente:

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | `https://dqpkxpdgjbgbdgsmjhem.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcGt4cGRnamJnYmRnc21qaGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjkwNDYsImV4cCI6MjA4MDk0NTA0Nn0.32gXLLT7dBVVSfo8VYXUWVUVnWwUqpfsvaS4tLmiEy8` |

> ⚠️ **Importante**: Essas variáveis são essenciais para a conexão com o Supabase.

### 4. Configurações do Build

A Vercel detectará automaticamente que é um projeto Vite. As configurações já estão definidas no arquivo `vercel.json`:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 5. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar (geralmente leva 1-3 minutos)
3. Após o deploy, você receberá uma URL do tipo: `https://seu-projeto.vercel.app`

## 🔄 Deploys Automáticos

Após o primeiro deploy, a Vercel automaticamente:

- **Deploy de Preview**: Cria um deploy de preview para cada Pull Request
- **Deploy de Produção**: Faz deploy automático a cada push na branch `main`

## 🔧 Configurações Adicionais da Vercel

### Domínio Customizado

1. Vá em **Settings** → **Domains**
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruções da Vercel

### Configurar Redirects para SPA

O arquivo `vercel.json` já está configurado com os rewrites necessários para o React Router funcionar corretamente:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 📝 Atualizar Configurações do Supabase

Após obter a URL da Vercel, adicione-a nas configurações do Supabase:

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Vá em **Authentication** → **URL Configuration**
3. Adicione sua URL da Vercel em **Site URL**
4. Adicione também em **Redirect URLs**: `https://seu-projeto.vercel.app/**`

## 🐛 Troubleshooting

### Build Falha

- Verifique se todas as dependências estão no `package.json`
- Certifique-se de que as variáveis de ambiente estão configuradas
- Revise os logs de build na dashboard da Vercel

### Erros de Roteamento

- O arquivo `vercel.json` deve ter os rewrites configurados corretamente
- Certifique-se de que o React Router está configurado com `BrowserRouter`

### Erros de Conexão com Supabase

- Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas
- Confirme que a URL da Vercel está nas configurações de Redirect URLs do Supabase

## 🔐 Segurança

- ✅ Arquivo `.env` está no `.gitignore`
- ✅ Variáveis de ambiente configuradas na Vercel
- ✅ Anon key do Supabase é segura para uso público (as RLS policies protegem os dados)

## 📱 Próximos Passos

Após o deploy bem-sucedido:

1. Teste todas as funcionalidades principais
2. Verifique autenticação e autorização
3. Teste em diferentes dispositivos
4. Configure monitoramento (Vercel Analytics)

## 🔗 Links Úteis

- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Vite](https://vitejs.dev/)
- [Documentação Supabase](https://supabase.com/docs)

---

**Projeto**: Contaju - Sistema de Gestão Financeira
**Framework**: Vite + React + TypeScript
**Backend**: Supabase
**Deploy**: Vercel
