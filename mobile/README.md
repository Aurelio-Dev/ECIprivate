# EC Itapetininga em React e React Native

Este projeto Expo SDK 57 atende navegador de PC, navegador móvel, Android e iOS. A versão web é renderizada por componentes React DOM com a estrutura e o CSS do site original, para preservar o desenho das páginas. Android e iOS usam componentes React Native com uma apresentação adaptada a telas pequenas. Navegação, dados de conteúdo e regras de negócio ficam dentro deste projeto.

```powershell
cd mobile
npm ci
npm run web
```

Abra o endereço mostrado pelo Expo para ver o site no PC. Para gerar arquivos web estáticos, rode `npm run build:web` e sirva `dist/` em um servidor HTTP. Para o aplicativo móvel, rode `npm run android` ou `npm run ios` com um dispositivo ou emulador configurado. Os comandos de exportação (`npx expo export --platform android` e `--platform ios`) verificam a geração dos bundles, mas não instalam um aplicativo.

Os 17 arquivos HTML originais e seus CSS/JS estão em `reference/`. O script `scripts/build_web_reference.py` converte a estrutura HTML para `src/data/webPages.json` e extrai os estilos de cada página para `public/page-css/`. As imagens e os documentos da web estão em `public/`; as imagens do aplicativo nativo estão em `assets/`. O projeto em `mobile/` não depende dos arquivos da raiz para executar ou compilar. Para regenerar os dados após editar uma referência, instale `beautifulsoup4` no Python e execute `python scripts/build_web_reference.py` dentro de `mobile/`.

O link **Área administrativa** aparece no cabeçalho e no menu móvel. O login de demonstração é `admin` / `eci2025`. O painel permite cadastrar, editar e excluir jogos e notícias neste dispositivo/navegador usando armazenamento local; essas mudanças não são publicadas no site. É um protótipo acadêmico, sem backend de autenticação ou gestão de conteúdo.

O formulário de contato usa o endpoint FormSubmit do site original. O widget oficial VLibras é carregado na web. Em Android e iOS, a opção de acessibilidade abre o serviço VLibras externamente, pois o widget original é para páginas web. A loja e os relatórios financeiros mantêm o conteúdo provisório da referência.

Para verificar a migração, rode `npm run lint`, `npm run typecheck`, `npm test` e `npx expo-doctor`. O teste de navegador exige Edge/Chrome e dois servidores HTTP: a raiz original na porta 5501 e `mobile/dist` na porta 5502. Depois de `npm run build:web`, execute `node tests/web.e2e.mjs` em `mobile/`. Veja [VERIFICACAO.md](VERIFICACAO.md) para a cobertura e os limites dos testes.
