import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validCredentials, validContact, contactForm, localTarget, rosterBlocks, upsertById, removeById } from '../src/lib/logic.ts';

const pages = JSON.parse(readFileSync(new URL('../src/data/pages.json', import.meta.url), 'utf8'));

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
  const blocks = pages.elenco.blocks;
  const sub15 = rosterBlocks(blocks, 'sub15');
  const sub17 = rosterBlocks(blocks, 'sub17');
  const sub20 = rosterBlocks(blocks, 'sub20');
  assert.ok(sub15.some(b => b.id === 'sub15'));
  assert.ok(!sub15.some(b => b.id === 'sub17'));
  assert.ok(sub17.some(b => b.id === 'sub17'));
  assert.ok(!sub17.some(b => b.id === 'sub15'));
  assert.ok(sub20.some(b => b.id === 'sub20'));
});

test('cadastro local de jogos e notícias atualiza e exclui por id', () => {
  const initial = [{ id: '1', title: 'Antes' }];
  assert.deepEqual(upsertById(initial, { id: '1', title: 'Depois' }), [{ id: '1', title: 'Depois' }]);
  assert.deepEqual(upsertById(initial, { id: '2', title: 'Novo' }).length, 2);
  assert.deepEqual(removeById(initial, '1'), []);
});

test('todas as páginas públicas, imagens e links locais foram migrados', () => {
  for (const name of ['index', 'diretoria', 'governanca', 'infraestrutura', 'etica', 'transparencia', 'comissao', 'metodologia', 'peneiras', 'privacidade', 'elenco', 'loja', '404', 'index2', 'index3']) {
    assert.ok(pages[name]?.blocks.length > 0, `${name} sem conteúdo`);
  }
  for (const [slug, page] of Object.entries(pages)) {
    for (const block of page.blocks) {
      if (block.type === 'image') assert.ok(existsSync(resolve('assets/images', block.src.slice(4))), `${slug}: ${block.src}`);
      if (block.type !== 'link' || !block.href || /^(https?:|mailto:|tel:)/.test(block.href) || block.href === '#apoie-modal') continue;
      if (block.href.startsWith('img/')) assert.ok(existsSync(resolve('assets/images', block.href.slice(4))));
      else if (block.href.endsWith('.pdf')) assert.ok(existsSync(resolve('assets/documents', block.href)));
      else {
        const target = localTarget(block.href, slug);
        assert.ok(pages[target.slug], `${slug}: rota ${block.href} ausente`);
        if (target.section) assert.ok(pages[target.slug].blocks.some(b => b.id === target.section), `${slug}: âncora ${block.href} ausente`);
      }
    }
  }
});
