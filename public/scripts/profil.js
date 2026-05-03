// ========== INITIALISATION ==========
// Récupération des éléments du DOM et vérification de connexion
const userPseudo = localStorage.getItem('userPseudo');
const usernameLabel = document.getElementById('usernameLabel');
const currentPseudoEl = document.getElementById('currentPseudo');
const currentEmailEl = document.getElementById('currentEmail');
const createdAtEl = document.getElementById('createdAt');
const updateForm = document.getElementById('updateForm');
const deleteForm = document.getElementById('deleteForm');
const logoutBtn = document.getElementById('logoutBtn');
const updateStatus = document.getElementById('updateStatus');
const deleteStatus = document.getElementById('deleteStatus');

// Rediriger vers la connexion si l'utilisateur n'est pas connecté
if (!userPseudo) {
  window.location.href = 'index.html';
}

usernameLabel.textContent = userPseudo;

// ========== FONCTIONS UTILITAIRES ==========
function setStatus(target, message, ok) {
  target.textContent = message;
  target.style.color = ok ? '#22c55e' : '#f87171';
}

// ========== CHARGEMENT DU PROFIL ==========
function loadProfile() {
  fetch('/api/profile/' + encodeURIComponent(localStorage.getItem('userPseudo')))
    .then(async (res) => {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Réponse serveur invalide');
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Impossible de charger le profil');
      }
      return data;
    })
    .then((data) => {
      currentPseudoEl.textContent = data.user.pseudo;
      currentEmailEl.textContent = data.user.email;
      createdAtEl.textContent = new Date(data.user.created_at).toLocaleString();
      usernameLabel.textContent = data.user.pseudo;
    })
    .catch((err) => {
      setStatus(updateStatus, err.message, false);
    });
}

// ========== MODIFICATION DU PROFIL ==========
updateForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const currentPseudo = localStorage.getItem('userPseudo');
  const newPseudo = document.getElementById('newPseudo').value.trim();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;

  fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPseudo, newPseudo, currentPassword, newPassword })
  })
  .then(async (res) => {
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Modification impossible');
    }
    return data;
  })
  .then((data) => {
    localStorage.setItem('userPseudo', data.pseudo);
    document.getElementById('newPseudo').value = '';
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    setStatus(updateStatus, 'Profil mis à jour avec succès', true);
    loadProfile();
  })
  .catch((err) => {
    setStatus(updateStatus, err.message, false);
  });
});

// ========== SUPPRESSION DU COMPTE ==========
deleteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const pseudo = localStorage.getItem('userPseudo');
  const password = document.getElementById('deletePassword').value;

  const confirmed = window.confirm('Confirmer la suppression définitive du compte ?');
  if (!confirmed) return;

  fetch('/api/profile', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pseudo, password })
  })
  .then(async (res) => {
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Suppression impossible');
    }
    return data;
  })
  .then(() => {
    localStorage.removeItem('userPseudo');
    window.location.href = 'index.html';
  })
  .catch((err) => {
    setStatus(deleteStatus, err.message, false);
  });
});

// ========== DÉCONNEXION ==========
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('userPseudo');
  window.location.href = 'index.html';
});

loadProfile();