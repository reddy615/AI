const LOCAL_USERS = [
  {
    id: 'local-admin',
    name: 'Akshay Reddy',
    email: 'polareddyakshayreddy@gmail.com',
    password: '$2a$10$ixklhppBhoZ.2m1Ts1HWyufqBmfaiV/JL3TMNE0WT7hV12ZxXEgUK',
    role: 'admin',
    preferredLanguage: 'en',
    isActive: true,
    assessmentAccess: {
      technical: true,
      aptitude: true,
      coding: true,
      mockInterview: true,
    },
    refreshTokenVersion: 0,
  },
  {
    id: 'local-user',
    name: 'Akshay',
    email: 'a81866526@gmail.com',
    password: '$2a$10$yE/BnqXxsbP0ENw6ovswL.tKj2Mdb9hNggj8ng3DWjhGwQw/tyUsq',
    role: 'user',
    preferredLanguage: 'en',
    isActive: true,
    assessmentAccess: {
      technical: false,
      aptitude: false,
      coding: false,
      mockInterview: false,
    },
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

function upsertLocalUser(user) {
  if (!user) return null

  const normalizedUser = {
    id: user.id || user.email,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role || 'user',
    preferredLanguage: user.preferredLanguage || 'en',
    isActive: user.isActive !== false,
    assessmentAccess: {
      technical: user.assessmentAccess?.technical === true,
      aptitude: user.assessmentAccess?.aptitude === true,
      coding: user.assessmentAccess?.coding === true,
      mockInterview: user.assessmentAccess?.mockInterview === true,
    },
    refreshTokenVersion: typeof user.refreshTokenVersion === 'number' ? user.refreshTokenVersion : 0,
  }

  const existingIndex = LOCAL_USERS.findIndex(
    (item) => item.id === normalizedUser.id || item.email.toLowerCase() === String(normalizedUser.email || '').toLowerCase()
  )

  if (existingIndex >= 0) {
    LOCAL_USERS[existingIndex] = {
      ...LOCAL_USERS[existingIndex],
      ...normalizedUser,
    }
    return LOCAL_USERS[existingIndex]
  }

  LOCAL_USERS.push(normalizedUser)
  return normalizedUser
}

module.exports = {
  LOCAL_USERS,
  findLocalUserByEmail,
  findLocalUserById,
  updateLocalUser,
  upsertLocalUser,
}
