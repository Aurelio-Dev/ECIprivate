import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PageShell } from '../components/Shell';
import { getSession, logout, Session } from '../lib/session';
import { colors, fonts } from '../lib/theme';
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

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [games, setGames] = useState<Game[]>(initialGames);
  const [news, setNews] = useState<News[]>(initialNews);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    void (async () => {
      const current = await getSession();
      if (!current) { router.replace('/login'); return; }
      setSession(current);
      try {
        const [storedGames, storedNews] = await Promise.all([AsyncStorage.getItem(GAMES_KEY), AsyncStorage.getItem(NEWS_KEY)]);
        if (storedGames) setGames(JSON.parse(storedGames));
        if (storedNews) setNews(JSON.parse(storedNews));
      } catch { setNotice('Os dados locais não puderam ser carregados.'); }
      setReady(true);
    })();
  }, []);
  const saveGames = (updated: Game[]) => { setGames(updated); void AsyncStorage.setItem(GAMES_KEY, JSON.stringify(updated)).catch(() => setNotice('Não foi possível salvar os jogos.')); };
  const saveNews = (updated: News[]) => { setNews(updated); void AsyncStorage.setItem(NEWS_KEY, JSON.stringify(updated)).catch(() => setNotice('Não foi possível salvar as notícias.')); };
  if (!ready) return <><Head><title>Painel administrativo — EC Itapetininga</title><meta name="robots" content="noindex,nofollow" /></Head><View style={styles.loading}><Text>Verificando acesso...</Text></View></>;
  return <PageShell includeFooter={false}><Head><title>Painel administrativo — EC Itapetininga</title><meta name="robots" content="noindex,nofollow" /></Head><View style={styles.page}>
    <View style={styles.top}><View><Text style={styles.eyebrow}>PAINEL ADMINISTRATIVO</Text><Text accessibilityRole="header" style={styles.title}>VISÃO GERAL</Text><Text style={styles.greeting}>Conectado como {session?.usuario}</Text></View><Pressable onPress={async () => { await logout(); router.replace('/login'); }} style={styles.logout} accessibilityRole="button"><Text style={styles.logoutText}>SAIR</Text></Pressable></View>
    <Text style={styles.demo}>Ambiente de demonstração acadêmica. As alterações ficam salvas apenas neste dispositivo e não atualizam o site público.</Text>
    {!!notice && <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text>}
    <View style={styles.cards}>{[['128', 'Atletas na base'], [String(games.length), 'Jogos cadastrados'], [String(news.length), 'Notícias cadastradas'], ['R$ 18.400', 'Apoios recebidos']].map(([value, label]) => <View key={label} style={styles.card}><Text style={styles.cardValue}>{value}</Text><Text style={styles.cardLabel}>{label}</Text></View>)}</View>
    <View style={styles.sectionHead}><Text accessibilityRole="header" style={styles.sectionTitle}>AGENDA DE JOGOS</Text><Pressable onPress={() => setEditingGame({ id: String(Date.now()), date: '', opponent: '', place: '', status: 'A confirmar' })} style={styles.add} accessibilityRole="button"><Text style={styles.addText}>+ CADASTRAR JOGO</Text></Pressable></View>
    {games.map(game => <View key={game.id} style={styles.row}><View style={styles.rowInfo}><Text style={styles.rowTitle}>{game.opponent}</Text><Text style={styles.rowMeta}>{game.date} · {game.place} · {game.status}</Text></View><Pressable onPress={() => setEditingGame(game)} accessibilityRole="button"><Text style={styles.rowAction}>Editar</Text></Pressable><Pressable onPress={() => saveGames(removeById(games, game.id))} accessibilityRole="button"><Text style={styles.rowAction}>Excluir</Text></Pressable></View>)}
    <View style={styles.sectionHead}><Text accessibilityRole="header" style={styles.sectionTitle}>NOTÍCIAS</Text><Pressable onPress={() => setEditingNews({ id: String(Date.now()), title: '', date: new Date().toLocaleDateString('pt-BR'), status: 'Rascunho' })} style={styles.add} accessibilityRole="button"><Text style={styles.addText}>+ ESCREVER NOTÍCIA</Text></Pressable></View>
    {news.map(item => <View key={item.id} style={styles.row}><View style={styles.rowInfo}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.rowMeta}>{item.date} · {item.status}</Text></View><Pressable onPress={() => setEditingNews(item)} accessibilityRole="button"><Text style={styles.rowAction}>Editar</Text></Pressable><Pressable onPress={() => saveNews(removeById(news, item.id))} accessibilityRole="button"><Text style={styles.rowAction}>Excluir</Text></Pressable></View>)}
    <View style={styles.sectionHead}><Text accessibilityRole="header" style={styles.sectionTitle}>ATLETAS DA BASE</Text></View><Text style={styles.rowMeta}>O cadastro completo de atletas será integrado em uma próxima etapa do projeto.</Text>
    <Pressable onPress={() => router.push({ pathname: '/[slug]', params: { slug: 'transparencia' } })} accessibilityRole="link"><Text style={styles.bottomLink}>Portal da Transparência →</Text></Pressable>
  </View>
  <Modal visible={!!editingGame} transparent animationType="fade" onRequestClose={() => setEditingGame(null)} accessibilityViewIsModal><View style={styles.backdrop}><View style={styles.editor}><Text style={styles.editorTitle}>{games.some(g => g.id === editingGame?.id) ? 'EDITAR JOGO' : 'CADASTRAR JOGO'}</Text>{(['date', 'opponent', 'place'] as const).map(field => <View key={field}><Text style={styles.fieldLabel}>{field === 'date' ? 'DATA (DD/MM/AAAA)' : field === 'opponent' ? 'ADVERSÁRIO' : 'LOCAL'}</Text><TextInput value={editingGame?.[field] || ''} onChangeText={text => setEditingGame(current => current ? { ...current, [field]: text } : null)} style={styles.input} /></View>)}<Pressable onPress={() => setEditingGame(current => current ? { ...current, status: current.status === 'Confirmado' ? 'A confirmar' : 'Confirmado' } : null)}><Text style={styles.status}>Situação: {editingGame?.status} (toque para alterar)</Text></Pressable><View style={styles.editorActions}><Pressable onPress={() => setEditingGame(null)}><Text style={styles.rowAction}>Cancelar</Text></Pressable><Pressable onPress={() => { if (!editingGame?.date.trim() || !editingGame.opponent.trim() || !editingGame.place.trim()) { setNotice('Preencha data, adversário e local.'); return; } saveGames(upsertById(games, editingGame)); setEditingGame(null); setNotice('Jogo salvo neste dispositivo.'); }} style={styles.add}><Text style={styles.addText}>SALVAR</Text></Pressable></View></View></View></Modal>
  <Modal visible={!!editingNews} transparent animationType="fade" onRequestClose={() => setEditingNews(null)} accessibilityViewIsModal><View style={styles.backdrop}><View style={styles.editor}><Text style={styles.editorTitle}>{news.some(n => n.id === editingNews?.id) ? 'EDITAR NOTÍCIA' : 'ESCREVER NOTÍCIA'}</Text><Text style={styles.fieldLabel}>TÍTULO</Text><TextInput value={editingNews?.title || ''} onChangeText={text => setEditingNews(current => current ? { ...current, title: text } : null)} style={styles.input} /><Text style={styles.fieldLabel}>DATA</Text><TextInput value={editingNews?.date || ''} onChangeText={text => setEditingNews(current => current ? { ...current, date: text } : null)} style={styles.input} /><Pressable onPress={() => setEditingNews(current => current ? { ...current, status: current.status === 'Publicada' ? 'Rascunho' : 'Publicada' } : null)}><Text style={styles.status}>Situação: {editingNews?.status} (toque para alterar)</Text></Pressable><View style={styles.editorActions}><Pressable onPress={() => setEditingNews(null)}><Text style={styles.rowAction}>Cancelar</Text></Pressable><Pressable onPress={() => { if (!editingNews?.title.trim()) { setNotice('Informe o título da notícia.'); return; } saveNews(upsertById(news, editingNews)); setEditingNews(null); setNotice('Notícia salva neste dispositivo.'); }} style={styles.add}><Text style={styles.addText}>SALVAR</Text></Pressable></View></View></View></Modal>
  </PageShell>;
}

const styles = StyleSheet.create({ loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }, page: { width: '100%', maxWidth: 1160, alignSelf: 'center', padding: 24, paddingBottom: 80, backgroundColor: '#fff' }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 25 }, eyebrow: { color: '#a48000', fontFamily: fonts.bold, letterSpacing: 2 }, title: { color: colors.navy, fontFamily: fonts.display, fontSize: 52 }, greeting: { color: colors.muted, fontFamily: fonts.body }, logout: { backgroundColor: colors.navy, paddingHorizontal: 18, paddingVertical: 12 }, logoutText: { color: '#fff', fontFamily: fonts.bold }, demo: { backgroundColor: '#fff5d2', color: colors.ink, fontFamily: fonts.body, padding: 16, lineHeight: 23 }, notice: { color: colors.blue, paddingVertical: 8, fontFamily: fonts.medium }, cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginVertical: 28 }, card: { flexGrow: 1, flexBasis: 180, backgroundColor: colors.navy, padding: 22, borderTopWidth: 5, borderTopColor: colors.gold }, cardValue: { color: colors.gold, fontFamily: fonts.display, fontSize: 37 }, cardLabel: { color: '#fff', fontFamily: fonts.medium }, sectionHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 2, borderBottomColor: colors.gold, marginTop: 30, marginBottom: 12, paddingBottom: 8 }, sectionTitle: { color: colors.navy, fontFamily: fonts.condensed, fontSize: 28 }, add: { backgroundColor: colors.gold, paddingHorizontal: 15, paddingVertical: 10 }, addText: { color: colors.navy, fontFamily: fonts.bold, fontSize: 12 }, row: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 14, flexDirection: 'row', gap: 16, alignItems: 'center' }, rowInfo: { flex: 1 }, rowTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15 }, rowMeta: { color: colors.muted, fontFamily: fonts.body, lineHeight: 23 }, rowAction: { color: colors.blue, fontFamily: fonts.medium, textDecorationLine: 'underline' }, bottomLink: { color: colors.blue, fontFamily: fonts.medium, marginTop: 35, textDecorationLine: 'underline' }, backdrop: { flex: 1, backgroundColor: '#061a4bbd', justifyContent: 'center', padding: 18 }, editor: { width: '100%', maxWidth: 500, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 24, gap: 7 }, editorTitle: { color: colors.navy, fontFamily: fonts.condensed, fontSize: 30 }, fieldLabel: { color: colors.navy, fontFamily: fonts.bold, fontSize: 12, marginTop: 10 }, input: { borderWidth: 1, borderColor: colors.border, padding: 12, fontFamily: fonts.body }, status: { color: colors.blue, fontFamily: fonts.medium, marginVertical: 16 }, editorActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20 } });
