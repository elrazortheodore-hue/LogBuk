// Client-side authentication controller for LogBuk

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function getSessionToken() {
  return sessionStorage.getItem('logbuk_session_token');
}

function setSessionToken(token, databaseUrl) {
  sessionStorage.setItem('logbuk_session_token', token);
  if (databaseUrl) {
    sessionStorage.setItem('logbuk_db_url', databaseUrl);
  }
}

function clearSession() {
  sessionStorage.removeItem('logbuk_session_token');
  sessionStorage.removeItem('logbuk_db_url');
}

function getDatabaseUrl() {
  return sessionStorage.getItem('logbuk_db_url');
}

function isAuthenticated(expectedType) {
  const token = getSessionToken();
  if (!token) return false;

  const payload = parseJwt(token);
  if (!payload) {
    clearSession();
    return false;
  }

  // Check if token matches the access type (upload or viewer)
  if (payload.type !== expectedType) {
    return false;
  }

  // JWT exp is in seconds, Date.now() is in milliseconds. Check if expired.
  const isExpired = payload.exp * 1000 < Date.now();
  if (isExpired) {
    clearSession();
    return false;
  }

  return true;
}

async function loginWithPin(pin, type) {
  try {
    const response = await fetch('/api/verify-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pin, type })
    });

    const data = await response.json();
    if (response.ok && data.success && data.token) {
      setSessionToken(data.token, data.databaseUrl);
      return { success: true, databaseUrl: data.databaseUrl };
    } else {
      return { success: false, error: data.error || 'Invalid PIN' };
    }
  } catch (err) {
    console.error('Login request error:', err);
    return { success: false, error: 'Connection failed. Please try again.' };
  }
}

// Expose functions globally for layout pages
window.LogBukAuth = {
  getSessionToken,
  clearSession,
  isAuthenticated,
  loginWithPin,
  getDatabaseUrl
};
