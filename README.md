# Esporte Clube Itapetininga

Este repositório guarda o site original em HTML, CSS e JavaScript e a versão em React/React Native com Expo em [`mobile/`](mobile/README.md). A versão web preserva a estrutura e o visual original; Android e iOS usam uma apresentação React Native. Os arquivos da raiz servem como histórico e referência. `mobile/` inclui sua própria cópia do material necessário para executar e compilar.

Para trabalhar no aplicativo migrado:

```powershell
cd mobile
npm ci
npx expo start
```

No terminal do Expo, use `w` para abrir a versão web ou um dispositivo configurado para Android/iOS. Para gerar as páginas web estáticas, execute `npm run build:web`. Os resultados dos testes e os limites da verificação estão em [`mobile/VERIFICACAO.md`](mobile/VERIFICACAO.md).

O acesso administrativo é um **protótipo acadêmico local**. Não use as credenciais demonstrativas com dados reais.
