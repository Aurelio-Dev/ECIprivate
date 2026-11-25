// Metadados de SEO das páginas web renderizadas por WebReferencePage.
// As descrições foram escritas a partir do conteúdo de cada página em reference/.
// webPages.json é gerado pelo script Python; os metadados ficam aqui para não depender dele.

export const SITE_URL = 'https://www.ecitapetininga.com.br';

export type PageSeo = {
  /** Caminho publicado no build estático: "/" para a home e "/pagina.html" para as demais. */
  path?: string;
  /** Substitui o <title> que vem da referência. */
  title?: string;
  /** Até 155 caracteres. */
  description?: string;
};

export const seoPages: Record<string, PageSeo> = {
  index: {
    path: '/',
    title: 'Esporte Clube Itapetininga | Clube de futebol de Itapetininga-SP',
    description: 'Herdeiro do DERAC, fundado em 1950, o EC Itapetininga é filiado à Federação Paulista de Futebol e forma atletas nas categorias de base.',
  },
  transparencia: {
    path: '/transparencia.html',
    description: 'Prestação de contas do EC Itapetininga: balancetes patrimoniais, demonstrações financeiras e cotações de cada período contábil, em PDF.',
  },
  diretoria: {
    path: '/diretoria.html',
    description: 'Diretoria executiva do EC Itapetininga, presidida por Adilson Ramos, com a mensagem do presidente sobre inclusão social e alto rendimento.',
  },
  governanca: {
    path: '/governanca.html',
    description: 'Garantias do EC Itapetininga a patrocinadores e investidores: profissionais com CREF e Licença CBF, conformidade com o ECA e prestação de contas.',
  },
  infraestrutura: {
    path: '/infraestrutura.html',
    description: 'Campo, quadra poliesportiva, academia, escritório e cozinha: as instalações do EC Itapetininga, mantidas em parceria com a ADFMI e em reforma.',
  },
  etica: {
    path: '/etica.html',
    description: 'Código de Ética e Conduta do EC Itapetininga: respeito e inclusão, fair play, proteção aos jovens conforme o ECA e transparência. Íntegra em PDF.',
  },
  metodologia: {
    path: '/metodologia.html',
    description: 'Metodologia de formação do EC Itapetininga: iniciação e inclusão gratuitas dos 10 aos 15 anos e alto rendimento nas categorias Sub-15 e Sub-17.',
  },
  peneiras: {
    path: '/peneiras.html',
    description: 'Como entrar no EC Itapetininga: inscrição por ordem para 10 a 15 anos e seletivas para Sub-15, Sub-17 e Sub-20. O clube não cobra taxa de avaliação.',
  },
  privacidade: {
    path: '/privacidade.html',
    description: 'Política de privacidade do site do EC Itapetininga: dados do formulário de contato, finalidade do uso, proteção de dados de menores e direitos na LGPD.',
  },
  // Sem descrição: o conteúdo ainda é provisório ("Atleta 1", "Nome do Treinador").
  elenco: { path: '/elenco.html' },
  comissao: { path: '/comissao.html' },
  // Fora da entrega.
  loja: { path: '/loja.html' },
  index2: { path: '/index2.html' },
  index3: { path: '/index3.html' },
  // A página 404 é servida em qualquer endereço inexistente, então não tem endereço canônico.
  '404': {},
};

export function pageSeo(slug: string): PageSeo { return seoPages[slug] ?? {}; }

export function absoluteUrl(path: string) { return `${SITE_URL}${path}`; }
