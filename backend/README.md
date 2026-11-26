# API e banco de dados do ECI

Esta API é necessária para acessar o painel administrativo. Os dados ficam em um banco PostgreSQL hospedado no Supabase; o site e o aplicativo não acessam o banco diretamente, só a API. Ela foi testada com PostgreSQL 16. A implementação inicial guarda cada registro como um documento JSON em `eci_records`, com tabelas separadas para usuários, sessões e revisão. Ela ainda não é uma modelagem relacional completa.

## Preparar no computador

1. No painel do projeto no Supabase, clique em **Connect**, escolha **Session pooler** e copie a string de conexão. Troque `[YOUR-PASSWORD]` pela senha do banco definida na criação do projeto. Se a senha tiver caracteres como `@`, `#`, `/` ou `%`, eles precisam ser codificados na URL; o mais simples é usar uma senha só com letras e números. Não compartilhe a string: ela dá acesso total ao banco.

2. No PowerShell, dentro da pasta `backend`, rode `npm ci` e copie o arquivo `.env.example` para `.env`. O `.env.example` já traz o endereço do projeto no Supabase: basta trocar `SUA_SENHA` pela senha do banco em `DATABASE_URL`, sem acrescentar `?sslmode=` ao final. O arquivo `.env` é local e não deve ser enviado ao GitHub. Para usar um PostgreSQL instalado no computador em vez do Supabase, aponte `DATABASE_URL` para ele e defina `DB_SSL=false`.
3. Execute `npm run setup`. O comando cria as tabelas se necessário, ativa o RLS nelas (para que a Data API do Supabase não as exponha) e solicita usuário e senha para o primeiro administrador. A senha será visível durante a digitação no terminal; execute em ambiente privado. Se já houver administrador, ele é preservado. A senha do administrador é diferente da senha do banco.
4. Execute `npm start` e mantenha o terminal aberto. Em outro terminal, entre em `mobile`, rode `npm ci` e `npm run web`. A API padrão é `http://localhost:3333`.

Os endereços do site permitidos pela API ficam em `ALLOWED_ORIGINS`, separados por vírgulas. Use exatamente o endereço apresentado pelo Expo, incluindo protocolo, domínio e porta. Não misture `localhost` e `127.0.0.1`: os cookies são vinculados ao domínio usado. Se alterar a configuração, reinicie a API.

## Registros anteriores

Após entrar no painel com um banco vazio, o botão **Importar registros locais** aparece quando houver registros da versão anterior naquele navegador ou dispositivo. A importação depende de confirmação, não apaga a cópia local e não substitui registros existentes. Use o mesmo navegador ou dispositivo em que os dados foram cadastrados. Caso o banco já contenha dados, faça uma migração assistida; não use esse botão para mesclar bases.

## Dispositivos móveis e implantação

No aplicativo nativo, `localhost` representa o próprio aparelho. Para desenvolvimento, configure em `mobile/.env.local` a variável pública `EXPO_PUBLIC_API_URL` com o endereço acessível da API e reinicie o Expo. Para outro dispositivo na rede, a API precisa escutar em um endereço apropriado (`HOST`) e a rede/firewall precisam permitir a conexão. Essa variável é pública: nunca coloque senhas nela.

Para uso pela internet, é necessário publicar a API em infraestrutura adequada, usar HTTPS, configurar `COOKIE_SECURE=true`, restringir origens, proteger a rede do banco, realizar backups e revisar autenticação, permissões e privacidade. Os cookies web usam `SameSite=Strict`: hospede a API e o site sob o mesmo site ou configure um proxy no domínio do site. Não coloque a string de conexão do banco no site, no aplicativo ou em variáveis `EXPO_PUBLIC_*`. O código atual é uma base de desenvolvimento e ainda requer revisão de segurança e testes em aparelhos antes de uso com dados pessoais reais.

## Publicação na Vercel

Na Vercel, a API roda como função junto com o site, no mesmo domínio. Por isso o cookie de sessão funciona sem proxy. O arquivo `api/index.mjs`, na raiz do repositório, só reexporta o app de `backend/src/server.js`, e o `vercel.json` encaminha todas as rotas `/api/*` para ele. Quando a variável `VERCEL` existe, que a própria Vercel define, o `server.js` não abre porta e passa a considerar o IP real do visitante no limite de tentativas de login.

Variáveis do projeto na Vercel (Settings > Environment Variables):

- `DATABASE_URL`: a string do **Transaction pooler** do Supabase (porta `6543`), com a senha. No computador continua a do Session pooler (porta `5432`).
- `DB_SSL=true` e `DB_POOL_MAX=2`. Cada instância da função abre o próprio pool, e um número baixo evita esgotar as conexões do Supabase.
- `ALLOWED_ORIGINS=https://eci-self.vercel.app` e `COOKIE_SECURE=true`.
- `EXPO_PUBLIC_API_URL=https://eci-self.vercel.app`. Ela é lida no build do site; se for alterada, é preciso fazer um novo deploy.

O controle de tentativas de login fica na memória de cada instância. Na Vercel ele vale por instância e é zerado quando a função reinicia, então protege menos do que no computador.

## Migração de uma instalação existente

Antes de atualizar a API, pare as gravações, faça uma cópia de segurança completa do banco e confirme que ela pode ser restaurada. Na pasta `backend`, confira se o `.env` aponta para o banco correto e execute `npm run migrate`. O comando acrescenta `role` e `active` a `eci_users` sem apagar nem substituir tabelas. Todos os usuários anteriores recebem perfil administrador ativo, pois antes desta versão todos tinham esse acesso. Novos usuários recebem o perfil escolhido no cadastro; o padrão do banco para inserções sem perfil é operador. Senhas, sessões, revisão e dados dos módulos são preservados. Reinicie a API após migrar. `npm run setup` também executa a migração em instalações existentes e cria o primeiro administrador apenas quando não há usuários.

A migração é retomável: se for interrompida, execute-a novamente. Conserve o backup mesmo assim.

## Gestão de usuários

Entre como administrador e abra **Usuários**. Cadastre um nome de acesso, uma senha inicial de 12 a 512 caracteres e o perfil **Administrador** ou **Operador**. O operador usa Almoxarifado, Diário de classe e Cadastros; somente o administrador pode gerenciar usuários. A lista mostra perfil e estado, nunca a senha ou seu hash. Nela é possível ativar, desativar e redefinir a senha. A desativação e a redefinição encerram as sessões existentes; ao reativar, o usuário deve entrar novamente. O último administrador ativo não pode ser desativado. A redefinição da própria senha também encerra a sessão atual. Compartilhe senhas iniciais por um canal seguro.

As permissões e o estado são conferidos pela API em cada solicitação. Uma tela já aberta é redirecionada ao login na próxima solicitação que receba 401; dados já apresentados ou copiados antes da revogação não podem ser retirados remotamente. Senhas são armazenadas com scrypt e sal aleatório; tokens são armazenados como hash.

## Testes

`npm test` executa os testes de regras e pula os testes de integração se não configurados. Para testar gestão e migração com PostgreSQL, defina `ECI_RUN_DB_TESTS=1` e execute `node --test test/setup.integration.test.js test/users.integration.test.js`. Os testes criam e removem uma base temporária com nome aleatório `eci_test_*` no servidor de `DATABASE_URL`, sem tocar nas tabelas da aplicação. Rode-os contra um PostgreSQL local (`DB_SSL=false`), não contra o banco do Supabase. O teste de integração antigo aceita `ECI_TEST_API`, `ECI_TEST_USER` e `ECI_TEST_PASSWORD` e altera o banco indicado: use apenas uma API com banco exclusivo e vazio para testes.

Para incluir o teste web integrado dos três módulos, gere `mobile/dist`, sirva-o em `http://localhost:5502` e acrescente `ECI_RUN_WEB_TESTS=1` ao mesmo comando. O navegador automatizado usa a API e a base temporária criadas pelo teste; pode ser necessário definir `CHROME_PATH`. O teste específico da interface de usuários em `mobile/tests/users.web.e2e.mjs` usa uma API simulada.
