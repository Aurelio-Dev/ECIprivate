# Verificação da migração

## Implementação

Na web, as páginas são componentes React gerados da estrutura HTML original, com os mesmos estilos, imagens e documentos. Os scripts antigos não são executados; as interações foram reimplementadas em React. O acesso administrativo foi adicionado ao cabeçalho e ao menu móvel. O conteúdo estrutural também alimenta as telas React Native, que usam um layout próprio para Android/iOS.

## Checagens executadas

| Verificação | Resultado |
| --- | --- |
| `npm run lint` e `npm run typecheck` | Sem erros |
| `npm test` | 6 testes: login, contato, rotas, elenco, operações locais e arquivos/links |
| `npx expo-doctor` | 21 de 21 verificações passaram |
| `npm run build:web` | 20 rotas estáticas exportadas |
| `npx expo export --platform android` | Bundle Android gerado |
| `npx expo export --platform ios` | Bundle iOS gerado |
| `node tests/web.e2e.mjs` | Navegação e interações passaram em Edge headless, nos tamanhos PC e celular |

O teste web compara a posição e a largura do cabeçalho, hero e história da página inicial com o site original em 1536 × 728, e a posição/largura da área principal das demais páginas públicas. Ele também percorre menu e submenus, modal de apoio e cópia do PIX, filtro do elenco, documentos, formulário de contato com resposta simulada, login inválido/válido, cadastro local de jogo, persistência após recarga, logout e menu móvel em 390 × 844. O script do VLibras foi carregado, o widget inicializado e o botão de acesso encontrado no navegador.

## Limites

Não houve teste em aparelho Android/iOS ou emulador neste ambiente; a exportação confirma que os bundles são gerados, não que cada gesto funcione em dispositivo real. A comparação geométrica cobre posições e larguras, e não substitui uma revisão visual manual de cada seção. O envio do formulário foi simulado no teste para não mandar mensagem real. O login e o painel são demonstrações locais, sem publicação dos dados no site. O VLibras nativo abre o serviço externo.

Algumas imagens de produtos e o arquivo de exemplo `SUA_IMAGEM_AQUI.png` já não existiam no acervo original. Esses espaços foram preservados sem inventar arquivos. A versão web depende da disponibilidade da fonte remota e do serviço VLibras para esses recursos externos.
