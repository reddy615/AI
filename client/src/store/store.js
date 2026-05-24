import { configureStore, createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: localStorage.getItem('token') || null, user: null },
  reducers: {
    setToken(state, action){ state.token = action.payload; localStorage.setItem('token', action.payload) },
    clearToken(state){ state.token = null; localStorage.removeItem('token') },
    setUser(state, action){ state.user = action.payload }
  }
})

export const { setToken, clearToken, setUser } = authSlice.actions

const store = configureStore({ reducer: { auth: authSlice.reducer } })
export default store
