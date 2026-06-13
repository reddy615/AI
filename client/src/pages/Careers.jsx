import React from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function Careers() {
  const { t } = useLanguage()

  const openRoles = [
    {
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      location: 'Remote',
      description: 'Build scalable features that help millions prepare for interviews.',
    },
    {
      title: 'ML/AI Engineer',
      department: 'AI/ML',
      location: 'Remote',
      description: 'Develop intelligent interview simulation and feedback systems.',
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote',
      description: 'Shape the future of interview preparation technology.',
    },
    {
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'Remote',
      description: 'Create beautiful and intuitive experiences for learners.',
    },
  ]

  const values = [
    {
      title: 'Empower Growth',
      description: 'We believe in helping people achieve their career goals through technology and education.',
    },
    {
      title: 'Innovation First',
      description: 'We stay at the cutting edge of AI and education technology.',
    },
    {
      title: 'Quality Matters',
      description: 'We maintain high standards in everything we build and deliver.',
    },
    {
      title: 'Diversity & Inclusion',
      description: 'We celebrate diverse perspectives and create an inclusive environment.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Join Our Team
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              We're building the future of interview preparation. Come help us transform how people prepare for career opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-slate-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Roles Section */}
      <div className="py-16 sm:py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Open Positions</h2>
          <div className="space-y-4">
            {openRoles.length > 0 ? (
              openRoles.map((role, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{role.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                          {role.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                          {role.location}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-2">{role.description}</p>
                    </div>
                    <button className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition whitespace-nowrap">
                      Apply Now
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg">
                  No positions open at the moment. Check back soon!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🏠', title: 'Remote First', description: 'Work from anywhere in the world' },
              { icon: '💰', title: 'Competitive Pay', description: 'Salary and equity packages' },
              { icon: '🏥', title: 'Health Benefits', description: 'Comprehensive health coverage' },
              { icon: '📚', title: 'Learning Budget', description: 'Annual professional development' },
              { icon: '🗓️', title: 'Flexible Hours', description: 'Work-life balance matters' },
              { icon: '🚀', title: 'Growth Path', description: 'Clear career advancement' },
            ].map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-slate-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 sm:py-24 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Interested in Future Opportunities?</h2>
          <p className="text-slate-400 mb-8">
            We're always looking for talented individuals to join our mission. Submit your resume and we'll keep you in mind for upcoming positions.
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition">
            Send Us Your Resume
          </button>
        </div>
      </div>
    </div>
  )
}
