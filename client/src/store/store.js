import { configureStore, createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: localStorage.getItem('token') || null, user: JSON.parse(localStorage.getItem('user') || 'null') },
  reducers: {
    setToken(state, action){
      state.token = action.payload
      localStorage.setItem('token', action.payload)
    },
    clearToken(state){
      state.token = null
      localStorage.removeItem('token')
    },
    setUser(state, action){
      state.user = action.payload
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload))
      } else {
        localStorage.removeItem('user')
      }
    },
    clearAuth(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})

export const { setToken, clearToken, setUser, clearAuth } = authSlice.actions

const store = configureStore({ reducer: { auth: authSlice.reducer } })
export default store
