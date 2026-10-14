import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validCredentials, validContact, contactForm, localTarget, upsertById, removeById } from '../src/lib/logic.ts';

const pages = JSON.parse(readFileSync(new URL('../src/data/webPages.json', import.meta.url), 'utf8'));
const originalPlaceholders = new Set(['SUA_IMAGEM_AQUI.png', 'camisa-titular.png', 'camisa-reserva.png', 'caneca.png']);
function nodes(page) {
  const found = [];
  const walk = node => {
    if (typeof node === 'string') return;
    found.push(node);
    node.children.forEach(walk);
  };
  page.body.forEach(walk);
  return found;
}

test('login demonstrativo valida credenciais sem aceitar variações', () => {
  assert.equal(validCredentials('admin', 'eci2025'), true);
  assert.equal(validCredentials(' admin ', 'eci2025'), true);
  assert.equal(validCredentials('admin', 'outra'), false);
  assert.equal(validCredentials('Admin', 'eci2025'), false);
});

test('contato valida e serializa os campos enviados ao FormSubmit', () => {
  const values = { name: ' Aurelio ', email: 'aurelio@example.com', subject: 'Inscrição na base', message: 'Olá!' };
  assert.equal(validContact(values), true);
  assert.equal(validContact({ ...values, email: 'inválido' }), false);
  assert.equal(validContact({ ...values, message: ' ' }), false);
  const form = contactForm(values);
  assert.equal(form.get('Nome'), 'Aurelio');
  assert.equal(form.get('Assunto'), 'Inscrição na base');
  assert.equal(form.get('Mensagem'), 'Olá!');
  assert.equal(form.get('_captcha'), 'false');
});

test('rotas antigas mantêm o destino e a âncora', () => {
  assert.deepEqual(localTarget('index.html#contact'), { slug: 'index', section: 'contact' });
  assert.deepEqual(localTarget('diretoria.html'), { slug: 'diretoria', section: undefined });
  assert.deepEqual(localTarget('#topo', 'elenco'), { slug: 'elenco', section: 'topo' });
});

test('filtro do elenco troca a categoria sem misturar atletas', () => {
  const categories = nodes(pages.elenco).filter(node => node.props.className?.includes('elenco-categoria'));
  assert.deepEqual(categories.map(node => node.props.id), ['sub15', 'sub17', 'sub20']);
  assert.ok(categories[0].children.length > 0);
  assert.ok(categories[1].children.length > 0);
});

test('cadastro local de jogos e notícias atualiza e exclui por id', () => {
  const initial = [{ id: '1', title: 'Antes' }];
  assert.deepEqual(upsertById(initial, { id: '1', title: 'Depois' }), [{ id: '1', title: 'Depois' }]);
  assert.deepEqual(upsertById(initial, { id: '2', title: 'Novo' }).length, 2);
  assert.deepEqual(removeById(initial, '1'), []);
});

test('todas as páginas públicas, imagens e links locais foram migrados', () => {
  for (const name of ['index', 'diretoria', 'governanca', 'infraestrutura', 'etica', 'transparencia', 'comissao', 'metodologia', 'peneiras', 'privacidade', 'elenco', 'loja', '404', 'index2', 'index3']) {
    assert.ok(pages[name]?.body.length > 0, `${name} sem conteúdo`);
  }
  for (const [slug, page] of Object.entries(pages)) {
    const tree = nodes(page);
    for (const node of tree) {
      const src = node.props.src;
      if (node.tag === 'img' && src?.startsWith('/img/') && !originalPlaceholders.has(src.split('/').pop())) assert.ok(existsSync(resolve('assets/images', src.slice(5))), `${slug}: ${src}`);
      const href = node.props.href;
      if (node.tag !== 'a' || !href || /^(https?:|mailto:|tel:|#)/.test(href)) continue;
      if (href.startsWith('/img/')) assert.ok(existsSync(resolve('assets/images', href.slice(5))));
      else if (href.endsWith('.pdf') || href.endsWith('.docx')) assert.ok(existsSync(resolve('assets/documents', decodeURIComponent(href.slice(1)))));
      else {
        const target = localTarget(href.replace(/^\//, ''), slug);
        assert.ok(pages[target.slug], `${slug}: rota ${href} ausente`);
        if (target.section) assert.ok(nodes(pages[target.slug]).some(n => n.props.id === target.section), `${slug}: âncora ${href} ausente`);
      }
    }
  }
  assert.ok(!JSON.stringify(pages.index.body).includes('BOTÕES COM O MESMO TAMANHO E MAIORES'));
});
