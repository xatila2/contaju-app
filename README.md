<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Contaju - Sistema de Gestão Financeira

Sistema completo de gestão financeira com controle de transações, categorias, simulações e análise de capital de giro, desenvolvido com React, TypeScript, Vite e Supabase.

## 🚀 Tecnologias

- **Frontend**: React 19.2 + TypeScript
- **Build Tool**: Vite 6.2
- **Backend**: Supabase (Auth + Database)
- **Roteamento**: React Router DOM 7.10
- **UI Components**: Lucide React
- **Gráficos**: Recharts
- **Drag & Drop**: DnD Kit
- **Deploy**: Vercel

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- NPM ou Yarn
- Conta no Supabase (para backend)

## 🛠️ Instalação Local

1. **Clone o repositório** (se aplicável):
   ```bash
   git clone [seu-repositorio]
   cd app-oficial-ctj--07_12
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   
   Crie um arquivo `.env.local` na raiz do projeto:
   ```bash
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
   ```

4. **Execute o projeto**:
   ```bash
   npm run dev
   ```

   O aplicativo estará disponível em `http://localhost:3000`

## 📦 Build para Produção

Para criar uma build de produção:

```bash
npm run build
```

Para testar a build localmente:

```bash
npm run preview
```

## 🌐 Deploy na Vercel

Este projeto está pronto para deploy na Vercel. Consulte o arquivo [`DEPLOY.md`](./DEPLOY.md) para instruções detalhadas de deployment.

**Resumo rápido**:

1. Faça push do código para um repositório Git (GitHub, GitLab, Bitbucket)
2. Importe o projeto na [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente no painel da Vercel
4. Deploy automático!

## 🔐 Autenticação

O sistema utiliza Supabase Auth para gerenciamento de usuários:

- Login/Registro de usuários
- Proteção de rotas
- Row Level Security (RLS) para isolamento de dados

## 📊 Funcionalidades

- **Dashboard**: Visão geral financeira com gráficos e métricas
- **Transações**: Gerenciamento completo de receitas e despesas
- **Categorias**: Organização personalizada de transações
- **Simulações**: Projeções financeiras
- **Capital de Giro**: Análise de liquidez
- **Multi-tenancy**: Cada usuário possui seus próprios dados isolados

## 🗂️ Estrutura do Projeto

```
app-oficial-ctj--07_12/
├── components/         # Componentes React reutilizáveis
├── context/           # Context API (Auth, Transactions)
├── pages/             # Páginas da aplicação
├── src/
│   └── lib/          # Configurações (Supabase client)
├── utils/            # Funções utilitárias
├── types.ts          # Definições TypeScript
├── constants.ts      # Constantes da aplicação
├── App.tsx           # Componente principal
└── index.tsx         # Entry point

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview da build de produção

## 🐛 Troubleshooting

### Erro de conexão com Supabase
Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas corretamente.

### Build com warnings de chunk size
O projeto possui um bundle grande. Para otimizar, considere implementar code-splitting com dynamic imports.

### Problemas de roteamento em produção
O arquivo `vercel.json` já está configurado com os rewrites necessários para o React Router funcionar corretamente.

## 📝 Configuração do Supabase

Execute os seguintes scripts SQL no seu projeto Supabase:

1. `supabase_schema.sql` - Schema principal do banco
2. `auth_migration.sql` - Configuração de autenticação e RLS
3. `migration_update.sql` - Atualizações incrementais

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 📞 Suporte

Para questões e suporte, entre em contato através do repositório ou abra uma issue.

---

**Desenvolvido com ❤️ usando React + Vite + Supabase**
