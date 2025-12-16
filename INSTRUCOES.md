# 🚀 Passo a Passo para Atualização e Deploy

Aqui está o guia do que você precisa fazer agora para aplicar as correções e colocar o sistema no ar.

## 1. Atualizar o Banco de Dados (Supabase)

Eu criei um arquivo chamado `category_rules_migration.sql` com as correções necessárias para o banco de dados. Você precisa executar esse código no Supabase.

1.  Abra o arquivo `category_rules_migration.sql` que está na pasta do seu projeto.
2.  Copie todo o conteúdo do arquivo.
3.  Acesse o seu painel do **Supabase** (no navegador).
4.  Vá até a seção **SQL Editor** (ícone, geralmente na barra lateral esquerda).
5.  Clique em "New Query" (Nova Consulta).
6.  Cole o código que você copiou.
7.  Clique no botão **Run** (Executar).

Isso vai criar a tabela necessária para as "Regras de Categoria" funcionarem corretamente.

## 2. Verificar o Build (Opcional)

Eu já verifiquei que o código está compilando corretamente, mas se você quiser testar localmente:

1.  No seu terminal, digite:
    ```bash
    npm run build
    ```
2.  Se aparecer "Built in ...s" e "Exit code: 0", está tudo certo!

## 3. Fazer o Deploy (Vercel)

Agora que o código e o banco estão prontos:

1.  Faça o "Commit" e "Push" das alterações para o seu repositório Git:
    ```bash
    git add .
    git commit -m "Correções de banco de dados e UX"
    git push
    ```
2.  A Vercel deve detectar o novo commit e iniciar o deploy automaticamente.
    *   Fique de olho no painel da Vercel para confirmar se o deploy ficou "Verde" (Sucesso).

---

**Pronto!** Seu sistema estará atualizado com as novas modais de confirmação, entrada inteligente de moeda e correções no banco de dados.
