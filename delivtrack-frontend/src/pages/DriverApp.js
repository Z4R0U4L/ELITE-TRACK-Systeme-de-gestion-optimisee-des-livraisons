import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function DriverApp() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [watchId, setWatchId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/driver');
      setOrders(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/users/notifications');
      setNotifications(res.data.filter(n => !n.is_read));
    } catch {}
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchNotifications();
    const socket = getSocket();
    if (socket) {
      socket.on('order:status:update', fetchOrders);
    }
    return () => { if (socket) socket.off('order:status:update', fetchOrders); };
  }, [fetchOrders, fetchNotifications]);

  const toggleGPS = () => {
    const socket = getSocket();
    if (!socket) return toast.error('Connexion perdue');

    if (isSharing) {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.emit('driver:sharing', { is_sharing: false });
      setIsSharing(false);
      setWatchId(null);
      toast('GPS désactivé');
    } else {
      if (!navigator.geolocation) return toast.error('Géolocalisation non supportée');
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          socket.emit('driver:location', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => toast.error('Erreur GPS: ' + err.message),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
      socket.emit('driver:sharing', { is_sharing: true });
      setWatchId(id);
      setIsSharing(true);
      toast.success('GPS activé — position partagée');
    }
  };

  const confirmDelivery = async (order) => {
    if (!window.confirm(`Confirmer la livraison de ${order.order_number}?`)) return;
    const socket = getSocket();
    if (socket) socket.emit('order:delivered', { order_id: order.id });
    toast.success('Livraison confirmée!');
    fetchOrders();
  };

  const startDelivery = async (order_id) => {
    try {
      await api.patch(`/orders/${order_id}/status`, { status: 'in_progress' });
      toast.success('Livraison démarrée!');
      fetchOrders();
    } catch { toast.error('Erreur'); }
  };

  const STATUS_COLORS = { assigned: '#185FA5', in_progress: '#7F77DD' };
  const STATUS_LABELS = { assigned: 'Assignée', in_progress: 'En cours' };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="ELITE TRACK" style={{height:32,objectFit:"contain"}} />
          
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={styles.userChip}>
            <div style={styles.avatar}>{user?.name?.[0]}</div>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{user?.name}</span>
          </div>
          <button onClick={logout} style={styles.logoutBtn}>Déconnexion</button>
        </div>
      </header>

      <div style={styles.content}>
        {/* GPS Card */}
        <div style={{ ...styles.gpsCard, background: isSharing ? '#FEF2F2' : '#F5F6FA', border: `2px solid ${isSharing ? '#DC2626' : '#E5E7EB'}` }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: isSharing ? '#7F1D1D' : '#1A1F2E' }}>
              Partage de localisation
            </div>
            <div style={{ fontSize: 13, color: isSharing ? '#DC2626' : '#9CA3AF', marginTop: 4 }}>
              {isSharing ? 'Votre position est partagée en temps réel' : 'Activez le GPS pour démarrer les livraisons'}
            </div>
          </div>
          <button onClick={toggleGPS} style={{ ...styles.gpsToggle, background: isSharing ? '#DC2626' : '#E5E7EB' }}>
            <div style={{ ...styles.gpsThumb, transform: isSharing ? 'translateX(24px)' : 'translateX(0)' }}></div>
          </button>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div style={styles.notifBanner}>
            <span style={{ fontSize: 14 }}>🔔 {notifications.length} nouvelle(s) assignation(s)</span>
            <button style={styles.notifClose} onClick={async () => {
              await api.patch('/users/notifications/read');
              setNotifications([]);
            }}>Marquer comme lu</button>
          </div>
        )}

        {/* Orders */}
        <h2 style={styles.sectionTitle}>Mes livraisons ({orders.length})</h2>
        {orders.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            <div style={{ color: '#6B7280', fontSize: 15 }}>Aucune livraison assignée pour le moment</div>
          </div>
        ) : (
          <div style={styles.ordersList}>
            {orders.map(order => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderCardHeader}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{order.order_number}</span>
                  <span style={{ background: STATUS_COLORS[order.status] + '22', color: STATUS_COLORS[order.status], padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div style={styles.orderInfo}>
                  <div style={styles.infoRow}><span style={styles.infoLabel}>Client</span><span>{order.client_name}</span></div>
                  <div style={styles.infoRow}><span style={styles.infoLabel}>Téléphone</span><span>{order.client_phone || '—'}</span></div>
                  <div style={styles.infoRow}><span style={styles.infoLabel}>Adresse</span><span style={{ textAlign: 'right', maxWidth: '65%' }}>{order.delivery_address}</span></div>
                  {order.notes && <div style={styles.infoRow}><span style={styles.infoLabel}>Notes</span><span style={{ color: '#6B7280' }}>{order.notes}</span></div>}
                </div>
                <div style={styles.orderActions}>
                  {order.client_phone && (
                    <a href={`tel:${order.client_phone}`} style={styles.callBtn}>Appeler client</a>
                  )}
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(order.delivery_address)}`}
                    target="_blank" rel="noreferrer" style={styles.mapsBtn}>
                    Voir sur Maps
                  </a>
                  {order.status === 'assigned' && (
                    <button style={styles.startBtn} onClick={() => startDelivery(order.id)}>Démarrer</button>
                  )}
                  {order.status === 'in_progress' && (
                    <button style={styles.deliverBtn} onClick={() => confirmDelivery(order)}>Confirmer livraison</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#F5F6FA' },
  header: { background: '#1A1F2E', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logoIcon: { width: 26, height: 26, borderRadius: 6, background: '#DC2626' },
  logoText: { fontSize: 18, fontWeight: 700, color: '#fff' },
  userChip: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#DC2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  logoutBtn: { background: 'none', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', padding: '6px 12px', fontSize: 13, cursor: 'pointer' },
  content: { maxWidth: 680, margin: '0 auto', padding: '24px 16px' },
  gpsCard: { borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, transition: 'all 0.3s' },
  gpsToggle: { width: 52, height: 28, borderRadius: 14, border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.3s', flexShrink: 0 },
  gpsThumb: { position: 'absolute', top: 4, left: 4, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'transform 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
  notifBanner: { background: '#E6F1FB', border: '1px solid #B5D4F4', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  notifClose: { background: 'none', border: 'none', color: '#185FA5', fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  sectionTitle: { fontSize: 17, fontWeight: 700, marginBottom: 14, color: '#1A1F2E' },
  emptyState: { background: '#fff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', border: '1px solid #E5E7EB' },
  ordersList: { display: 'flex', flexDirection: 'column', gap: 14 },
  orderCard: { background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' },
  orderCardHeader: { padding: '14px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  orderInfo: { padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 },
  infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14 },
  infoLabel: { color: '#9CA3AF', fontWeight: 500 },
  orderActions: { padding: '12px 18px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8, flexWrap: 'wrap' },
  callBtn: { padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#1A1F2E', background: '#F9FAFB' },
  mapsBtn: { padding: '8px 14px', border: '1px solid #185FA5', borderRadius: 8, fontSize: 13, color: '#185FA5', background: '#E6F1FB' },
  startBtn: { padding: '8px 14px', border: 'none', borderRadius: 8, fontSize: 13, color: '#fff', background: '#7F77DD', fontWeight: 600, cursor: 'pointer' },
  deliverBtn: { padding: '8px 14px', border: 'none', borderRadius: 8, fontSize: 13, color: '#fff', background: '#DC2626', fontWeight: 600, cursor: 'pointer' },
};
