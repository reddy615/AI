import React from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function Blog() {
  const { t } = useLanguage()

  const upcomingArticles = [
    {
      title: 'Mastering System Design Interviews',
      description: 'Learn the frameworks and patterns used by top tech companies to evaluate architectural thinking.',
      category: 'System Design',
      date: 'Coming Soon',
    },
    {
      title: 'Behavioral Interview Excellence',
      description: 'Discover how to tell compelling stories that showcase your skills and impact.',
      category: 'Soft Skills',
      date: 'Coming Soon',
    },
    {
      title: 'Coding Interview Strategies',
      description: 'Master the techniques and approaches used by candidates at FAANG companies.',
      category: 'Coding',
      date: 'Coming Soon',
    },
    {
      title: 'Salary Negotiation Guide',
      description: 'Navigate compensation discussions with confidence and achieve your career goals.',
      category: 'Career',
      date: 'Coming Soon',
    },
    {
      title: 'Resume Best Practices',
      description: 'Create a resume that passes ATS systems and impresses hiring managers.',
      category: 'Resume',
      date: 'Coming Soon',
    },
    {
      title: 'Remote Interview Tips',
      description: 'Optimize your setup and presence for virtual interview success.',
      category: 'Remote',
      date: 'Coming Soon',
    },
  ]

  const categories = ['All', 'System Design', 'Soft Skills', 'Coding', 'Career', 'Resume', 'Remote']

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Interview Insights & Tips
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Expert articles and resources to help you succeed in every stage of your interview journey.
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-full transition ${
                  cat === 'All'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingArticles.map((article, idx) => (
              <div
                key={idx}
                className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden hover:border-cyan-500/50 transition hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="h-48 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 flex items-center justify-center border-b border-slate-700">
                  <svg
                    className="w-16 h-16 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full">
                      {article.category}
                    </span>
                    <span className="text-xs text-slate-500">{article.date}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{article.title}</h3>
                  <p className="text-slate-400 text-sm mb-4">{article.description}</p>
                  <button className="text-cyan-400 hover:text-cyan-300 transition text-sm font-medium">
                    Learn More →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="py-16 sm:py-24 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-y border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-slate-400 mb-8">
            Subscribe to our newsletter for weekly interview tips, insights, and exclusive resources.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
