# Verificação da migração

## Funcionalidades revisadas

| Recurso original | Situação no app Expo |
| --- | --- |
| Menu desktop e móvel, submenus e links internos | Rotas Expo Router e âncoras; links locais conferidos por teste |
| Hero, história, base, projeto social e páginas institucionais | Conteúdo de 15 páginas convertido em blocos React Native |
| Modal de apoio e PIX | Modal nativo e cópia da chave PIX |
| Formulário de contato | Campos, validação e POST para o mesmo FormSubmit |
| Filtro Sub-15/Sub-17/Sub-20 | Filtro nativo; categorias isoladas em teste |
| Login e logout administrativos | Fluxo demonstrativo com sessão local |
| Agenda e notícias do painel | Cadastro, edição e exclusão locais |
| Alto contraste, fonte, cursor e leitura | Controles no app; cursor e leitura de seleção se aplicam à web |
| VLibras | Widget oficial na web; link para o serviço em Android/iOS |
| PDF do código de ética e imagem da cotação | Arquivos incorporados e links locais resolvidos |

## Checagens executadas

- `npm run lint`: sem erros ou avisos.
- `npm run typecheck`: sem erros.
- `npm test`: 6 testes passaram (login, contato, rotas, elenco, operações locais e cobertura de arquivos/links).
- `npx expo-doctor`: 21 de 21 verificações passaram.
- `npm run build:web`: 20 rotas estáticas geradas.
- `npx expo export --platform android`: bundle Android gerado.
- `npx expo export --platform ios`: bundle iOS gerado.
- HTTP local: página inicial, diretoria, elenco, login, painel e ética responderam 200; HTML em pt-BR, títulos e script VLibras presentes após a revisão.

## Limites da verificação

O ambiente não disponibilizou navegador controlável nem emulador Android/iOS. Portanto, os fluxos não foram executados visualmente por toque/clique em um dispositivo real. Não foi enviado um contato real pelo FormSubmit nem testado um pagamento; a loja original ainda não tem checkout configurado. O widget VLibras móvel é um link para o serviço, não uma integração nativa.
