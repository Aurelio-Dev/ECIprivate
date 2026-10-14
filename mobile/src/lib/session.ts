import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { validCredentials } from './logic';

const KEY = 'eci_sessao_admin';
let temporarySession: Session | null = null;

export type Session = { usuario: string; entradaEm: string };

function browserSession(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try { return window.sessionStorage; } catch { return null; }
}

export async function getSession(): Promise<Session | null> {
  if (temporarySession) return temporarySession;
  try {
    const raw = browserSession()?.getItem(KEY) ?? await AsyncStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : null;
    return value && typeof value.usuario === 'string' ? value : null;
  } catch { return null; }
}

export async function login(usuario: string, senha: string, remember: boolean): Promise<boolean> {
  // Academic demo only. Production authentication requires a server.
  if (!validCredentials(usuario, senha)) return false;
  const session = { usuario: 'admin', entradaEm: new Date().toISOString() };
  temporarySession = session;
  await AsyncStorage.removeItem(KEY);
  browserSession()?.removeItem(KEY);
  if (remember) await AsyncStorage.setItem(KEY, JSON.stringify(session));
  else browserSession()?.setItem(KEY, JSON.stringify(session));
  return true;
}

export async function logout() {
  temporarySession = null;
  browserSession()?.removeItem(KEY);
  await AsyncStorage.removeItem(KEY);
}
