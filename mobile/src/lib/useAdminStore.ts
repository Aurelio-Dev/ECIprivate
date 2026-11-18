import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdminData, emptyAdminData } from './adminData';

const KEY = 'eci_admin_operacoes_v1';

function validData(value: unknown): value is AdminData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return ['materials', 'movements', 'students', 'collaborators', 'lessons'].every(key => Array.isArray(data[key]));
}

export function useAdminStore() {
  const [data, setData] = useState<AdminData>(emptyAdminData);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState('');
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(KEY).then(raw => {
      if (!active) return;
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (!validData(parsed)) throw new Error('Dados locais inválidos');
        setData(parsed);
      }
    }).catch(() => { if (active) { setLoadFailed(true); setError('Não foi possível carregar os registros deste dispositivo. Nenhuma alteração será gravada até resolver o problema.'); } })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready || loadFailed) return;
    queue.current = queue.current.catch(() => {}).then(() => AsyncStorage.setItem(KEY, JSON.stringify(data)))
      .catch(() => { setError('Não foi possível salvar os registros neste dispositivo.'); });
  }, [data, ready, loadFailed]);

  const update = useCallback((change: (current: AdminData) => AdminData) => setData(current => change(current)), []);
  return { data, ready, error, update };
}
