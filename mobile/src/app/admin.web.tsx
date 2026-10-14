import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Head from 'expo-router/head';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSession, logout, Session } from '../lib/session';
import { removeById, upsertById } from '../lib/logic';

type Game = { id: string; date: string; opponent: string; place: string; status: string };
type News = { id: string; title: string; date: string; status: string };
const GAMES_KEY = 'eci_admin_games';
const NEWS_KEY = 'eci_admin_news';
const initialGames: Game[] = [
  { id: '1', date: '21/09/2026', opponent: 'Associação Atlética Regional', place: 'Campo do ECI', status: 'Confirmado' },
  { id: '2', date: '28/09/2026', opponent: 'Projeto Esportivo Sorocaba', place: 'Centro esportivo regional', status: 'A confirmar' },
  { id: '3', date: '05/10/2026', opponent: 'Clube Atlético do Interior', place: 'Campo municipal de Itapetininga', status: 'Confirmado' },
  { id: '4', date: '12/10/2026', opponent: 'União Esportiva da Região', place: 'Arena comunitária', status: 'A confirmar' },
];
const initialNews: News[] = [
  { id: '1', title: 'Inscrições abertas para avaliação das categorias de base', date: '12/09/2026', status: 'Publicada' },
  { id: '2', title: 'Programação de treinos da próxima semana', date: '10/09/2026', status: 'Rascunho' },
  { id: '3', title: 'Encontro com famílias dos atletas da base', date: '08/09/2026', status: 'Publicada' },
];

export default function WebAdmin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [games, setGames] = useState<Game[]>(initialGames);
  const [news, setNews] = useState<News[]>(initialNews);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    document.body.classList.add('admin-page');
    void (async () => {
      const current = await getSession();
      if (!current) { window.location.replace('/login.html'); return; }
      setSession(current);
      try {
        const [storedGames, storedNews] = await Promise.all([AsyncStorage.getItem(GAMES_KEY), AsyncStorage.getItem(NEWS_KEY)]);
        if (storedGames) setGames(JSON.parse(storedGames));
        if (storedNews) setNews(JSON.parse(storedNews));
      } catch { setNotice('Os dados locais não puderam ser carregados.'); }
      setReady(true);
    })();
    return () => document.body.classList.remove('admin-page');
  }, []);
  useEffect(() => { document.body.classList.toggle('admin-nav-aberta', navOpen); return () => document.body.classList.remove('admin-nav-aberta'); }, [navOpen]);

  const saveGames = (updated: Game[]) => { setGames(updated); void AsyncStorage.setItem(GAMES_KEY, JSON.stringify(updated)).catch(() => setNotice('Não foi possível salvar os jogos.')); };
  const saveNews = (updated: News[]) => { setNews(updated); void AsyncStorage.setItem(NEWS_KEY, JSON.stringify(updated)).catch(() => setNotice('Não foi possível salvar as notícias.')); };
  const submitGame = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingGame?.date.trim() || !editingGame.opponent.trim() || !editingGame.place.trim()) { setNotice('Preencha data, adversário e local.'); return; }
    saveGames(upsertById(games, editingGame)); setEditingGame(null); setNotice('Jogo salvo neste dispositivo.');
  };
  const submitNews = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingNews?.title.trim()) { setNotice('Informe o título da notícia.'); return; }
    saveNews(upsertById(news, editingNews)); setEditingNews(null); setNotice('Notícia salva neste dispositivo.');
  };
  return <>
    <Head><title>Painel administrativo — Esporte Clube Itapetininga</title><meta name="robots" content="noindex,nofollow" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@500;600;700&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="/admin.css" /><link rel="stylesheet" href="/site-react.css" /><link rel="stylesheet" href="/admin-react.css" />
    </Head>
    {!ready ? <p className="admin-react-loading">Verificando acesso...</p> : <>
      <a className="skip-link" href="#conteudo">Ir para o conteúdo principal</a>
      <header className="admin-topbar"><button className="admin-topbar__menu" type="button" aria-expanded={navOpen} aria-controls="admin-nav" onClick={() => setNavOpen(value => !value)}>Menu</button><a className="admin-topbar__brand" href="/index.html"><img src="/img/eci.png" alt="" width="36" height="36" /><span>EC Itapetininga</span></a><div className="admin-topbar__user"><span className="admin-topbar__greeting">Conectado como <strong>{session?.usuario}</strong></span><button className="admin-topbar__logout" type="button" onClick={async () => { await logout(); window.location.replace('/login.html'); }}>Sair</button></div></header>
      <div className="admin-shell"><nav className="admin-nav" id="admin-nav" aria-label="Seções do painel"><ul className="admin-nav__list">
        <li><a className="admin-nav__link admin-nav__link--ativo" href="#conteudo">Visão geral</a></li><li><a className="admin-nav__link" href="#secao-jogos">Agenda de jogos</a></li><li><a className="admin-nav__link" href="#secao-noticias">Notícias</a></li><li><a className="admin-nav__link" href="#secao-atletas">Atletas da base</a></li><li><a className="admin-nav__link" href="/transparencia.html">Transparência</a></li><li><a className="admin-nav__link" href="/index.html">Ver site público</a></li>
      </ul></nav><main className="admin-main" id="conteudo">
        <div className="admin-aviso" role="note">Ambiente de demonstração acadêmica. As alterações ficam salvas apenas neste dispositivo e não atualizam o site público.</div>
        <h1 className="admin-title">Visão geral</h1>
        {notice && <p className="admin-react-notice" role="status">{notice}</p>}
        <section className="admin-cards" aria-label="Indicadores do clube"><article className="admin-card"><p className="admin-card__valor">128</p><h3 className="admin-card__rotulo">Atletas na base</h3><p className="admin-card__nota">Categorias sub-13 a sub-20</p></article><article className="admin-card"><p className="admin-card__valor">{games.length}</p><h3 className="admin-card__rotulo">Jogos cadastrados</h3><p className="admin-card__nota">Dados deste dispositivo</p></article><article className="admin-card"><p className="admin-card__valor">{news.length}</p><h3 className="admin-card__rotulo">Notícias cadastradas</h3><p className="admin-card__nota">Dados deste dispositivo</p></article><article className="admin-card"><p className="admin-card__valor">R$ 18.400</p><h3 className="admin-card__rotulo">Apoios recebidos</h3><p className="admin-card__nota">Valor ilustrativo</p></article></section>
        <section className="admin-secao" id="secao-jogos" aria-labelledby="titulo-jogos"><div className="admin-secao__cabecalho"><h2 className="admin-secao__titulo" id="titulo-jogos">Próximos jogos</h2><button className="admin-botao" type="button" onClick={() => setEditingGame({ id: String(Date.now()), date: '', opponent: '', place: '', status: 'A confirmar' })}>Cadastrar jogo</button></div><div className="admin-tabela-wrap"><table className="admin-tabela"><caption className="sr-only">Lista dos próximos jogos, com data, adversário, local e situação</caption><thead><tr><th>Data</th><th>Adversário</th><th>Local</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{games.map(game => <tr key={game.id}><td>{game.date}</td><td>{game.opponent}</td><td>{game.place}</td><td><span className={`admin-tag admin-tag--${game.status === 'Confirmado' ? 'confirmado' : 'pendente'}`}>{game.status}</span></td><td><div className="admin-tabela__acoes"><button className="admin-link-botao" type="button" onClick={() => setEditingGame({ ...game })}>Editar</button><button className="admin-link-botao" type="button" onClick={() => saveGames(removeById(games, game.id))}>Excluir</button></div></td></tr>)}</tbody></table></div></section>
        <section className="admin-secao" id="secao-noticias" aria-labelledby="titulo-noticias"><div className="admin-secao__cabecalho"><h2 className="admin-secao__titulo" id="titulo-noticias">Últimas notícias</h2><button className="admin-botao" type="button" onClick={() => setEditingNews({ id: String(Date.now()), title: '', date: new Date().toLocaleDateString('pt-BR'), status: 'Rascunho' })}>Escrever notícia</button></div><ul className="admin-lista">{news.map(item => <li className="admin-lista__item" key={item.id}><span className="admin-lista__titulo">{item.title}</span><span className="admin-lista__meta"><time>{item.date}</time><span className={`admin-tag admin-tag--${item.status === 'Publicada' ? 'confirmado' : 'pendente'}`}>{item.status}</span><button className="admin-link-botao" type="button" onClick={() => setEditingNews({ ...item })}>Editar</button><button className="admin-link-botao" type="button" onClick={() => saveNews(removeById(news, item.id))}>Excluir</button></span></li>)}</ul></section>
        <section className="admin-secao" id="secao-atletas" aria-labelledby="titulo-atletas"><h2 className="admin-secao__titulo" id="titulo-atletas">Atletas da base</h2><p className="admin-secao__texto">O cadastro completo de atletas será integrado em uma próxima etapa do projeto.</p></section>
      </main></div>
    </>}
    {editingGame && <div className="admin-react-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setEditingGame(null); }}><form className="admin-react-editor" role="dialog" aria-modal="true" aria-label="Editar jogo" onSubmit={submitGame}><h2>{games.some(game => game.id === editingGame.id) ? 'Editar jogo' : 'Cadastrar jogo'}</h2><label>Data (DD/MM/AAAA)<input value={editingGame.date} onChange={event => setEditingGame({ ...editingGame, date: event.target.value })} required /></label><label>Adversário<input value={editingGame.opponent} onChange={event => setEditingGame({ ...editingGame, opponent: event.target.value })} required /></label><label>Local<input value={editingGame.place} onChange={event => setEditingGame({ ...editingGame, place: event.target.value })} required /></label><label>Situação<select value={editingGame.status} onChange={event => setEditingGame({ ...editingGame, status: event.target.value })}><option>Confirmado</option><option>A confirmar</option></select></label><div className="admin-react-editor-actions"><button type="button" onClick={() => setEditingGame(null)}>Cancelar</button><button type="submit">Salvar</button></div></form></div>}
    {editingNews && <div className="admin-react-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setEditingNews(null); }}><form className="admin-react-editor" role="dialog" aria-modal="true" aria-label="Editar notícia" onSubmit={submitNews}><h2>{news.some(item => item.id === editingNews.id) ? 'Editar notícia' : 'Escrever notícia'}</h2><label>Título<input value={editingNews.title} onChange={event => setEditingNews({ ...editingNews, title: event.target.value })} required /></label><label>Data<input value={editingNews.date} onChange={event => setEditingNews({ ...editingNews, date: event.target.value })} /></label><label>Situação<select value={editingNews.status} onChange={event => setEditingNews({ ...editingNews, status: event.target.value })}><option>Publicada</option><option>Rascunho</option></select></label><div className="admin-react-editor-actions"><button type="button" onClick={() => setEditingNews(null)}>Cancelar</button><button type="submit">Salvar</button></div></form></div>}
  </>;
}
