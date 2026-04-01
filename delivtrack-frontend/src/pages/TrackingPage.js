import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { io } from 'socket.io-client';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const driverIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#DC2626;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  iconSize: [16, 16],
});

const STEPS = [
  { key: 'pending', label: 'Commande reçue' },
  { key: 'assigned', label: 'Livreur assigné' },
  { key: 'in_progress', label: 'Livreur en route' },
  { key: 'delivered', label: 'Livraison effectuée' },
];

const STATUS_ORDER = { pending: 0, assigned: 1, in_progress: 2, delivered: 3 };

export default function TrackingPage() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [delivered, setDelivered] = useState(false);

  useEffect(() => {
    api.get(`/orders/track/${token}`)
      .then(res => {
        setOrder(res.data);
        if (res.data.driver_lat) setDriverPos({ lat: parseFloat(res.data.driver_lat), lng: parseFloat(res.data.driver_lng) });
        if (res.data.status === 'delivered') setDelivered(true);
      })
      .catch(() => setError('Commande introuvable'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    socket.emit('track:join', { token });
    socket.on('driver:location:update', ({ latitude, longitude }) => {
      setDriverPos({ lat: latitude, lng: longitude });
    });
    socket.on('order:delivered', () => {
      setDelivered(true);
      setOrder(prev => prev ? { ...prev, status: 'delivered' } : prev);
    });
    return () => socket.disconnect();
  }, [token]);

  if (loading) return <div style={styles.centered}><div style={styles.spinner}></div><p>Chargement...</p></div>;
  if (error) return <div style={styles.centered}><h2 style={{ color: '#E24B4A' }}>❌ {error}</h2></div>;

  const currentStep = STATUS_ORDER[order?.status] ?? 0;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logoWrap}>
          <img src="/logo.png" alt="ELITE TRACK" style={{height:32,objectFit:"contain"}} />
          
        </div>
        <span style={{ fontSize: 13, color: '#9CA3AF' }}>Suivi de commande</span>
      </header>

      <div style={styles.content}>
        {/* Order info */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>Commande</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{order?.order_number}</div>
            </div>
            {delivered ? (
              <span style={styles.deliveredBadge}>✓ Livré</span>
            ) : (
              <span style={styles.activeBadge}>En cours</span>
            )}
          </div>
          <div style={styles.infoGrid}>
            <div><span style={styles.infoLabel}>Client</span><div>{order?.client_name}</div></div>
            <div><span style={styles.infoLabel}>Adresse</span><div>{order?.delivery_address}</div></div>
            {order?.driver_name && <div><span style={styles.infoLabel}>Livreur</span><div>{order.driver_name}</div></div>}
          </div>
        </div>

        {/* Progress steps */}
        <div style={styles.card}>
          <div style={styles.stepsWrap}>
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} style={styles.stepRow}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ ...styles.stepDot, background: done ? '#DC2626' : '#E5E7EB', border: `2px solid ${done ? '#DC2626' : '#E5E7EB'}` }}>
                      {done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    {i < STEPS.length - 1 && <div style={{ ...styles.stepLine, background: i < currentStep ? '#DC2626' : '#E5E7EB' }}></div>}
                  </div>
                  <div style={{ paddingBottom: i < STEPS.length - 1 ? 20 : 0 }}>
                    <div style={{ fontWeight: active ? 600 : 400, color: done ? '#1A1F2E' : '#9CA3AF', fontSize: 14 }}>{step.label}</div>
                    {active && !delivered && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 2 }}>En cours...</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map */}
        {driverPos && (
          <div style={styles.card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#1A1F2E' }}>
              Position du livreur en temps réel
            </div>
            <div style={{ height: 260, borderRadius: 10, overflow: 'hidden' }}>
              <MapContainer center={[driverPos.lat, driverPos.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}>
                  <Popup>{order?.driver_name || 'Livreur'}</Popup>
                </Marker>
              </MapContainer>
            </div>
            {delivered && <div style={styles.deliveredMsg}>🎉 Votre commande a été livrée !</div>}
          </div>
        )}

        {!driverPos && order?.status === 'in_progress' && (
          <div style={{ ...styles.card, textAlign: 'center', color: '#9CA3AF', padding: '28px 16px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
            <div>En attente de la position GPS du livreur...</div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#F5F6FA' },
  header: { background: '#1A1F2E', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { width: 26, height: 26, borderRadius: 6, background: '#DC2626' },
  logoText: { fontSize: 18, fontWeight: 700, color: '#fff' },
  content: { maxWidth: 560, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #E5E7EB' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  deliveredBadge: { background: '#FEF2F2', color: '#7F1D1D', padding: '6px 14px', borderRadius: 20, fontWeight: 600, fontSize: 13 },
  activeBadge: { background: '#EEEDFE', color: '#3C3489', padding: '6px 14px', borderRadius: 20, fontWeight: 600, fontSize: 13 },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  infoLabel: { fontSize: 12, color: '#9CA3AF', display: 'block', marginBottom: 2 },
  stepsWrap: { display: 'flex', flexDirection: 'column' },
  stepRow: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  stepDot: { width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepLine: { width: 2, height: 20, margin: '2px 0', borderRadius: 2 },
  deliveredMsg: { marginTop: 12, background: '#FEF2F2', color: '#7F1D1D', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontWeight: 500, textAlign: 'center' },
  centered: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 },
  spinner: { width: 36, height: 36, border: '3px solid #E5E7EB', borderTop: '3px solid #DC2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
