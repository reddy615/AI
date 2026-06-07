import { Link } from 'react-router-dom'

const socialLinks = [
  { label: 'Twitter', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'GitHub', href: '#' },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/90 backdrop-blur-xl py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4 text-xl font-bold text-white">
              <div className="rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-2 shadow-lg shadow-cyan-500/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
                </svg>
              </div>
              <span>AI Interview</span>
            </div>
            <p className="text-slate-400 text-sm">Master your interview game with AI-powered practice.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/interview" className="hover:text-cyan-400 transition">Mock Interview</Link></li>
              <li><Link to="/coding" className="hover:text-cyan-400 transition">Coding Lab</Link></li>
              <li><Link to="/analytics" className="hover:text-cyan-400 transition">Analytics</Link></li>
              <li><Link to="/resume" className="hover:text-cyan-400 transition">Resume Vault</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-cyan-400 transition">About</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Blog</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Careers</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-cyan-400 transition">Privacy</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Terms</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Security</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">© 2024 AI Interview Platform. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} className="text-slate-400 hover:text-cyan-400 transition text-sm">
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
