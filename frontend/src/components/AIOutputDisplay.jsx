import React from 'react'
import AIReport from './AIReport'

// Native AI pages and their saved detail views share the workspace's structured renderer.
export default function AIOutputDisplay({ data }) {
  if (data === null || data === undefined) return null
  return <AIReport response={data} title="AI analysis" />
}
