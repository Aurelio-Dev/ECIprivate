# Verificação da migração

## Implementação

Na web, as páginas públicas são componentes React gerados da estrutura HTML original, com os mesmos estilos, imagens e documentos. Os scripts antigos não são executados; as interações foram reimplementadas em React. O painel administrativo tem apenas Almoxarifado, Diário de classe e Cadastros. As mesmas regras de dados do Kardex e da frequência são usadas na tela React Native para Android/iOS. O conteúdo público estrutural usa um layout nativo próprio.

## Checagens executadas

| Verificação | Resultado |
| --- | --- |
| `npm run lint` e `npm run typecheck` | Sem erros |
| `npm test` | 7 testes: login, contato, rotas, elenco, Kardex, aula/frequência e arquivos/links |
| `npx expo-doctor` | 21 de 21 verificações passaram |
| `npm run build:web` | 20 rotas estáticas exportadas |
| `npx expo export --platform android` | Bundle Android gerado |
| `npx expo export --platform ios` | Bundle iOS gerado |
| `node tests/web.e2e.mjs` | Navegação e interações passaram em Edge headless, nos tamanhos PC e celular |

O teste web compara a posição e a largura do cabeçalho, hero e história da página inicial com o site original em 1536 × 728, e a posição/largura da área principal das demais páginas públicas. Ele também percorre menu e submenus, modal de apoio e cópia do PIX, filtro do elenco, documentos, formulário de contato com resposta simulada, login inválido/válido, os três módulos do painel, entrada e saída no Kardex, bloqueio de saldo negativo, cadastros de alunos/colaborador, criação de aula, presença e ausência individuais, persistência após recarga, logout e menu móvel em 390 × 844. O script do VLibras foi carregado, o widget inicializado e o botão de acesso encontrado no navegador.

## Limites

Não houve teste em aparelho Android/iOS ou emulador neste ambiente; a exportação confirma que os bundles são gerados, não que cada gesto funcione em dispositivo real. A comparação geométrica cobre posições e larguras, e não substitui uma revisão visual manual de cada seção. O envio do formulário foi simulado no teste para não mandar mensagem real. O login e o painel são demonstrações locais, sem publicação dos dados no site. O armazenamento local não foi projetado para dados pessoais reais de menores. O VLibras nativo abre o serviço externo.

`npm audit --omit=dev` ainda aponta 6 avisos em dependências de execução do Expo/Router (3 moderados e 3 altos). As correções automáticas sugerem trocar a versão principal do SDK/Router; essa migração precisa de uma revisão separada antes de uso em produção.

Algumas imagens de produtos e o arquivo de exemplo `SUA_IMAGEM_AQUI.png` já não existiam no acervo original. Esses espaços foram preservados sem inventar arquivos. A versão web depende da disponibilidade da fonte remota e do serviço VLibras para esses recursos externos.
