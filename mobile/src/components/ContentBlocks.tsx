import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { openHref } from '../lib/navigation';
import { colors, fonts } from '../lib/theme';
import { imageSources } from '../data/imageSources';
import { useApp } from './Shell';

export type Block = { type: 'anchor' | 'text' | 'image' | 'link' | 'filter'; id?: string; tag?: string; text?: string; src?: string; alt?: string; href?: string };

export function ContentBlocks({ blocks, slug = 'index', onAnchor }: { blocks: Block[]; slug?: string; onAnchor?: (id: string, y: number) => void }) {
  const { contrast, fontScale, openSupport, setReadableText } = useApp();
  useEffect(() => { setReadableText(blocks.filter(b => b.type === 'text').map(b => b.text).join('. ')); }, [blocks, setReadableText]);
  const textColor = contrast ? '#fff' : colors.ink;
  return <View style={[styles.container, contrast && { backgroundColor: '#000' }]}>
    {blocks.map((block, index) => {
      if (block.type === 'anchor') return <View key={`${index}-anchor`} onLayout={e => block.id && onAnchor?.(block.id, e.nativeEvent.layout.y)} />;
      if (block.type === 'image') return <Image key={`${index}-image`} source={imageSources[block.src || ''] || imageSources['img/eci.png']} accessibilityLabel={block.alt || 'Imagem do EC Itapetininga'} resizeMode="cover" style={styles.image} />;
      if (block.type === 'link' && block.href) return <Pressable key={`${index}-link`} accessibilityRole="link" onPress={() => void openHref(block.href!, openSupport, slug)} style={styles.link}><Text style={[styles.linkText, { fontSize: 16 * fontScale }]}>{block.text?.replace(/\b(arrow_forward|shopping_cart|arrow_upward|home)\b/g, '').trim()}  →</Text></Pressable>;
      if (block.type === 'filter') return null;
      const heading = block.tag?.startsWith('h');
      const level = block.tag === 'h1' ? 1 : block.tag === 'h2' ? 2 : block.tag === 'h3' ? 3 : 4;
      return <Text key={`${index}-text`} onLayout={e => block.id && onAnchor?.(block.id, e.nativeEvent.layout.y)} accessibilityRole={heading ? 'header' : undefined} style={[styles.text, { color: textColor, fontSize: (heading ? level === 1 ? 48 : level === 2 ? 38 : level === 3 ? 25 : 20 : block.tag === 'li' ? 16 : 17) * fontScale }, heading && styles.heading, level === 1 && styles.h1, level === 2 && styles.h2, block.tag === 'li' && styles.list]}>{block.tag === 'li' ? '•  ' : ''}{block.text}</Text>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 36, paddingBottom: 72, backgroundColor: '#fff' },
  image: { width: '100%', height: 280, borderRadius: 9, marginTop: 22, marginBottom: 24, backgroundColor: colors.pale },
  text: { fontFamily: fonts.body, lineHeight: 28, marginBottom: 14 },
  heading: { fontFamily: fonts.condensed, lineHeight: undefined, color: colors.navy, marginTop: 28, marginBottom: 14 },
  h1: { textTransform: 'uppercase', marginTop: 12, marginBottom: 24 },
  h2: { textTransform: 'uppercase', borderLeftWidth: 5, borderLeftColor: colors.gold, paddingLeft: 14 },
  list: { paddingLeft: 12 },
  link: { alignSelf: 'flex-start', backgroundColor: colors.gold, paddingHorizontal: 18, paddingVertical: 11, marginBottom: 16, marginTop: 2, borderRadius: 3 },
  linkText: { color: colors.navy, fontFamily: fonts.condensed, letterSpacing: 1 },
});
