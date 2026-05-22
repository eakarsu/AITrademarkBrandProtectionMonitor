import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';
import TimelineView from './pages/TimelineView';

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
import LogoAnalyzer from './pages/LogoAnalyzer'
import DomainWatcher from './pages/DomainWatcher'
import BrandHealthReport from './pages/BrandHealthReport'
// === Batch 08 Gaps & Frontend Mounts ===
import CfVisualCounterfeitDetectionFromProductPhotos from './pages/CfVisualCounterfeitDetectionFromProductPhotos'
import CfAutomatedCDLetterDraftingWithJurisdictional from './pages/CfAutomatedCDLetterDraftingWithJurisdictional'
import CfFranchiseBrandProtectionMonitoringFranchiseeCompliance from './pages/CfFranchiseBrandProtectionMonitoringFranchiseeCompliance'
import CfMarketExpansionScoutingIdentifyingInfringementsInNew from './pages/CfMarketExpansionScoutingIdentifyingInfringementsInNew'
import CfBrandDilutionScoringAcrossCategories from './pages/CfBrandDilutionScoringAcrossCategories'
import CfUsptoWipoLiveFeedIntegrationWithAuto from './pages/CfUsptoWipoLiveFeedIntegrationWithAuto'
import GapNoAiForCounterfeitImageAnalysisComputer from './pages/GapNoAiForCounterfeitImageAnalysisComputer'
import GapNoAiForAutomatedCeaseAndDesist from './pages/GapNoAiForAutomatedCeaseAndDesist'
import GapNoPredictiveEnforcementOutcomeModel from './pages/GapNoPredictiveEnforcementOutcomeModel'
import GapNoDirectIntegrationWithUsptoWipoDatabases from './pages/GapNoDirectIntegrationWithUsptoWipoDatabases'
import GapNoIntegrationWithLawFirmsForEnforcement from './pages/GapNoIntegrationWithLawFirmsForEnforcement'
import GapNoMultiLanguageSupport from './pages/GapNoMultiLanguageSupport'
import GapNoGeographicJurisdictionFiltering from './pages/GapNoGeographicJurisdictionFiltering'
import GapNoWebhooksForRealTimeAlertDelivery from './pages/GapNoWebhooksForRealTimeAlertDelivery'
import GapNoNotificationsRoutingBeyondAlertsJs from './pages/GapNoNotificationsRoutingBeyondAlertsJs'
import CustomViewsPage from './pages/CustomViewsPage'

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <Routes>
        <Route path="/insights/timeline" element={<ProtectedRoute><TimelineView /></ProtectedRoute>} />
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

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
      <Route path="/logo-analyzer" element={<ProtectedRoute><LogoAnalyzer /></ProtectedRoute>} />
      <Route path="/domain-watcher" element={<ProtectedRoute><DomainWatcher /></ProtectedRoute>} />
      <Route path="/brand-health" element={<ProtectedRoute><BrandHealthReport /></ProtectedRoute>} />
      {/* // === Batch 08 Gaps & Frontend Mounts === */}
      <Route path="/cf-visual-counterfeit-detection-from-product-photos" element={<ProtectedRoute><CfVisualCounterfeitDetectionFromProductPhotos /></ProtectedRoute>} />
      <Route path="/cf-automated-c-d-letter-drafting-with-jurisdictional-legal" element={<ProtectedRoute><CfAutomatedCDLetterDraftingWithJurisdictional /></ProtectedRoute>} />
      <Route path="/cf-franchise-brand-protection-monitoring-franchisee-compliance" element={<ProtectedRoute><CfFranchiseBrandProtectionMonitoringFranchiseeCompliance /></ProtectedRoute>} />
      <Route path="/cf-market-expansion-scouting-identifying-infringements-in-new-geographies" element={<ProtectedRoute><CfMarketExpansionScoutingIdentifyingInfringementsInNew /></ProtectedRoute>} />
      <Route path="/cf-brand-dilution-scoring-across-categories" element={<ProtectedRoute><CfBrandDilutionScoringAcrossCategories /></ProtectedRoute>} />
      <Route path="/cf-uspto-wipo-live-feed-integration-with-auto-renewal-tracking" element={<ProtectedRoute><CfUsptoWipoLiveFeedIntegrationWithAuto /></ProtectedRoute>} />
      <Route path="/gap-no-ai-for-counterfeit-image-analysis-computer-vision" element={<ProtectedRoute><GapNoAiForCounterfeitImageAnalysisComputer /></ProtectedRoute>} />
      <Route path="/gap-no-ai-for-automated-cease-and-desist-drafting-beyond-stub" element={<ProtectedRoute><GapNoAiForAutomatedCeaseAndDesist /></ProtectedRoute>} />
      <Route path="/gap-no-predictive-enforcement-outcome-model" element={<ProtectedRoute><GapNoPredictiveEnforcementOutcomeModel /></ProtectedRoute>} />
      <Route path="/gap-no-direct-integration-with-uspto-wipo-databases-only" element={<ProtectedRoute><GapNoDirectIntegrationWithUsptoWipoDatabases /></ProtectedRoute>} />
      <Route path="/gap-no-integration-with-law-firms-for-enforcement-workflow" element={<ProtectedRoute><GapNoIntegrationWithLawFirmsForEnforcement /></ProtectedRoute>} />
      <Route path="/gap-no-multi-language-support" element={<ProtectedRoute><GapNoMultiLanguageSupport /></ProtectedRoute>} />
      <Route path="/gap-no-geographic-jurisdiction-filtering" element={<ProtectedRoute><GapNoGeographicJurisdictionFiltering /></ProtectedRoute>} />
      <Route path="/gap-no-webhooks-for-real-time-alert-delivery" element={<ProtectedRoute><GapNoWebhooksForRealTimeAlertDelivery /></ProtectedRoute>} />
      <Route path="/gap-no-notifications-routing-beyond-alerts-js" element={<ProtectedRoute><GapNoNotificationsRoutingBeyondAlertsJs /></ProtectedRoute>} />
      <Route path="/custom-views" element={<ProtectedRoute><CustomViewsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
