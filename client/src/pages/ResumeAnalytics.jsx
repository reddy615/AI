import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'
import ATSCard from '../components/resumeAnalytics/ATSCard'
import RadarSkills from '../components/resumeAnalytics/RadarSkills'
import SkillBars from '../components/resumeAnalytics/SkillBars'
import HistoryTimeline from '../components/resumeAnalytics/HistoryTimeline'
import InsightsCard from '../components/resumeAnalytics/InsightsCard'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Chart as ChartJS } from 'chart.js'
import CircularProgress from '../components/resumeAnalytics/CircularProgress'
import Heatmap from '../components/resumeAnalytics/Heatmap'
import SkillMatrix from '../components/resumeAnalytics/SkillMatrix'
import ConfidenceMeter from '../components/resumeAnalytics/ConfidenceMeter'
import RecruiterInsights from '../components/resumeAnalytics/RecruiterInsights'
import TrendGraph from '../components/resumeAnalytics/TrendGraph'
import SkeletonLoader from '../components/resumeAnalytics/SkeletonLoader'
import LoadingOverlay from '../components/LoadingOverlay'
import { useToast } from '../components/ToastProvider'
import './ResumeAnalytics.css'

export default function ResumeAnalytics() {
  const [loading, setLoading] = useState(true)
  const [analyses, setAnalyses] = useState([])
  const [selected, setSelected] = useState(null)
  const [exporting, setExporting] = useState(false)
  const toast = useToast()
  const [exportProgress, setExportProgress] = useState(0)
  const [exportSuccess, setExportSuccess] = useState(false)
  const rootRef = useRef(null)
  const executiveRef = useRef(null)
  const atsRef = useRef(null)
  const radarRef = useRef(null)
  const heatmapRef = useRef(null)
  const skillMatrixRef = useRef(null)
  const recruiterRef = useRef(null)
  const trendRef = useRef(null)
  const recommendationsRef = useRef(null)
  const historyRef = useRef(null)
  const cancelExportRef = useRef(false)
  const navigate = useNavigate()

  const loadAnalyses = useCallback(async () => {
    try {
      setLoading(true)
      const resp = await api.get('/api/resume/history')
      const items = resp?.data?.data || resp?.data || []
      setAnalyses(items)
      setSelected(items[0] || null)
    } catch (e) {
      console.error(e)
      toast.error('Unable to load resume analytics. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadAnalyses()
  }, [loadAnalyses])

  async function captureElement(el, scale = 2) {
    // ensure animations complete
    await new Promise((r) => setTimeout(r, 250))

    // Clone element into offscreen container to avoid layout shifts and keep consistent width
    const exportWidth = Math.min(window.innerWidth, 1200)
    const wrapper = document.createElement('div')
    wrapper.style.position = 'fixed'
    wrapper.style.top = '-99999px'
    wrapper.style.left = '0'
    wrapper.style.width = exportWidth + 'px'
    wrapper.style.padding = '20px'
    wrapper.style.background = '#ffffff'
    wrapper.style.zIndex = '99999'
    const clone = el.cloneNode(true)
    clone.style.width = '100%'
    clone.style.boxSizing = 'border-box'
    wrapper.appendChild(clone)
    document.body.appendChild(wrapper)

    try {
      const canvas = await html2canvas(clone, { scale, useCORS: true, backgroundColor: null })
      return canvas.toDataURL('image/png')
    } finally {
      document.body.removeChild(wrapper)
    }
  }

  async function exportFullReport(rootEl) {
    // Build a multi-page PDF: capture header, each major section separately for quality
    const pdf = new jsPDF('portrait', 'pt', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 28

    // Use explicit refs to capture in fixed professional order
    const refOrder = [
      executiveRef,
      atsRef,
      radarRef,
      heatmapRef,
      skillMatrixRef,
      recruiterRef,
      trendRef,
      recommendationsRef,
      historyRef,
      rootEl
    ]

    // Build ordered capture list (executive summary first)
    const ordered = [executiveRef, ...refOrder]

    const toCapture = []
    for (const r of ordered) {
      const el = r?.current ?? (r instanceof HTMLElement ? r : null)
      if (el && !toCapture.includes(el)) toCapture.push(el)
    }

    let step = 0
    const total = Math.min(12, toCapture.length)

    cancelExportRef.current = false
    for (const node of toCapture.slice(0, total)) {
      if (cancelExportRef.current) throw new Error('Export cancelled')
      setExportProgress(Math.round((++step/total)*100))
      // ensure charts update before capture
      try {
        // Update charts on canvas children for best rendering
        node.querySelectorAll('canvas').forEach((c) => {
          try {
            const chart = ChartJS.getChart(c)
            if (chart && typeof chart.update === 'function') chart.update()
          } catch (ee) {}
        })
      } catch (e){}
      // wait for fonts and animations to stabilize
      await document.fonts?.ready.catch(()=>{})
      await new Promise(r => setTimeout(r, 300))
      const imgData = await captureElement(node, 3)
      const imgProps = pdf.getImageProperties(imgData)
      const imgWidth = pageWidth - margin*2
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width

      if (imgHeight + margin*2 <= pageHeight) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight)
        pdf.setDrawColor(30,41,59)
        pdf.setLineWidth(1)
        pdf.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40)
        pdf.setFontSize(10)
        pdf.setTextColor(140)
        pdf.text(`Generated by YourCompany • ${new Date().toLocaleString()}`, margin, pageHeight - 20)
        const currentPageNumber = pdf.getNumberOfPages()
        pdf.text(`Page ${currentPageNumber}`, pageWidth - margin - 60, pageHeight - 20)
        if (step < total) pdf.addPage()
      } else {
        // slice into multiple pages vertically
        const ratio = imgProps.width / imgWidth
        const pageImgHeight = Math.floor((pageHeight - margin*2) * ratio)
        // draw canvas in segments
        const img = new Image()
        img.src = imgData
        await new Promise(r=>img.onload=r)
        let sy = 0
        while (sy < img.height) {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = Math.min(pageImgHeight, img.height - sy)
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, sy, img.width, canvas.height, 0, 0, canvas.width, canvas.height)
          const partData = canvas.toDataURL('image/png')
          const partProps = pdf.getImageProperties(partData)
          const partH = (partProps.height * imgWidth) / partProps.width
          pdf.addImage(partData, 'PNG', margin, margin, imgWidth, partH)
          pdf.setDrawColor(30,41,59)
          pdf.setLineWidth(1)
          pdf.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40)
          pdf.setFontSize(10)
          pdf.setTextColor(140)
          pdf.text(`Generated by YourCompany • ${new Date().toLocaleString()}`, margin, pageHeight - 20)
          const currentPageNumber = pdf.getNumberOfPages()
          pdf.text(`Page ${currentPageNumber}`, pageWidth - margin - 60, pageHeight - 20)
          sy += canvas.height
          if (sy < img.height) pdf.addPage()
        }
        if (step < total) pdf.addPage()
      }
    }

    // metadata page
    pdf.addPage()
    pdf.setFontSize(16)
    pdf.setTextColor(20)
    pdf.text('Executive Summary', margin, 80)
    pdf.setFontSize(11)
    pdf.setTextColor(100)
    const summary = selected?.analysis?.executive_summary || 'No executive summary available.'
    pdf.text(pdf.splitTextToSize(summary, pageWidth - margin*2), margin, 110)
    pdf.setDrawColor(30,41,59)
    pdf.setLineWidth(1)
    pdf.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40)
    pdf.setFontSize(10)
    pdf.setTextColor(140)
    pdf.text(`Generated by YourCompany • ${new Date().toLocaleString()}`, margin, pageHeight - 20)
    const finalPageNumber = pdf.getNumberOfPages()
    pdf.text(`Page ${finalPageNumber}`, pageWidth - margin - 60, pageHeight - 20)

    // finalize
    setExportProgress(100)
    pdf.save(`resume-analysis-${Date.now()}.pdf`)
  }

  return (
    <div className="min-h-screen p-6">
      <LoadingOverlay
        visible={loading}
        title="Loading report"
        subtitle="Building your latest resume analytics and history."
      />
      <div className="max-w-[1200px] mx-auto">
        {exporting && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-900/80 p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 animate-spin text-white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="60"/></svg>
                <div className="text-white font-semibold">Preparing report...</div>
              </div>
              <div className="text-sm text-slate-300">Rendering charts and optimizing layout — this may take a moment.</div>
              <div className="w-64 bg-slate-800 h-2 rounded overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${exportProgress}%` }} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { cancelExportRef.current = true; setExporting(false); setExportProgress(0); }} className="px-3 py-2 bg-red-600 text-white rounded">Cancel</button>
              </div>
            </div>
          </div>
        )}
        {/* Export notifications */}
        {exporting && (
          <div className="fixed top-6 right-6 z-50 w-72 bg-indigo-800/80 backdrop-blur rounded-lg p-3 shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="60"/></svg>
            <div className="flex-1">
              <div className="text-sm text-white">Exporting report</div>
              <div className="text-xs text-indigo-200">{exportProgress}%</div>
            </div>
            <button onClick={() => { cancelExportRef.current = true; setExporting(false); setExportProgress(0); }} className="text-xs text-indigo-100 bg-indigo-700/30 px-2 py-1 rounded">Cancel</button>
          </div>
        )}
        {exportSuccess && (
          <div className="fixed top-6 right-6 z-50 w-64 bg-emerald-800/90 backdrop-blur rounded-lg p-3 shadow-lg text-white">
            <div className="font-semibold">Export complete</div>
            <div className="text-sm text-emerald-200">Your PDF was downloaded.</div>
          </div>
        )}
        <div className="report-header flex items-center justify-between mb-6">
          <div>
            <h1 className="report-title text-2xl font-bold text-white">Resume Analytics</h1>
            <p className="report-subtitle text-sm text-slate-400">Premium insights, ATS metrics and recruiter-ready reports.</p>
          </div>
            <div className="flex items-center gap-3">
            <button onClick={() => navigate('/resume')} className="px-4 py-2 rounded bg-slate-800 text-white">Manage Resume</button>
            <button
              onClick={async () => {
                // Simple quick export (legacy)
                setExporting(true)
                setExportProgress(5)
                try {
                  const el = rootRef.current || document.getElementById('resume-analytics-root')
                  if (!el) throw new Error('Export target not found')
                  await exportFullReport(el)
                  setExportSuccess(true)
                  setTimeout(()=>setExportSuccess(false), 3000)
                } catch (e) {
                  console.error(e)
                  toast.error('Export failed. Please try again or refresh the page.')
                } finally {
                  setExporting(false)
                  setExportProgress(0)
                }
              }}
              disabled={exporting}
              className={`px-4 py-2 rounded ${exporting ? 'bg-indigo-400' : 'bg-indigo-600'} text-white flex items-center gap-2`}
            >
              {exporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="60"/></svg>
                  Exporting {exportProgress}%
                </>
              ) : (
                'Download Full AI Report'
              )}
            </button>
          </div>
        </div>

        <div id="resume-analytics-root" ref={rootRef} className="resume-analytics-report report-export-root grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="report-workspace lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8 space-y-6">
              {/* Executive summary visible on page and captured via ref */}
              {selected && (
                <div ref={executiveRef} className="report-section report-executive mb-4 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                  <h3 className="section-heading text-lg font-semibold text-white">Executive Summary</h3>
                  <p className="section-copy text-sm text-slate-200 mt-2">{selected?.analysis?.executive_summary || 'No summary available.'}</p>
                </div>
              )}
<div className="report-section report-card grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="report-card-inner rounded-xl p-4 bg-slate-900/40 border border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-300">ATS Score</p>
                    <p className="text-2xl font-semibold text-white"><span className="text-lg">{selected?._id ? '' : ''}</span></p>
                  </div>
                  <CircularProgress value={selected?.analysis?.ATS || selected?.analysis?.ats || 0} />
                </div>

                <div className="rounded-xl p-4 bg-slate-900/40 border border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-300">Resume Quality</p>
                  </div>
                  <CircularProgress value={selected?.analysis?.resume_quality || 0} color="emerald" />
                </div>

                <div className="rounded-xl p-4 bg-slate-900/40 border border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-300">Interview Readiness</p>
                  </div>
                  <CircularProgress value={selected?.analysis?.interview_readiness || 0} color="rose" />
                </div>
              </div>

              <div className="report-section report-card rounded-xl border border-slate-700 bg-slate-900/40 p-6">
                <h3 className="section-heading text-lg font-semibold text-white mb-4">Skill Distribution</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <RadarSkills data={selected?.analysis?.skills || {}} />
                  </div>
                  <div>
                    <SkillBars skills={selected?.analysis?.skills || {}} />
                    <div className="mt-4">
                      <h4 className="text-sm text-slate-300 mb-2">Skill Match Matrix</h4>
                      <SkillMatrix data={selected?.analysis?.skills || {}} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="report-section report-card rounded-xl border border-slate-700 bg-slate-900/40 p-6">
                <h3 className="section-heading text-lg font-semibold text-white mb-4">Talent Trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TrendGraph series={selected?.analysis?.trend || [{label:'T1',value:60},{label:'T2',value:70}]} />
                  <div>
                    <h4 className="text-sm text-slate-300 mb-2">Resume Strength Heatmap</h4>
                    <Heatmap matrix={selected?.analysis?.heatmap || [[30,50,70],[40,60,80],[20,40,60]]} />
                  </div>
                </div>
              </div>

              <div className="report-section report-card rounded-xl border border-slate-700 bg-slate-900/40 p-6">
                <h3 className="section-heading text-lg font-semibold text-white mb-4">AI Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InsightsCard title="Strengths" items={selected?.analysis?.strengths || []} kind="success" />
                  <InsightsCard title="Weaknesses" items={selected?.analysis?.weaknesses || []} kind="warn" />
                  <InsightsCard title="Recruiter Perspective" items={selected?.analysis?.recruiter_perspective || []} kind="info" />
                  <InsightsCard title="ATS Optimization Tips" items={selected?.analysis?.ats_tips || selected?.analysis?.optimization || []} kind="tip" />
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 space-y-6">
              <div className="report-section report-card rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                <h4 className="section-heading text-sm text-slate-300 mb-2">Analysis History</h4>
                <HistoryTimeline items={analyses} onSelect={(it) => setSelected(it)} selected={selected} loading={loading} />
              </div>

              <div className="report-section report-card rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                <h4 className="section-heading text-sm text-slate-300 mb-2">AI Confidence Meter</h4>
                <ConfidenceMeter value={selected?.analysis?.confidence || selected?.analysis?.ai_confidence || 70} />
              </div>

              <div className="report-section report-card rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                <h4 className="section-heading text-sm text-slate-300 mb-2">Missing Keywords</h4>
                <div className="text-sm text-slate-200">
                  {(selected?.analysis?.missing_keywords || []).length === 0 ? (
                    <p className="text-slate-400">No missing keywords detected.</p>
                  ) : (
                    <ul className="list-disc pl-5">
                      {(selected?.analysis?.missing_keywords || []).map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                  )}
                </div>
              </div>

              <div className="report-section report-card rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                <RecruiterInsights analysis={selected?.analysis || {}} />
              </div>
            </div>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ATSCard label="ATS Score" value={selected?.analysis?.ATS || selected?.analysis?.ats || 0} color="emerald" />
              <ATSCard label="Resume Quality" value={selected?.analysis?.resume_quality || 0} color="cyan" />
              <ATSCard label="Interview Readiness" value={selected?.analysis?.interview_readiness || 0} color="rose" />
            </div>

            <div className="report-section report-card rounded-xl border border-slate-700 bg-slate-900/40 p-6">
              <h3 className="section-heading text-lg font-semibold text-white mb-4">Skill Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RadarSkills data={selected?.analysis?.skills || {}} />
                <SkillBars skills={selected?.analysis?.skills || {}} />
              </div>
            </div>

            <div className="report-section report-card rounded-xl border border-slate-700 bg-slate-900/40 p-6">
              <h3 className="section-heading text-lg font-semibold text-white mb-4">AI Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InsightsCard title="Strengths" items={selected?.analysis?.strengths || selected?.analysis?.strengths || []} kind="success" />
                <InsightsCard title="Weaknesses" items={selected?.analysis?.weaknesses || []} kind="warn" />
                <InsightsCard title="Recruiter Perspective" items={selected?.analysis?.recruiter_perspective || []} kind="info" />
                <InsightsCard title="ATS Optimization Tips" items={selected?.analysis?.ats_tips || selected?.analysis?.optimization || []} kind="tip" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="report-section report-card rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <h4 className="section-heading text-sm text-slate-300 mb-2">Analysis History</h4>
              <HistoryTimeline items={analyses} onSelect={(it) => setSelected(it)} selected={selected} loading={loading} />
            </div>

            <div className="report-section report-card rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <h4 className="section-heading text-sm text-slate-300 mb-2">Missing Keywords</h4>
              <div className="text-sm text-slate-200">
                {(selected?.analysis?.missing_keywords || []).length === 0 ? (
                  <p className="text-slate-400">No missing keywords detected.</p>
                ) : (
                  <ul className="list-disc pl-5">
                    {(selected?.analysis?.missing_keywords || []).map((k, i) => <li key={i}>{k}</li>)}
                  </ul>
                )}
              </div>
            </div>

            <div className="report-section report-card rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <h4 className="section-heading text-sm text-slate-300 mb-2">Suggested Improvements</h4>
              <div className="text-sm text-slate-200">{(selected?.analysis?.improvement_suggestions || []).slice(0,5).map((s,i)=>(<p key={i}>- {s}</p>))}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
