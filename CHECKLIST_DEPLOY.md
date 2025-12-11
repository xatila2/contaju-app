# ✅ Checklist de Deploy na Vercel

Use este checklist para garantir que todos os passos foram seguidos corretamente.

## 📝 Preparação (Antes do Deploy)

- [ ] Código rodando localmente sem erros (`npm run dev`)
- [ ] Build funcionando corretamente (`npm run build`)
- [ ] Arquivo `.gitignore` inclui `.env` e `.env.local`
- [ ] Variáveis de ambiente documentadas no `.env.example`
- [ ] Arquivos de configuração criados:
  - [ ] `vercel.json`
  - [ ] `.env.example`
  - [ ] `DEPLOY.md`
  - [ ] `README.md` atualizado

## 🔐 Segurança

- [ ] Arquivo `.env` não está no Git
- [ ] Credenciais do Supabase guardadas de forma segura
- [ ] RLS (Row Level Security) configurado no Supabase

## 📦 Repositório Git

- [ ] Repositório criado (GitHub/GitLab/Bitbucket)
- [ ] Código comitado:
  ```bash
  git init
  git add .
  git commit -m "Initial commit - preparado para deploy"
  ```
- [ ] Push para o repositório remoto:
  ```bash
  git remote add origin [sua-url]
  git branch -M main
  git push -u origin main
  ```

## 🌐 Vercel

- [ ] Conta criada/login em [vercel.com](https://vercel.com)
- [ ] Projeto importado do Git
- [ ] Variáveis de ambiente configuradas:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Framework detectado como Vite
- [ ] Build settings verificados:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`
- [ ] Deploy iniciado
- [ ] Deploy concluído com sucesso ✅

## 🔧 Pós-Deploy

- [ ] URL da Vercel recebida (ex: `https://seu-projeto.vercel.app`)
- [ ] Site acessível e carregando
- [ ] Supabase configurado com URL da Vercel:
  - [ ] Site URL atualizado
  - [ ] Redirect URLs incluem URL da Vercel

## ✨ Testes

- [ ] Login funciona
- [ ] Registro de novo usuário funciona
- [ ] Dashboard carrega corretamente
- [ ] Transações podem ser criadas/editadas/deletadas
- [ ] Categorias funcionam
- [ ] Navegação entre páginas funciona (sem 404)
- [ ] Dados aparecem corretamente do Supabase
- [ ] RLS protege dados de outros usuários

## 🎯 Opcional (Recomendado)

- [ ] Domínio customizado configurado
- [ ] Analytics da Vercel ativado
- [ ] Logs de erro monitorados
- [ ] Performance monitorada
- [ ] Ambiente de staging criado (opcional)

## 🚨 Troubleshooting

Se algo der errado, verifique:

1. **Build falha**:
   - Logs de build na Vercel
   - Dependências no `package.json`
   - Variáveis de ambiente configuradas

2. **404 em rotas**:
   - `vercel.json` com rewrites corretos
   - React Router configurado com `BrowserRouter`

3. **Erro de conexão Supabase**:
   - Variáveis de ambiente corretas
   - URL da Vercel nas configurações do Supabase
   - Anon key válida

4. **Erro de autenticação**:
   - Redirect URLs no Supabase incluem URL da Vercel
   - RLS policies configuradas corretamente

---

**🎉 Parabéns!** Se todos os itens estão marcados, seu deploy está completo e funcionando!

## 📚 Documentação de Referência

- [Guia Completo de Deploy](./DEPLOY.md)
- [README do Projeto](./README.md)
- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Supabase](https://supabase.com/docs)
