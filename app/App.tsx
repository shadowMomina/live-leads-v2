import React, { useEffect, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { io } from 'socket.io-client';

type Lead = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

// 10.0.2.2 is how the Android emulator reaches the host computer
const SERVER_URL = 'http://10.0.2.2:3000';

function formatTime(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SERVER_URL);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // leads the server already has when we connect
    socket.on('initialLeads', (existing: Lead[]) => setLeads(existing));

    // a brand-new lead arriving live
    socket.on('newLead', (lead: Lead) => {
      setLeads(prev =>
        prev.some(l => l.id === lead.id) ? prev : [lead, ...prev],
      );
    });

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Live Leads</Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, connected ? styles.dotOn : styles.dotOff]} />
          <Text style={styles.statusText}>
            {connected ? 'Connected' : 'Reconnecting...'}
          </Text>
        </View>
        <Text style={styles.count}>{leads.length} leads</Text>
      </View>

      <FlatList
        data={leads}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Waiting for leads...</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', paddingTop: 56 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  dotOn: { backgroundColor: '#1a9c4a' },
  dotOff: { backgroundColor: '#d33' },
  statusText: { color: '#555' },
  count: { marginTop: 4, color: '#888' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { marginTop: 32, textAlign: 'center', color: '#888' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: '600', color: '#111' },
  email: { marginTop: 2, color: '#444' },
  time: { marginTop: 6, fontSize: 12, color: '#999' },
});