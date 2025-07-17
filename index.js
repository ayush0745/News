// --- Article Data ---
const articles = [
  { id: 1, title: "Breaking News: AI Revolution", category: "Tech", content: "AI is changing the world..." },
  { id: 2, title: "Sports Update: Finals Tonight", category: "Sports", content: "The finals are set to begin..." },
  { id: 3, title: "Economy: Market Trends", category: "Business", content: "Markets are fluctuating..." },
];

// --- User Authentication ---
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}
function logoutUser() {
  localStorage.removeItem('currentUser');
  renderUserSection();
}
function signupUser(username, password) {
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  if (users.find(u => u.username === username)) return false;
  users.push({ username, password, preferences: [] });
  localStorage.setItem('users', JSON.stringify(users));
  setCurrentUser({ username });
  return true;
}
function loginUser(username, password) {
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  let user = users.find(u => u.username === username && u.password === password);
  if (user) {
    setCurrentUser({ username });
    return true;
  }
  return false;
}

// --- Render Functions ---
function renderArticles() {
  const articlesDiv = document.getElementById('articles');
  articlesDiv.innerHTML = '';
  articles.forEach(article => {
    const art = document.createElement('div');
    art.className = 'article';
    art.innerHTML = `<h3>${article.title}</h3><p>${article.content}</p><button onclick="showComments(${article.id})">Comments</button>`;
    articlesDiv.appendChild(art);
  });
}

function renderUserSection() {
  const userSection = document.getElementById('user-section');
  const user = getCurrentUser();
  if (user) {
    userSection.innerHTML = `Welcome, ${user.username}! <button id="logout-btn">Logout</button>`;
    document.getElementById('logout-btn').onclick = logoutUser;
    renderPersonalizedArticles();
  } else {
    userSection.innerHTML = `<button id="login-btn">Login / Signup</button>`;
    document.getElementById('login-btn').onclick = showAuthModal;
    document.getElementById('personalized-section').style.display = 'none';
  }
}

// --- Auth Modal Logic ---
function showAuthModal() {
  document.getElementById('auth-modal').style.display = 'block';
  document.getElementById('auth-title').textContent = 'Login';
  document.getElementById('toggle-auth').innerHTML = `Don't have an account? <a href="#" id="switch-auth">Sign up</a>`;
  document.getElementById('auth-form').onsubmit = handleLogin;
  document.getElementById('switch-auth').onclick = switchToSignup;
}
function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
}
function switchToSignup(e) {
  e.preventDefault();
  document.getElementById('auth-title').textContent = 'Sign Up';
  document.getElementById('toggle-auth').innerHTML = `Already have an account? <a href="#" id="switch-auth">Login</a>`;
  document.getElementById('auth-form').onsubmit = handleSignup;
  document.getElementById('switch-auth').onclick = switchToLogin;
}
function switchToLogin(e) {
  e.preventDefault();
  document.getElementById('auth-title').textContent = 'Login';
  document.getElementById('toggle-auth').innerHTML = `Don't have an account? <a href="#" id="switch-auth">Sign up</a>`;
  document.getElementById('auth-form').onsubmit = handleLogin;
  document.getElementById('switch-auth').onclick = switchToSignup;
}
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('auth-username').value;
  const password = document.getElementById('auth-password').value;
  if (loginUser(username, password)) {
    closeAuthModal();
    renderUserSection();
  } else {
    alert('Invalid credentials');
  }
}
function handleSignup(e) {
  e.preventDefault();
  const username = document.getElementById('auth-username').value;
  const password = document.getElementById('auth-password').value;
  if (signupUser(username, password)) {
    closeAuthModal();
    renderUserSection();
  } else {
    alert('Username already exists');
  }
}
document.getElementById('close-auth').onclick = closeAuthModal;

// --- Comments System ---
function getComments(articleId) {
  const allComments = JSON.parse(localStorage.getItem('comments') || '{}');
  return allComments[articleId] || [];
}
function saveComment(articleId, comment) {
  const allComments = JSON.parse(localStorage.getItem('comments') || '{}');
  if (!allComments[articleId]) allComments[articleId] = [];
  allComments[articleId].push(comment);
  localStorage.setItem('comments', JSON.stringify(allComments));
}
function renderComments(articleId) {
  const commentsDiv = document.getElementById('comments');
  const comments = getComments(articleId);
  if (comments.length === 0) {
    commentsDiv.innerHTML = '<p>No comments yet.</p>';
  } else {
    commentsDiv.innerHTML = comments.map(c => `<div class="comment"><b>${c.username}</b>: ${c.text}</div>`).join('');
  }
}
function showComments(articleId) {
  const article = articles.find(a => a.id === articleId);
  if (article) recordUserPreference(article.category);
  document.getElementById('comments-section').style.display = 'block';
  document.getElementById('comment-form').onsubmit = function(e) {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) {
      alert('You must be logged in to comment.');
      return;
    }
    const text = document.getElementById('comment-input').value.trim();
    if (!text) return;
    saveComment(articleId, { username: user.username, text });
    document.getElementById('comment-input').value = '';
    renderComments(articleId);
  };
  renderComments(articleId);
  renderPersonalizedArticles(); // update recommendations after viewing
}
// Hide comments section when clicking outside or after posting (optional improvement)
document.addEventListener('click', function(e) {
  const commentsSection = document.getElementById('comments-section');
  if (commentsSection.style.display === 'block' && !commentsSection.contains(e.target) && !e.target.matches('button[onclick^="showComments"]')) {
    commentsSection.style.display = 'none';
  }
});

// --- Personalization ---
function recordUserPreference(category) {
  const user = getCurrentUser();
  if (!user) return;
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  let idx = users.findIndex(u => u.username === user.username);
  if (idx === -1) return;
  if (!users[idx].preferences) users[idx].preferences = [];
  users[idx].preferences.push(category);
  localStorage.setItem('users', JSON.stringify(users));
}
function getUserTopCategories(username) {
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  let user = users.find(u => u.username === username);
  if (!user || !user.preferences || user.preferences.length === 0) return [];
  // Count category frequency
  let freq = {};
  user.preferences.forEach(cat => { freq[cat] = (freq[cat] || 0) + 1; });
  // Sort categories by frequency
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(e => e[0]);
}
function renderPersonalizedArticles() {
  const user = getCurrentUser();
  const section = document.getElementById('personalized-section');
  if (!user) {
    section.style.display = 'none';
    return;
  }
  const topCategories = getUserTopCategories(user.username);
  if (topCategories.length === 0) {
    section.style.display = 'none';
    return;
  }
  // Recommend articles from top 1-2 categories
  const recommended = articles.filter(a => topCategories.includes(a.category));
  if (recommended.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  const container = document.getElementById('personalized-articles');
  container.innerHTML = '';
  recommended.forEach(article => {
    const art = document.createElement('div');
    art.className = 'article';
    art.innerHTML = `<h3>${article.title}</h3><p>${article.content}</p><button onclick="showComments(${article.id})">Comments</button>`;
    container.appendChild(art);
  });
}

// --- On Load ---
window.onload = function() {
  renderUserSection();
  renderArticles();
  renderPersonalizedArticles();
};
