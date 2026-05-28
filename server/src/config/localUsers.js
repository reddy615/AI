const LOCAL_USERS = [
  {
    id: 'local-admin',
    name: 'Akshay Reddy',
    email: 'polareddyakshayreddy@gmail.com',
    password: 'Reddy',
    role: 'admin',
    preferredLanguage: 'en',
    isActive: true,
    refreshTokenVersion: 0,
  },
  {
    id: 'local-user',
    name: 'Akshay',
    email: 'a81866526@gmail.com',
    password: 'Akshay',
    role: 'user',
    preferredLanguage: 'en',
    isActive: true,
    refreshTokenVersion: 0,
  },
]

function findLocalUserByEmail(email) {
  return LOCAL_USERS.find((user) => user.email.toLowerCase() === String(email || '').toLowerCase()) || null
}

function findLocalUserById(id) {
  return LOCAL_USERS.find((user) => user.id === id || user.email === id) || null
}

function updateLocalUser(id, updates) {
  const user = findLocalUserById(id)
  if (!user) return null
  Object.assign(user, updates)
  return user
}

module.exports = {
  LOCAL_USERS,
  findLocalUserByEmail,
  findLocalUserById,
  updateLocalUser,
}