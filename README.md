<div align="center">

  # 🧠 MemorizaBíblia

  **Transforme sua jornada de memorização bíblica com uma metodologia de 7 dias e tecnologia de ponta.**

  [![Website](https://img.shields.io/badge/Acesse-memoriza--biblia.vercel.app-000000?style=flat&logo=vercel)](https://memorizabiblia.vercel.app/)
  [![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-DB%20%26%20Auth-3ECF8E?logo=supabase)](https://supabase.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![PWA](https://img.shields.io/badge/PWA-Pronto-orange?logo=progressive-web-apps)](https://web.dev/progressive-web-apps/)

  **[Acesse o Aplicativo aqui!](https://memorizabiblia.vercel.app/)**

  <img src="./public/img/app-screenshot.png" alt="Screenshot do MemorizaBíblia" width="800" style="border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />

</div>

---

## 📖 Sobre o Projeto

O **MemorizaBíblia** é um aplicativo web (PWA) projetado para ajudar cristãos a memorizarem versículos da Bíblia de forma sistemática e interativa. Utilizando uma metodologia baseada em um ciclo de 7 dias, cada dia apresenta um desafio diferente que reforça a fixação do texto e do contexto bíblico.

## ✨ Funcionalidades Principais

- **📅 Ciclo de 7 Dias**: Exercícios variados (leitura, escrita, emojis, palavras embaralhadas) para garantir a memorização completa em uma semana.
- **☁️ Sincronização em Nuvem**: Login via Supabase que mantém seu progresso sincronizado entre dispositivos.
- **📱 Experiência PWA**: Instale no seu celular ou desktop e use-o como um aplicativo nativo.
- **📡 Suporte Offline**: Funciona sem internet! Seus progressos são salvos localmente e sincronizados automaticamente quando você estiver online.
- **🏆 Sistema de Conquistas**: Ganhe medalhas e acompanhe seu progresso ao longo do tempo.
- **🔍 Busca de Versículos**: Encontre versículos específicos para memorizar ou deixe o app sugerir novos.
- **🔔 Lembretes Diários**: Notificações push personalizáveis para manter sua disciplina.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/) & [Vite](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Backend**: [Supabase](https://supabase.com/) (Autenticação e Banco de Dados)
- **Estado**: [Zustand](https://docs.pmnd.rs/zustand/) com persistência local
- **IA**: [Google Gemini](https://ai.google.dev/) (para geração de conteúdo e auxílio na busca)
- **Service Workers**: [Workbox](https://developer.chrome.com/docs/workbox) via `vite-plugin-pwa`

## 🚀 Começando

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [NPM](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/memorizabiblia.git
   cd memorizabiblia
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   VITE_VAPID_PUBLIC_KEY=sua_chave_publica_vapid
   ```

4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. O aplicativo estará disponível em `http://localhost:3000`.

## 📦 Estrutura de Pastas

```text
src/
├── components/      # Componentes de UI e atividades (D1-D7)
├── data/            # Dados estáticos e versículos offline
├── hooks/           # Hooks personalizados (Instalação PWA, etc)
├── services/        # Integração com Supabase e APIs
├── store.ts         # Gerenciamento de estado global com Zustand
└── sw.ts            # Logic do Service Worker para PWA
```

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

<p align="center">Desenvolvido com ❤️ para a glória de Deus.</p>
