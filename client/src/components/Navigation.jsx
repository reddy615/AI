import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navigation({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    onLogout()
    setIsOpen(false)
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Features', href: '/#features' },
    { label: 'Resume', href: '/resume' },
    { label: 'Mock Interview', href: '/interview' },
    { label: 'Coding Lab', href: '/coding' },
    { label: 'Assessment', href: '/assessment' },
  ]

  const isActiveNavItem = (href) => {
    if (href === '/resume') {
      return location.pathname.startsWith('/resume')
    }
    if (href === '/#features') {
      return location.pathname === '/' && location.hash === '#features'
    }
    return location.pathname === href
  }

  const navLinkClass = (item) =>
    `text-sm font-medium transition ${
      isActiveNavItem(item.href)
        ? 'text-cyan-400 font-semibold'
        : 'text-slate-300 hover:text-cyan-400'
    }`

  const handleNavClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/10 bg-slate-950/80 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="group flex items-center gap-2 text-2xl font-bold"
            >
              <div className="rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
                  <path d="M12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="white"/>
                </svg>
              </div>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                AI Interview
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden items-center gap-8 xl:flex">
              {navItems.map((item) => (
                <motion.div
                  key={item.href}
                  whileHover={{ y: -2 }}
                >
                  <Link to={item.href} className={navLinkClass(item)}>
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="hidden text-sm font-medium text-slate-300 transition hover:text-cyan-400 sm:inline"
                  >
                    {user.name}
                  </Link>
                  <motion.button
                    type="button"
                    onClick={handleLogout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="hidden rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30 sm:flex items-center gap-2"
                  >
                    <LogOut width={16} />
                    Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden text-sm font-medium text-slate-300 transition hover:text-cyan-400 sm:inline"
                  >
                    Sign In
                  </Link>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/register"
                      className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:shadow-cyan-500/50"
                    >
                      Get Started
                    </Link>
                  </motion.div>
                </>
              )}

              {/* Mobile menu button */}
              <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-400 hover:text-white xl:hidden"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-20 z-40 bg-slate-950 xl:hidden"
          >
            <div className="space-y-2 px-4 py-6">
              {navItems.map((item) => (
                <motion.div
                  key={item.href}
                  whileHover={{ x: 4 }}
                >
                  <Link
                    to={item.href}
                    onClick={handleNavClick}
                    className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                      isActiveNavItem(item.href)
                        ? 'bg-slate-900 text-cyan-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-cyan-400'
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <div className="border-t border-slate-800 pt-4 mt-4">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-slate-400">{user.name}</div>
                    <motion.button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30 flex items-center justify-center gap-2 mt-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <LogOut width={16} />
                      Logout
                    </motion.button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="block rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white text-center mt-2"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
