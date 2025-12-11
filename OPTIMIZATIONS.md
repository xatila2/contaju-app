# Configurações Opcionais de Otimização

Este arquivo contém configurações opcionais para melhorar o desempenho e a experiência do usuário.

## 🚀 Otimizações de Build

### 1. Code Splitting

Para reduzir o tamanho do bundle inicial, considere implementar code splitting nas rotas:

```typescript
// Exemplo em App.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
// ... outras páginas

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        {/* ... outras rotas */}
      </Routes>
    </Suspense>
  );
}
```

### 2. Otimização do Vite Config

Adicione ao `vite.config.ts`:

```typescript
export default defineConfig({
  // ... suas configurações atuais
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'recharts'],
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

## 📊 Vercel Analytics

Para ativar analytics na Vercel:

1. Instale o pacote:
```bash
npm install @vercel/analytics
```

2. Adicione ao `index.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

## 🎨 Web Vitals

Para monitorar Core Web Vitals:

1. Instale:
```bash
npm install web-vitals
```

2. Crie `src/vitals.ts`:
```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS(console.log);
  onFID(console.log);
  onFCP(console.log);
  onLCP(console.log);
  onTTFB(console.log);
}
```

3. Chame no `index.tsx`:
```typescript
import { reportWebVitals } from './src/vitals';

// ... seu código
reportWebVitals();
```

## 🔒 Headers de Segurança

Adicione ao `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

## ⚡ Performance

### Lazy Loading de Imagens

Se você adicionar imagens no futuro:

```typescript
<img 
  src="imagem.jpg" 
  loading="lazy"
  alt="Descrição"
/>
```

### Service Worker (PWA)

Para transformar em PWA, use o plugin:

```bash
npm install vite-plugin-pwa -D
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Contaju',
        short_name: 'Contaju',
        description: 'Sistema de Gestão Financeira',
        theme_color: '#ffffff',
      },
    }),
  ],
});
```

## 🌍 Internacionalização (i18n)

Para suporte a múltiplos idiomas no futuro:

```bash
npm install react-i18next i18next
```

## 📱 Meta Tags SEO

Adicione ao `index.html`:

```html
<meta name="description" content="Sistema de gestão financeira completo">
<meta name="keywords" content="finanças, gestão, contabilidade">
<meta property="og:title" content="Contaju - Gestão Financeira">
<meta property="og:description" content="Sistema completo de gestão financeira">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

## 🔄 Configurações de Cache

Adicione ao `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 🎯 Lighthouse CI

Para monitoramento contínuo de performance:

```bash
npm install -D @lhci/cli
```

Crie `.lighthouserc.js`:

```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      url: ['http://localhost:4173'],
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

---

**Nota**: Estas são otimizações opcionais. O projeto já está pronto para deploy básico na Vercel sem nenhuma dessas configurações.
