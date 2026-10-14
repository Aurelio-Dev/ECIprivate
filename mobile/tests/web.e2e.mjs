import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const base = process.env.ECI_WEB_URL || 'http://127.0.0.1:5502';
const original = process.env.ECI_ORIGINAL_URL || 'http://127.0.0.1:5501';
const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].filter(Boolean);
const executablePath = candidates.find(path => fs.existsSync(path));
if (!executablePath) throw new Error('Defina CHROME_PATH para executar o teste visual.');
const browser = await chromium.launch({ executablePath, headless: true });

async function box(page, selector) {
  const value = await page.locator(selector).first().boundingBox();
  assert(value, `Elemento não encontrado: ${selector}`);
  return value;
}

try {
  const context = await browser.newContext({ viewport: { width: 1536, height: 728 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await page.locator('.hero-title').waitFor();
  assert.match(await page.locator('.hero-title').innerText(), /Esporte Clube/i);
  for (const selector of ['.site-header', '.hero-section', '.history-editorial', '.legends-editorial-section', '.archive-section', '#categories', '#contact', '.novo-footer']) {
    assert.equal(await page.locator(selector).count(), 1, selector);
  }
  assert.equal(await page.locator('.react-admin-entry').getAttribute('href'), '/login.html');
  assert.equal(await page.locator('script[src="https://vlibras.gov.br/app/vlibras-plugin.js"]').count(), 1);
  assert.equal(await page.locator('[vw-access-button]').count(), 1);

  const reference = await context.newPage();
  await reference.goto(`${original}/index.html`, { waitUntil: 'domcontentloaded' });
  await Promise.all([page.evaluate(() => document.fonts.ready), reference.evaluate(() => document.fonts.ready)]);
  for (const selector of ['.site-header', '.hero-section', '.hero-title', '.history-editorial']) {
    const expected = await box(reference, selector);
    const actual = await box(page, selector);
    for (const key of ['x', 'y', 'width', 'height']) {
      assert(Math.abs(expected[key] - actual[key]) < 12, `${selector}.${key}: original ${expected[key]}, React ${actual[key]}`);
    }
  }
  await page.locator('.hero-button-primary').first().click();
  assert.match(await page.locator('#apoie-modal').getAttribute('class'), /is-open/);
  await page.locator('#apoie-modal [title="Copiar chave PIX"]').click();
  await page.getByText('Copiado!').waitFor();
  await page.keyboard.press('Escape');
  assert.doesNotMatch(await page.locator('#apoie-modal').getAttribute('class'), /is-open/);
  await page.locator('.site-nav .group').first().locator('.top-nav-link').click();
  assert.match(await page.locator('#dropdown-clube').getAttribute('class'), /ativo/);
  await page.locator('#dropdown-clube a[href="/diretoria.html"]').click();
  await page.waitForURL(/diretoria\.html$/);
  assert.equal(await page.locator('main').count(), 1);

  for (const slug of ['governanca', 'infraestrutura', 'etica', 'transparencia', 'comissao', 'metodologia', 'peneiras', 'privacidade', 'loja', 'elenco', 'index2', 'index3']) {
    const response = await page.goto(`${base}/${slug}.html`, { waitUntil: 'domcontentloaded' });
    assert.equal(response?.status(), 200, slug);
    assert((await page.locator('body').innerText()).length > 100, slug);
    await reference.goto(`${original}/${slug}.html`, { waitUntil: 'domcontentloaded' });
    await Promise.all([page.evaluate(() => document.fonts.ready), reference.evaluate(() => document.fonts.ready)]);
    const selector = slug === 'loja' ? '.loja-hero' : slug === 'elenco' ? '.elenco-hero' : 'main';
    const expected = await box(reference, selector);
    const actual = await box(page, selector);
    for (const key of ['x', 'y', 'width']) {
      assert(Math.abs(expected[key] - actual[key]) < 12, `${slug} ${selector}.${key}: original ${expected[key]}, React ${actual[key]}`);
    }
  }
  await reference.close();
  await page.goto(`${base}/elenco.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('.btn-filtro').nth(1).click();
  assert.equal(await page.locator('#sub17').isVisible(), true);
  assert.equal(await page.locator('#sub15').isVisible(), false);
  assert.equal((await page.request.get(`${base}/codigo_etica.pdf`)).status(), 200);

  await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.route('https://formsubmit.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
  await page.locator('#contact-name').fill('Pessoa Teste');
  await page.locator('#contact-email').fill('teste@example.com');
  await page.locator('#contact-message').fill('Mensagem de teste automatizado');
  await page.locator('#contact-form button[type="submit"]').click();
  await page.getByText('Mensagem enviada com sucesso! Entraremos em contato em breve.').waitFor();

  await page.goto(`${base}/login.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#usuario').fill('admin');
  await page.locator('#senha').fill('incorreta');
  await page.locator('.login-submit').click();
  await page.getByText(/Usuário ou senha incorretos/).waitFor();
  await page.locator('#senha').fill('eci2025');
  await page.locator('.login-submit').click();
  await page.waitForURL(/admin\.html$/);
  await page.getByText('Visão geral').first().waitFor();
  await page.getByRole('button', { name: 'Cadastrar jogo' }).click();
  await page.getByRole('dialog', { name: 'Editar jogo' }).getByLabel('Data (DD/MM/AAAA)').fill('13/10/2026');
  await page.getByRole('dialog', { name: 'Editar jogo' }).getByLabel('Adversário').fill('Equipe Teste');
  await page.getByRole('dialog', { name: 'Editar jogo' }).getByLabel('Local').fill('Campo Teste');
  await page.getByRole('dialog', { name: 'Editar jogo' }).getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Equipe Teste').waitFor();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByText('Equipe Teste').waitFor();
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.waitForURL(/login\.html$/);

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await mobilePage.evaluate(() => document.fonts.ready);
  const mobileHeroFits = await mobilePage.evaluate(() => {
    const heading = document.querySelector('.hero-title span');
    const range = document.createRange();
    range.selectNodeContents(heading);
    return range.getBoundingClientRect().right < window.innerWidth - 5;
  });
  assert(mobileHeroFits, 'O título do hero deve caber na largura móvel.');
  assert.equal(await mobilePage.locator('.hero-actions').evaluate(node => getComputedStyle(node).display), 'grid');
  await mobilePage.locator('[data-mobile-menu-button]').click();
  assert.match(await mobilePage.locator('[data-mobile-menu]').getAttribute('class'), /is-open/);
  assert.equal(await mobilePage.locator('[data-mobile-menu] a[href="/login.html"]').count(), 1);
  await mobilePage.locator('[data-mobile-menu] a[href="/login.html"]').click();
  await mobilePage.waitForURL(/login\.html$/);
  await mobile.close();
  await context.close();
  console.log('Teste web: estrutura, comparação visual, navegação, modal, elenco, contato, login, painel, VLibras e menu móvel passaram.');
} finally {
  await browser.close();
}
