import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './api'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TrademarkMonitoring from './pages/TrademarkMonitoring'
import InfringementDetection from './pages/InfringementDetection'
import DomainMonitoring from './pages/DomainMonitoring'
import SocialMediaMonitoring from './pages/SocialMediaMonitoring'
import CounterfeitDetection from './pages/CounterfeitDetection'
import CeaseDesistGenerator from './pages/CeaseDesistGenerator'
import TrademarkSearch from './pages/TrademarkSearch'
import SentimentAnalysis from './pages/SentimentAnalysis'
import CompetitorAnalysis from './pages/CompetitorAnalysis'
import LogoSimilarity from './pages/LogoSimilarity'
import MarketplaceMonitoring from './pages/MarketplaceMonitoring'
import LegalCaseManagement from './pages/LegalCaseManagement'
import ReportGeneration from './pages/ReportGeneration'
import AlertManagement from './pages/AlertManagement'
import AuditTrail from './pages/AuditTrail'
import AIHub from './pages/AIHub'

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/trademarks" element={<ProtectedRoute><TrademarkMonitoring /></ProtectedRoute>} />
      <Route path="/infringements" element={<ProtectedRoute><InfringementDetection /></ProtectedRoute>} />
      <Route path="/domains" element={<ProtectedRoute><DomainMonitoring /></ProtectedRoute>} />
      <Route path="/social" element={<ProtectedRoute><SocialMediaMonitoring /></ProtectedRoute>} />
      <Route path="/counterfeits" element={<ProtectedRoute><CounterfeitDetection /></ProtectedRoute>} />
      <Route path="/cease-desist" element={<ProtectedRoute><CeaseDesistGenerator /></ProtectedRoute>} />
      <Route path="/trademark-search" element={<ProtectedRoute><TrademarkSearch /></ProtectedRoute>} />
      <Route path="/sentiment" element={<ProtectedRoute><SentimentAnalysis /></ProtectedRoute>} />
      <Route path="/competitors" element={<ProtectedRoute><CompetitorAnalysis /></ProtectedRoute>} />
      <Route path="/logos" element={<ProtectedRoute><LogoSimilarity /></ProtectedRoute>} />
      <Route path="/marketplace" element={<ProtectedRoute><MarketplaceMonitoring /></ProtectedRoute>} />
      <Route path="/legal" element={<ProtectedRoute><LegalCaseManagement /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportGeneration /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><AlertManagement /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />
      <Route path="/ai-hub" element={<ProtectedRoute><AIHub /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
