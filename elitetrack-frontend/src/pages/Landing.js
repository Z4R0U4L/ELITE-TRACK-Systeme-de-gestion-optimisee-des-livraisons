import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>
          <img src="/logo.png" alt="ELITE TRACK" style={{height:32,objectFit:"contain"}} />
          
        </div>
        <div style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>Fonctionnalités</a>
          <a href="#how" style={styles.navLink}>Comment ça marche</a>
          <button style={styles.loginBtn} onClick={() => navigate('/login')}>Connexion</button>
          <button style={styles.registerBtn} onClick={() => navigate('/register')}>Commencer gratuitement</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>🚀 Gestion de livraisons simplifiée</div>
          <h1 style={styles.heroTitle}>
            Gérez vos livraisons<br />
            <span style={styles.heroRed}>en temps réel</span>
          </h1>
          <p style={styles.heroSub}>
            ELITE TRACK permet aux commerçants de suivre leurs livreurs sur une carte GPS en direct,
            gérer les commandes et notifier automatiquement les clients.
          </p>
          <div style={styles.heroCtas}>
            <button style={styles.heroPrimary} onClick={() => navigate('/register')}>
              Démarrer gratuitement →
            </button>
            <button style={styles.heroSecondary} onClick={() => navigate('/login')}>
              Se connecter
            </button>
          </div>
          <div style={styles.heroStats}>
            {[
              { n: '3', label: 'Rôles (commerçant, livreur, client)' },
              { n: 'GPS', label: 'Temps réel via Socket.io' },
              { n: '100%', label: 'Gratuit & open source' },
            ].map((s, i) => (
              <div key={i} style={styles.heroStat}>
                <div style={styles.heroStatN}>{s.n}</div>
                <div style={styles.heroStatL}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div style={styles.heroVisual}>
          <div style={styles.mockupCard}>
            <div style={styles.mockupBar}>
              <div style={styles.mockupDot}></div>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Dashboard commerçant</span>
            </div>
            <div style={styles.mockupStats}>
              {[
                { n: '12', l: "Aujourd'hui", c: '#FEF2F2', tc: '#7F1D1D' },
                { n: '4', l: 'En cours', c: '#EEEDFE', tc: '#3C3489' },
                { n: '5', l: 'Livreurs actifs', c: '#E6F1FB', tc: '#0C447C' },
              ].map((s, i) => (
                <div key={i} style={{ ...styles.mockupStat, background: s.c }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.tc }}>{s.n}</div>
                  <div style={{ fontSize: 10, color: s.tc }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={styles.mockupMap}>
              <div style={{ fontSize: 11, color: '#990000', background: 'white', padding: '3px 8px', borderRadius: 4 }}>OpenStreetMap</div>
              {[
                { top: '25%', left: '30%' },
                { top: '55%', left: '60%' },
                { top: '40%', left: '75%' },
              ].map((pos, i) => (
                <div key={i} style={{ ...styles.mapDot, top: pos.top, left: pos.left }} />
              ))}
            </div>
            {[
              { n: 'CMD-001', c: 'Ali Hassan', s: 'En cours', sc: '#7F77DD' },
              { n: 'CMD-002', c: 'Sara M.', s: 'En attente', sc: '#EF9F27' },
              { n: 'CMD-003', c: 'Omar F.', s: 'Livré', sc: '#DC2626' },
            ].map((o, i) => (
              <div key={i} style={styles.mockupRow}>
                <span style={{ fontWeight: 600, fontSize: 11, color: '#1A1F2E' }}>{o.n}</span>
                <span style={{ fontSize: 11, color: '#6B7280', flex: 1, marginLeft: 8 }}>{o.c}</span>
                <span style={{ fontSize: 10, background: o.sc + '22', color: o.sc, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>{o.s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={styles.section}>
        <h2 style={styles.sectionTitle}>Tout ce dont vous avez besoin</h2>
        <p style={styles.sectionSub}>Une plateforme complète pour commerçants, livreurs et clients</p>
        <div style={styles.featuresGrid}>
          {[
            { icon: '🗺️', title: 'Carte GPS temps réel', desc: 'Suivez tous vos livreurs sur une carte interactive. Positions mises à jour en direct via Socket.io.', color: '#E6F1FB', tc: '#0C447C' },
            { icon: '📦', title: 'Gestion des commandes', desc: 'Créez, assignez et suivez vos commandes facilement. Statuts mis à jour automatiquement.', color: '#FEF2F2', tc: '#7F1D1D' },
            { icon: '📱', title: 'App livreur', desc: 'Interface simple pour les livreurs : activer le GPS, voir les missions, confirmer les livraisons.', color: '#EEEDFE', tc: '#3C3489' },
            { icon: '🔔', title: 'Notifications automatiques', desc: 'Le client reçoit automatiquement un lien de suivi par email dès que sa commande est assignée.', color: '#FAEEDA', tc: '#854F0B' },
            { icon: '🔗', title: 'Lien de suivi client', desc: 'Page publique pour que le client suive sa livraison en temps réel, sans créer de compte.', color: '#FAECE7', tc: '#712B13' },
            { icon: '📊', title: 'Tableau de bord', desc: "Statistiques en temps réel : livraisons du jour, taux de succès, livreurs actifs.", color: '#FFEBEB', tc: '#7A0000' },
          ].map((f, i) => (
            <div key={i} style={styles.featureCard}>
              <div style={{ ...styles.featureIcon, background: f.color }}>
                <span style={{ fontSize: 24 }}>{f.icon}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1A1F2E' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ ...styles.section, background: '#1A1F2E' }}>
        <h2 style={{ ...styles.sectionTitle, color: '#fff' }}>Comment ça marche</h2>
        <p style={{ ...styles.sectionSub, color: '#9CA3AF' }}>3 étapes pour démarrer</p>
        <div style={styles.stepsGrid}>
          {[
            { n: '1', title: 'Créez votre compte', desc: 'Inscrivez-vous comme commerçant et ajoutez vos livreurs en quelques clics.', color: '#DC2626' },
            { n: '2', title: 'Créez une commande', desc: "Ajoutez les infos du client et l'adresse de livraison, puis assignez un livreur.", color: '#7F77DD' },
            { n: '3', title: 'Suivez en temps réel', desc: 'Le livreur active son GPS, vous voyez sa position sur la carte, le client reçoit un lien de suivi.', color: '#EF9F27' },
          ].map((s, i) => (
            <div key={i} style={styles.stepCard}>
              <div style={{ ...styles.stepNum, background: s.color }}>{s.n}</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Une interface pour chaque rôle</h2>
        <div style={styles.rolesGrid}>
          {[
            { role: 'Commerçant', icon: '🏪', color: '#FEF2F2', tc: '#7F1D1D', features: ['Dashboard avec statistiques', 'Carte GPS de tous les livreurs', 'Créer & assigner des commandes', 'Gérer l\'équipe de livreurs', 'Voir l\'historique des livraisons'] },
            { role: 'Livreur', icon: '🛵', color: '#EEEDFE', tc: '#3C3489', features: ['Activer/désactiver le GPS', 'Voir les missions assignées', 'Ouvrir l\'adresse sur Google Maps', 'Appeler le client directement', 'Confirmer la livraison'] },
            { role: 'Client', icon: '👤', color: '#FAEEDA', tc: '#854F0B', features: ['Aucun compte requis', 'Lien de suivi par email', 'Carte GPS du livreur en direct', 'Étapes de livraison visuelles', 'Notification à la livraison'] },
          ].map((r, i) => (
            <div key={i} style={{ ...styles.roleCard, borderTop: `4px solid ${r.tc}` }}>
              <div style={{ ...styles.roleIcon, background: r.color }}>
                <span style={{ fontSize: 32 }}>{r.icon}</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1A1F2E' }}>{r.role}</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {r.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                    <span style={{ color: '#DC2626', fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Prêt à démarrer ?</h2>
        <p style={styles.ctaSub}>Gratuit, open source, déployable en 5 minutes.</p>
        <button style={styles.ctaBtn} onClick={() => navigate('/register')}>
          Créer mon compte gratuitement →
        </button>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLogo}>
          <img src="/logo.png" alt="ELITE TRACK" style={{height:32,objectFit:"contain"}} />
          <span style={{ color: '#fff', fontWeight: 700 }}>ELITE TRACK</span>
        </div>
        <p style={{ color: '#9CA3AF', fontSize: 13 }}>Projet académique — Management de Projets SI — M. Elhaloui</p>
      </footer>

    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif' },

  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', background: '#fff', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { width: 28, height: 28, borderRadius: 7, background: '#DC2626' },
  logoText: { fontSize: 18, fontWeight: 700, color: '#1A1F2E' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 20 },
  navLink: { fontSize: 14, color: '#6B7280', textDecoration: 'none', fontWeight: 500 },
  loginBtn: { padding: '8px 16px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#1A1F2E' },
  registerBtn: { padding: '8px 18px', border: 'none', borderRadius: 8, background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  hero: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '80px 48px', gap: 48, background: 'linear-gradient(135deg, #F5F6FA 0%, #FEF2F2 100%)' },
  heroContent: { flex: 1, maxWidth: 520 },
  heroBadge: { display: 'inline-block', background: '#FEF2F2', color: '#7F1D1D', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, marginBottom: 20 },
  heroTitle: { fontSize: 48, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, color: '#1A1F2E' },
  heroRed: { color: '#DC2626' },
  heroSub: { fontSize: 16, color: '#6B7280', lineHeight: 1.7, marginBottom: 32 },
  heroCtas: { display: 'flex', gap: 12, marginBottom: 40 },
  heroPrimary: { padding: '14px 28px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  heroSecondary: { padding: '14px 28px', background: '#fff', color: '#1A1F2E', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  heroStats: { display: 'flex', gap: 32 },
  heroStat: {},
  heroStatN: { fontSize: 22, fontWeight: 800, color: '#1A1F2E' },
  heroStatL: { fontSize: 12, color: '#9CA3AF' },

  heroVisual: { flex: 1, maxWidth: 460 },
  mockupCard: { background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' },
  mockupBar: { background: '#1A1F2E', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 },
  mockupDot: { width: 8, height: 8, borderRadius: '50%', background: '#DC2626' },
  mockupStats: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '14px' },
  mockupStat: { borderRadius: 8, padding: '10px 12px', textAlign: 'center' },
  mockupMap: { margin: '0 14px 10px', height: 120, background: '#FFAAAA', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  mapDot: { position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: '#DC2626', border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' },
  mockupRow: { display: 'flex', alignItems: 'center', padding: '8px 14px', borderTop: '1px solid #F3F4F6' },

  section: { padding: '80px 48px', background: '#fff' },
  sectionTitle: { fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 12, color: '#1A1F2E' },
  sectionSub: { fontSize: 16, color: '#9CA3AF', textAlign: 'center', marginBottom: 48 },

  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 },
  featureCard: { padding: '24px', border: '1px solid #F3F4F6', borderRadius: 14, background: '#FAFAFA' },
  featureIcon: { width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },

  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 },
  stepCard: { padding: '28px 24px', background: '#252D3D', borderRadius: 14, textAlign: 'center' },
  stepNum: { width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 auto 16px' },

  rolesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 },
  roleCard: { padding: '28px', border: '1px solid #F3F4F6', borderRadius: 14 },
  roleIcon: { width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },

  ctaSection: { padding: '80px 48px', background: '#DC2626', textAlign: 'center' },
  ctaTitle: { fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 12 },
  ctaSub: { fontSize: 16, color: '#FECACA', marginBottom: 32 },
  ctaBtn: { padding: '16px 36px', background: '#fff', color: '#DC2626', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' },

  footer: { background: '#1A1F2E', padding: '28px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  footerLogo: { display: 'flex', alignItems: 'center', gap: 10 },
};
