// Anonymous identity kept in localStorage: no signup, and a refresh or a
// dropped connection rejoins the same seat with its score.

const KEY = 'doodleblaze:identity'

export type Identity = { id: string; token: string; name: string }

export function loadIdentity(): Identity {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Identity | null
    if (saved?.id && saved.token) return saved
  } catch {
    // Storage blocked or corrupt: fall through to a fresh identity.
  }
  const fresh = { id: crypto.randomUUID(), token: crypto.randomUUID(), name: '' }
  saveIdentity(fresh)
  return fresh
}

export function saveIdentity(identity: Identity) {
  try {
    localStorage.setItem(KEY, JSON.stringify(identity))
  } catch {
    // Private mode: the identity lasts for this page only.
  }
}
