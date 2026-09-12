import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const attendees = [
  { initials: 'AT', name: 'Atakan T.', title: 'Product lead' },
  { initials: 'EB', name: 'Elif B.', title: 'Design director' },
  { initials: 'MK', name: 'Mert K.', title: 'Engineering lead' },
  { initials: 'SA', name: 'Selin A.', title: 'Operations manager' },
];

export default function App() {
  return <SafeAreaView style={styles.screen}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.brand}><Text style={styles.brandMark}>o</Text> overheard</Text>
    <Text style={styles.eyebrow}>EVENTS · SEPTEMBER 2026</Text><Text style={styles.title}>Your meeting{`\n`}memory.</Text>
    <View style={styles.eventCard}><View style={styles.dateBlock}><Text style={styles.day}>12</Text><Text style={styles.month}>SEP</Text></View><View style={styles.eventBody}><Text style={styles.eventKind}>HYBRID EVENT</Text><Text style={styles.eventTitle}>Product weekly</Text><Text style={styles.meta}>10:30 – 11:15 · Atlas · Room 04</Text></View></View>
    <View style={styles.boardNotice}><Text style={styles.boardIcon}>▱</Text><View><Text style={styles.boardTitle}>Presentation board available</Text><Text style={styles.boardText}>The room is ready for shared presentations.</Text></View></View>
    <Section title={`ATTENDEES  ${attendees.length}`}>{attendees.map((attendee, index) => <View key={attendee.initials} style={styles.personRow}><View style={[styles.avatar, index === 1 && styles.blueAvatar, index === 2 && styles.peachAvatar]}><Text style={styles.avatarText}>{attendee.initials}</Text></View><View><Text style={styles.personName}>{attendee.name}</Text><Text style={styles.personTitle}>{attendee.title}</Text></View></View>)}</Section>
    <Section title="TOPICS TO TALK ABOUT"><Text style={styles.topicTitle}>Autumn launch</Text><Text style={styles.bullet}>— Review final launch scope</Text><Text style={styles.bullet}>— Confirm the demo flow</Text><Text style={[styles.topicTitle, styles.spaced]}>Signals from the team</Text><Text style={styles.bullet}>— Open commitments and blockers</Text></Section>
    <Section title="NOTES & TO-DOS"><Text style={styles.todo}>□  Share launch deck with design</Text><Text style={[styles.todo, styles.complete]}>✓  Confirm speaker order</Text></Section>
  </ScrollView></SafeAreaView>;
}

function Section({ title, children }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f1ea' }, content: { padding: 24, paddingBottom: 48 }, brand: { color: '#263a33', fontSize: 20, fontWeight: '700', marginBottom: 46 }, brandMark: { color: '#718b65', fontSize: 29, fontStyle: 'italic' }, eyebrow: { color: '#778178', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }, title: { color: '#263a33', fontSize: 42, fontWeight: '600', letterSpacing: -1.6, lineHeight: 45, marginTop: 10, marginBottom: 27 },
  eventCard: { backgroundColor: '#fffefa', borderColor: '#e4e0d7', borderWidth: 1, borderRadius: 14, flexDirection: 'row', padding: 18 }, dateBlock: { alignItems: 'center', borderRightColor: '#e8e4db', borderRightWidth: 1, justifyContent: 'center', marginRight: 16, paddingRight: 16 }, day: { color: '#2e372d', fontSize: 25, fontWeight: '700' }, month: { color: '#7a9070', fontSize: 10, fontWeight: '700', letterSpacing: 1 }, eventBody: { flex: 1 }, eventKind: { color: '#758a69', fontSize: 9, fontWeight: '700', letterSpacing: 1 }, eventTitle: { color: '#27332b', fontSize: 20, fontWeight: '700', marginTop: 4 }, meta: { color: '#71766d', fontSize: 12, marginTop: 5 },
  boardNotice: { backgroundColor: '#e9efd8', borderRadius: 10, flexDirection: 'row', gap: 11, marginTop: 16, padding: 13 }, boardIcon: { color: '#6f8663', fontSize: 24 }, boardTitle: { color: '#425040', fontSize: 12, fontWeight: '700' }, boardText: { color: '#66705f', fontSize: 11, marginTop: 3 }, section: { borderTopColor: '#dedad0', borderTopWidth: 1, marginTop: 29, paddingTop: 20 }, sectionTitle: { color: '#778178', fontSize: 10, fontWeight: '700', letterSpacing: 1.1, marginBottom: 14 },
  personRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 }, avatar: { alignItems: 'center', backgroundColor: '#dce7a8', borderRadius: 18, height: 36, justifyContent: 'center', marginRight: 11, width: 36 }, blueAvatar: { backgroundColor: '#c4dbe1' }, peachAvatar: { backgroundColor: '#e8c8b7' }, avatarText: { color: '#455746', fontSize: 10, fontWeight: '700' }, personName: { color: '#374039', fontSize: 13, fontWeight: '700' }, personTitle: { color: '#7a7e75', fontSize: 11, marginTop: 2 }, topicTitle: { color: '#3a433c', fontSize: 14, fontWeight: '700', marginBottom: 8 }, spaced: { marginTop: 19 }, bullet: { color: '#626860', fontSize: 13, marginBottom: 6 }, todo: { color: '#4a5049', fontSize: 13, marginBottom: 12 }, complete: { color: '#979b94', textDecorationLine: 'line-through' },
});
