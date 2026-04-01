import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const driverIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#DC2626;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [14, 14],
});

const STATUS_COLORS = { pending: '#EF9F27', assigned: '#185FA5', in_progress: '#7F77DD', delivered: '#DC2626', cancelled: '#E24B4A' };
const STATUS_LABELS = { pending: 'En attente', assigned: 'Assignée', in_progress: 'En cours', delivered: 'Livré', cancelled: 'Annulé' };

export default function MerchantDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverLocations, setDriverLocations] = useState({});
  const [tab, setTab] = useState('dashboard');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCreateDriver, setShowCreateDriver] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({ client_name: '', client_phone: '', client_email: '', delivery_address: '', notes: '' });
  const [driverForm, setDriverForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordersRes, driversRes] = await Promise.all([
        api.get('/orders/stats'),
        api.get('/orders' + (filterStatus ? `?status=${filterStatus}` : '')),
        api.get('/users/drivers'),
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data.orders || []);
      setDrivers(driversRes.data);
      const locs = {};
      driversRes.data.forEach(d => {
        if (d.latitude) locs[d.id] = { lat: parseFloat(d.latitude), lng: parseFloat(d.longitude), name: d.name, sharing: d.is_sharing };
      });
      setDriverLocations(locs);
    } catch (err) {
      console.error(err);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('driver:location:update', ({ driver_id, driver_name, latitude, longitude }) => {
      setDriverLocations(prev => ({ ...prev, [driver_id]: { lat: latitude, lng: longitude, name: driver_name, sharing: true } }));
    });
    socket.on('driver:sharing:update', ({ driver_id, is_sharing }) => {
      setDriverLocations(prev => prev[driver_id] ? { ...prev, [driver_id]: { ...prev[driver_id], sharing: is_sharing } } : prev);
    });
    socket.on('order:status:update', () => fetchData());
    return () => { socket.off('driver:location:update'); socket.off('driver:sharing:update'); socket.off('order:status:update'); };
  }, [fetchData]);

  const createOrder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/orders', orderForm);
      toast.success('Commande créée!');
      setShowCreateOrder(false);
      setOrderForm({ client_name: '', client_phone: '', client_email: '', delivery_address: '', notes: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const createDriver = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/drivers', driverForm);
      toast.success('Livreur créé!');
      setShowCreateDriver(false);
      setDriverForm({ name: '', email: '', phone: '', password: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const assignDriver = async (order_id, driver_id) => {
    try {
      await api.patch(`/orders/${order_id}/assign`, { driver_id });
      toast.success('Livreur assigné! Email envoyé au client.');
      setSelectedOrder(null);
      fetchData();
    } catch (err) { toast.error('Erreur lors de l\'assignation'); }
  };

  const cancelOrder = async (order_id) => {
    if (!window.confirm('Annuler cette commande?')) return;
    try {
      await api.patch(`/orders/${order_id}/status`, { status: 'cancelled' });
      toast.success('Commande annulée');
      fetchData();
    } catch (err) { toast.error('Erreur'); }
  };

  const activeDriverMarkers = Object.entries(driverLocations).filter(([, d]) => d.sharing && d.lat);

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <img src="/logo.png" alt="ELITE TRACK" style={{height:30, objectFit:'contain', filter:'brightness(0) invert(1)'}} />
          <img src="/logo.png" alt="ELITE TRACK" style={{height:32,objectFit:"contain"}} />
          
        </div>
        <nav style={styles.nav}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'orders', label: 'Commandes' },
            { id: 'map', label: 'Carte GPS' },
            { id: 'drivers', label: 'Livreurs' },
          ].map(item => (
            <button key={item.id} style={{ ...styles.navBtn, ...(tab === item.id ? styles.navBtnActive : {}) }}
              onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user?.name?.[0]}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Commerçant</div>
            </div>
          </div>
          <button onClick={logout} style={styles.logoutBtn}>Déconnexion</button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Dashboard</h1>
              <button style={styles.primaryBtn} onClick={() => setShowCreateOrder(true)}>+ Nouvelle commande</button>
            </div>
            <div style={styles.statsGrid}>
              {[
                { label: "Livraisons aujourd'hui", value: stats.today_total || 0, color: '#E6F1FB', tc: '#0C447C' },
                { label: 'En cours', value: stats.in_progress || 0, color: '#EEEDFE', tc: '#3C3489' },
                { label: 'En attente', value: stats.pending || 0, color: '#FAEEDA', tc: '#854F0B' },
                { label: 'Livrées aujourd\'hui', value: stats.delivered_today || 0, color: '#FEF2F2', tc: '#7F1D1D' },
              ].map((s, i) => (
                <div key={i} style={{ ...styles.statCard, background: s.color }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: s.tc }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: s.tc, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <h2 style={styles.sectionTitle}>Commandes récentes</h2>
            <OrdersTable orders={orders.slice(0, 8)} drivers={drivers} onAssign={setSelectedOrder} onCancel={cancelOrder} />
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Commandes</h1>
              <div style={{ display: 'flex', gap: 10 }}>
                <select style={styles.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button style={styles.primaryBtn} onClick={() => setShowCreateOrder(true)}>+ Nouvelle commande</button>
              </div>
            </div>
            <OrdersTable orders={orders} drivers={drivers} onAssign={setSelectedOrder} onCancel={cancelOrder} />
          </div>
        )}

        {/* MAP TAB */}
        {tab === 'map' && (
          <div>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Carte GPS — Livreurs en temps réel</h1>
              <div style={{ fontSize: 13, color: '#6B7280' }}>
                {activeDriverMarkers.length} livreur(s) actif(s)
              </div>
            </div>
            <div style={{ height: 'calc(100vh - 160px)', borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
              <MapContainer center={[33.9716, -6.8498]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {activeDriverMarkers.map(([id, d]) => (
                  <Marker key={id} position={[d.lat, d.lng]} icon={driverIcon}>
                    <Popup><strong>{d.name}</strong><br />GPS actif</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}

        {/* DRIVERS TAB */}
        {tab === 'drivers' && (
          <div>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Livreurs</h1>
              <button style={styles.primaryBtn} onClick={() => setShowCreateDriver(true)}>+ Ajouter livreur</button>
            </div>
            <div style={styles.driversGrid}>
              {drivers.map(d => (
                <div key={d.id} style={styles.driverCard}>
                  <div style={styles.driverAvatar}>{d.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{d.email}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{d.phone}</div>
                  </div>
                  <div>
                    <span style={{ ...styles.badge, background: d.is_sharing ? '#FEF2F2' : '#F1EFE8', color: d.is_sharing ? '#7F1D1D' : '#444441' }}>
                      {d.is_sharing ? 'GPS actif' : 'GPS inactif'}
                    </span>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'right' }}>
                      {d.active_orders} livraison(s)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Create Order */}
      {showCreateOrder && (
        <Modal title="Nouvelle commande" onClose={() => setShowCreateOrder(false)}>
          <form onSubmit={createOrder}>
            {[
              { label: 'Nom du client *', key: 'client_name', type: 'text', required: true },
              { label: 'Téléphone', key: 'client_phone', type: 'tel' },
              { label: 'Email (pour lien de suivi)', key: 'client_email', type: 'email' },
              { label: 'Adresse de livraison *', key: 'delivery_address', type: 'text', required: true },
            ].map(f => (
              <div key={f.key} style={styles.field}>
                <label style={styles.label}>{f.label}</label>
                <input style={styles.input} type={f.type} required={f.required}
                  value={orderForm[f.key]} onChange={e => setOrderForm({ ...orderForm, [f.key]: e.target.value })} />
              </div>
            ))}
            <div style={styles.field}>
              <label style={styles.label}>Notes</label>
              <textarea style={{ ...styles.input, height: 72, resize: 'vertical' }}
                value={orderForm.notes} onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })} />
            </div>
            <button style={styles.primaryBtn} type="submit">Créer la commande</button>
          </form>
        </Modal>
      )}

      {/* Modal: Assign Driver */}
      {selectedOrder && (
        <Modal title={`Assigner un livreur — ${selectedOrder.order_number}`} onClose={() => setSelectedOrder(null)}>
          <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 16 }}>Client: {selectedOrder.client_name}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {drivers.filter(d => d.is_active).map(d => (
              <button key={d.id} style={styles.driverSelectBtn} onClick={() => assignDriver(selectedOrder.id, d.id)}>
                <div style={styles.driverAvatar}>{d.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 500 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{d.active_orders} livraison(s) en cours</div>
                </div>
                <span style={{ ...styles.badge, background: d.is_sharing ? '#FEF2F2' : '#F1EFE8', color: d.is_sharing ? '#7F1D1D' : '#6B7280', marginLeft: 'auto' }}>
                  {d.is_sharing ? 'GPS actif' : 'GPS off'}
                </span>
              </button>
            ))}
            {drivers.filter(d => d.is_active).length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13 }}>Aucun livreur disponible</p>}
          </div>
        </Modal>
      )}

      {/* Modal: Create Driver */}
      {showCreateDriver && (
        <Modal title="Ajouter un livreur" onClose={() => setShowCreateDriver(false)}>
          <form onSubmit={createDriver}>
            {[
              { label: 'Nom *', key: 'name', type: 'text', required: true },
              { label: 'Email *', key: 'email', type: 'email', required: true },
              { label: 'Téléphone', key: 'phone', type: 'tel' },
              { label: 'Mot de passe *', key: 'password', type: 'password', required: true },
            ].map(f => (
              <div key={f.key} style={styles.field}>
                <label style={styles.label}>{f.label}</label>
                <input style={styles.input} type={f.type} required={f.required}
                  value={driverForm[f.key]} onChange={e => setDriverForm({ ...driverForm, [f.key]: e.target.value })} />
              </div>
            ))}
            <button style={styles.primaryBtn} type="submit">Créer le livreur</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function OrdersTable({ orders, drivers, onAssign, onCancel }) {
  if (!orders.length) return <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Aucune commande</div>;
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            {['N°', 'Client', 'Adresse', 'Livreur', 'Statut', 'Actions'].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1A1F2E' }}>{o.order_number}</td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ fontWeight: 500 }}>{o.client_name}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{o.client_phone}</div>
              </td>
              <td style={{ padding: '12px 16px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6B7280' }}>
                {o.delivery_address}
              </td>
              <td style={{ padding: '12px 16px', color: o.driver_name ? '#1A1F2E' : '#9CA3AF' }}>
                {o.driver_name || '—'}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ background: STATUS_COLORS[o.status] + '22', color: STATUS_COLORS[o.status], padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                  {STATUS_LABELS[o.status]}
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(o.status === 'pending' || o.status === 'assigned') && (
                    <button style={styles.actionBtn} onClick={() => onAssign(o)}>Assigner</button>
                  )}
                  {o.status === 'in_progress' && (
                    <a href={`/track/${o.tracking_token}`} target="_blank" rel="noreferrer" style={styles.actionBtn}>Suivre</a>
                  )}
                  {!['delivered', 'cancelled'].includes(o.status) && (
                    <button style={{ ...styles.actionBtn, color: '#E24B4A', borderColor: '#E24B4A' }} onClick={() => onCancel(o.id)}>Annuler</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>
        <div style={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh', background: '#F5F6FA' },
  sidebar: { width: 220, background: '#1A1F2E', display: 'flex', flexDirection: 'column', padding: '24px 0' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', marginBottom: 32 },
  logoIcon: { width: 28, height: 28, borderRadius: 6, background: '#DC2626' },
  logoText: { fontSize: 18, fontWeight: 700, color: '#fff' },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px', flex: 1 },
  navBtn: { padding: '10px 12px', borderRadius: 8, border: 'none', background: 'none', color: '#9CA3AF', textAlign: 'left', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  navBtnActive: { background: '#DC2626', color: '#fff' },
  sidebarFooter: { padding: '0 16px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#DC2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 },
  logoutBtn: { width: '100%', padding: '8px', background: 'none', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', fontSize: 13, cursor: 'pointer' },
  main: { flex: 1, padding: 28, overflow: 'auto' },
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: 700 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  statCard: { borderRadius: 12, padding: '20px 24px' },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 14, color: '#1A1F2E' },
  primaryBtn: { background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  select: { padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#fff', outline: 'none' },
  actionBtn: { padding: '5px 10px', border: '1px solid #DC2626', borderRadius: 6, color: '#DC2626', background: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer' },
  driversGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  driverCard: { background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 14 },
  driverAvatar: { width: 40, height: 40, borderRadius: '50%', background: '#FEF2F2', color: '#7F1D1D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 },
  driverSelectBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid #E5E7EB', borderRadius: 10, background: '#FAFAFA', cursor: 'pointer', textAlign: 'left', width: '100%' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E5E7EB' },
  modalBody: { padding: '20px 24px' },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 5 },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' },
};
