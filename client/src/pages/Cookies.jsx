import React from 'react'
import { BarChart3, Cookie, Key, Settings, Shield, UserCheck } from 'lucide-react'
import LegalPageLayout from '../components/LegalPageLayout'

const sections = [
  {
    title: 'How Cookies Are Used',
    description:
      'Cookies and similar browser storage technologies help the platform remember limited information, maintain expected functionality, and provide a consistent experience across visits.',
    icon: Cookie,
  },
  {
    title: 'Authentication and Sessions',
    description:
      'Authentication information may be stored in the browser to recognize signed-in users and maintain session continuity. This information should not be shared and is cleared when appropriate.',
    icon: Key,
  },
  {
    title: 'User Preferences',
    description:
      'Browser storage may remember settings such as language, interface choices, and other preferences so users do not need to configure the platform again on every visit.',
    icon: UserCheck,
  },
  {
    title: 'Performance Improvement',
    description:
      'Technical storage can support faster loading, reliable navigation, error diagnosis, and improvements to the overall stability and responsiveness of the platform.',
    icon: Shield,
  },
  {
    title: 'Analytics Usage',
    description:
      'Aggregated usage information may be used to understand feature performance and improve the user experience. Analytics should be configured to avoid collecting more personal information than necessary.',
    icon: BarChart3,
  },
  {
    title: 'Browser Cookie Controls',
    description:
      'You can review, block, or delete cookies and stored site data through your browser settings. Disabling essential storage may affect sign-in, saved preferences, and some platform functionality.',
    icon: Settings,
  },
]

export default function Cookies() {
  return (
    <LegalPageLayout
      badge="Cookies"
      title="Cookie Policy"
      subtitle="How browser storage supports secure sessions, preferences, and platform performance."
      introduction="This policy explains how AI Interview Platform uses cookies and similar browser technologies. These tools support essential functionality and help us provide a reliable, personalized experience."
      icon={Cookie}
      sections={sections}
    />
  )
}
