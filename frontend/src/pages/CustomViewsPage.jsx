import React from 'react'
import InfringementTrendChart from '../components/InfringementTrendChart'
import ClassRegionHeatmap from '../components/ClassRegionHeatmap'
import MonitoringReportPDF from '../components/MonitoringReportPDF'
import WatchlistRulesEditor from '../components/WatchlistRulesEditor'

export default function CustomViewsPage() {
  return (
    <div className="custom-views-page" data-testid="custom-views-page" style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Brand Views</h1>
        <p style={{ color: '#666', marginTop: 4 }}>
          Custom analytics, exports, and rule management for trademark and brand protection.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
        <InfringementTrendChart />
        <ClassRegionHeatmap />
        <MonitoringReportPDF />
        <WatchlistRulesEditor />
      </div>
    </div>
  )
}
