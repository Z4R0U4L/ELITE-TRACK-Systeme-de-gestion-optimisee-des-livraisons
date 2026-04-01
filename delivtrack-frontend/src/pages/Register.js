import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', role: '', phone: ''
  });

  const handleRoleSelect = (role) => {
    setForm({ ...form, role });
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Les mots de passe ne correspondent pas');
    if (form.password.length < 6) return toast.error('Mot de passe trop court (6 caractères min)');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name, email: form.email,
        password: form.password, role: form.role, phone: form.phone
      });
      // Auto login
      const user = await login(form.email, form.password);
      toast.success(`Compte créé ! Bienvenue, ${user.name}`);
      if (user.role === 'merchant') navigate('/dashboard');
      else navigate('/driver');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'merchant', label: 'Commerçant', icon: '🏪', desc: 'Je gère des livraisons et une équipe de livreurs', color: '#FEF2F2', tc: '#7F1D1D', bc: '#DC2626' },
    { id: 'driver', label: 'Livreur', icon: '🛵', desc: 'Je effectue les livraisons pour un commerçant', color: '#EEEDFE', tc: '#3C3489', bc: '#7F77DD' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoWrap}>
          <img src="/logo.png" alt="ELITE TRACK" style={{height:32,objectFit:"contain"}} />
          
        </div>

        {/* Step 1 — Choose role */}
        {step === 1 && (
          <div>
            <h2 style={styles.title}>Créer un compte</h2>
            <p style={styles.subtitle}>Choisissez votre rôle pour commencer</p>
            <div style={styles.rolesGrid}>
              {roles.map(r => (
                <button key={r.id} style={{ ...styles.roleBtn, background: r.color, border: `2px solid ${r.bc}` }}
                  onClick={() => handleRoleSelect(r.id)}>
                  <span style={{ fontSize: 36, marginBottom: 10, display: 'block' }}>{r.icon}</span>
                  <div style={{ fontSize: 16, fontWeight: 700, color: r.tc, marginBottom: 6 }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: r.tc, opacity: 0.8, lineHeight: 1.4 }}>{r.desc}</div>
                </button>
              ))}
            </div>
            <p style={styles.loginLink}>
              Déjà un compte ? <Link to="/login" style={{ color: '#DC2626', fontWeight: 600 }}>Se connecter</Link>
            </p>
            <p style={styles.loginLink}>
              <Link to="/" style={{ color: '#9CA3AF' }}>← Retour à l'accueil</Link>
            </p>
          </div>
        )}

        {/* Step 2 — Fill form */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} style={styles.backBtn}>← Retour</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}>{roles.find(r => r.id === form.role)?.icon}</span>
              <div>
                <h2 style={{ ...styles.title, margin: 0 }}>Inscription</h2>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                  Compte {roles.find(r => r.id === form.role)?.label}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Nom complet *</label>
                  <input style={styles.input} type="text" placeholder="Votre nom"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Téléphone</label>
                  <input style={styles.input} type="tel" placeholder="+212 6XX XXX XXX"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email *</label>
                <input style={styles.input} type="email" placeholder="votre@email.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>

              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Mot de passe *</label>
                  <input style={styles.input} type="password" placeholder="Min. 6 caractères"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Confirmer mot de passe *</label>
                  <input style={styles.input} type="password" placeholder="Répéter le mot de passe"
                    value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
                </div>
              </div>

              {/* Password strength */}
              {form.password && (
                <div style={styles.strengthBar}>
                  <div style={{
                    ...styles.strengthFill,
                    width: form.password.length < 6 ? '33%' : form.password.length < 10 ? '66%' : '100%',
                    background: form.password.length < 6 ? '#E24B4A' : form.password.length < 10 ? '#EF9F27' : '#DC2626'
                  }}></div>
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>
                    {form.password.length < 6 ? 'Faible' : form.password.length < 10 ? 'Moyen' : 'Fort'}
                  </span>
                </div>
              )}

              <button type="submit" style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                {loading ? 'Création du compte...' : 'Créer mon compte →'}
              </button>
            </form>

            <p style={styles.loginLink}>
              Déjà un compte ? <Link to="/login" style={{ color: '#DC2626', fontWeight: 600 }}>Se connecter</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #F5F6FA 0%, #FEF2F2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card: { background: '#fff', borderRadius: 20, padding: '36px 40px', width: '100%', maxWidth: 520, boxShadow: '0 8px 40px rgba(0,0,0,0.1)' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon: { width: 30, height: 30, borderRadius: 7, background: '#DC2626' },
  logoText: { fontSize: 20, fontWeight: 800, color: '#1A1F2E' },
  title: { fontSize: 22, fontWeight: 700, color: '#1A1F2E', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },
  rolesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 },
  roleBtn: { padding: '24px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', transition: 'transform 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  backBtn: { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 },
  input: { width: '100%', padding: '10px 13px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', transition: 'border-color 0.2s' },
  strengthBar: { display: 'flex', alignItems: 'center', marginBottom: 14 },
  strengthFill: { height: 4, borderRadius: 2, transition: 'all 0.3s', flex: 'none' },
  submitBtn: { width: '100%', padding: '13px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  loginLink: { textAlign: 'center', fontSize: 13, color: '#9CA3AF', marginTop: 16 },
};
