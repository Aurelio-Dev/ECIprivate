# EC Itapetininga em React Native

Aplicativo universal em Expo SDK 57 para Android, iOS e web. As 15 páginas públicas do acervo HTML foram convertidas para conteúdo estruturado em [`src/data/pages.json`](src/data/pages.json), exibido por componentes React Native. A página inicial, contato, login e painel administrativo usam componentes próprios. As imagens e os documentos estão em `assets/`.

```powershell
npm ci
npx expo start
npm run build:web
npm run lint
npm run typecheck
npm test
```

O Expo Router gera as rotas web estáticas em `dist/`; publique essa pasta em um servidor estático. Para usar no celular, abra o projeto com o Expo Go. Não há build de loja de aplicativos neste repositório.

O menu **Área administrativa** fica no cabeçalho da página inicial. O login de demonstração usa `admin` / `eci2025`. Os jogos e as notícias editados no painel são guardados no armazenamento local do dispositivo e não atualizam a página pública. A autenticação permanece simulada, como no projeto original; uma operação real requer backend, senhas com hash e controle de sessão no servidor.

O formulário de contato mantém o endpoint FormSubmit usado na versão original. Um envio real depende da disponibilidade do serviço e do endereço de destino configurado nele. A loja continua marcada como “em construção” e os relatórios financeiros ainda dizem “Em breve”, como no original.

O [widget oficial VLibras](https://vlibras.gov.br/doc/widget/installation/webpageintegration.html) é carregado nas páginas web exportadas. Em Android e iOS, a ferramenta de acessibilidade oferece um link para o serviço VLibras, pois o widget oficial é feito para páginas web.

Os dados das páginas vieram dos arquivos HTML da raiz por meio de `scripts/extract_content.py`. Para regenerá-los, instale `beautifulsoup4` no Python e execute o script dentro de `mobile/`. As páginas `index2` e `index3` foram preservadas como rotas de arquivo histórico.

Veja [`VERIFICACAO.md`](VERIFICACAO.md) para os resultados da migração e seus limites de teste.
