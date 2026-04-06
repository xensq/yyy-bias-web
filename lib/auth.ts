const API = "https://web-production-8a6973.up.railway.app"
const KEY_STORAGE = "yyy-access-key"

export async function validateKey(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${API}/validate-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    })
    const data = await res.json()
    return data.valid === true
  } catch {
    return false
  }
}

export function saveKey(key: string) {
  localStorage.setItem(KEY_STORAGE, key)
}

export function getKey(): string | null {
  return localStorage.getItem(KEY_STORAGE)
}

export function clearKey() {
  localStorage.removeItem(KEY_STORAGE)
}

export async function checkAuth(): Promise<boolean> {
  const key = getKey()
  if (!key) return false
  return await validateKey(key)
}
