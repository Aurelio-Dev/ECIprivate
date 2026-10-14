export type ContactValues = { name: string; email: string; subject: string; message: string };

export function validCredentials(usuario: string, senha: string): boolean {
  return usuario.trim() === 'admin' && senha === 'eci2025';
}

export function validContact(values: ContactValues): boolean {
  return !!values.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) && !!values.message.trim();
}

export function contactForm(values: ContactValues): FormData {
  const form = new FormData();
  form.append('_captcha', 'false');
  form.append('_subject', 'Novo contato pelo site do Clube!');
  form.append('Nome', values.name.trim());
  form.append('Email', values.email.trim());
  form.append('Assunto', values.subject);
  form.append('Mensagem', values.message.trim());
  return form;
}

export function localTarget(href: string, currentSlug = 'index') {
  const [file, fragment] = href.split('#');
  const slug = file ? file.replace(/\.html$/i, '') : currentSlug;
  return { slug: slug || 'index', section: fragment || undefined };
}

export function rosterBlocks<T extends { type: string; id?: string }>(blocks: T[], category: string): T[] {
  const rosterIds = ['sub15', 'sub17', 'sub20'];
  const first = blocks.findIndex(b => b.type === 'anchor' && b.id === 'sub15');
  const start = blocks.findIndex(b => b.type === 'anchor' && b.id === category);
  if (first < 0 || start < 0) return blocks;
  const next = blocks.findIndex((b, i) => i > start && b.type === 'anchor' && rosterIds.includes(b.id || ''));
  return [...blocks.slice(0, first).filter(b => b.type !== 'filter'), ...blocks.slice(start, next < 0 ? undefined : next)];
}

export function upsertById<T extends { id: string }>(items: T[], value: T): T[] {
  return [...items.filter(item => item.id !== value.id), value];
}

export function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter(item => item.id !== id);
}
