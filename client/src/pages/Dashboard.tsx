import { useEffect, useState } from 'react'
import type { PortalData } from '../../../types/shared/portal'
import { apiService } from '../services/api'
import './Dashboard.css'

const Dashboard = () => {
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const portalData = await apiService.getPortalData()
        setData(portalData)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch portal data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="loading">Loading dashboard...</div>
  if (error) return <div className="error">Error: {error}</div>
  if (!data) return <div className="error">No data available</div>

  return (
    <div className="dashboard">
      {/* Page Header */}
      <div className="dashboard-header">
        <div className="breadcrumb-nav">
          <span className="breadcrumb-item">🏠</span>
          <span className="breadcrumb-separator">•</span>
          <span className="breadcrumb-item">Dashboard</span>
          <span className="breadcrumb-separator">•</span>
          <span className="breadcrumb-current">Company Vital Signs</span>
        </div>
        <h1 className="page-title">Company Vital Signs</h1>
      </div>

      {/* Main Metrics Cards */}
      <div className="vital-signs-grid">
        {/* Transaction Units Card */}
        <div className="vital-card">
          <div className="card-header">
            <div className="card-info">
              <span className="card-category">TRANSACTION UNITS</span>
              <h2 className="card-goal">Annual Goal: 47 Closed Units</h2>
            </div>
            <div className="progress-circle">
              <span className="progress-percent">{Math.round((data.units.closed / 47) * 100)}%</span>
            </div>
          </div>
          
          <div className="metrics-list">
            <div className="metric-row">
              <div className="metric-dot active"></div>
              <span className="metric-label">Active</span>
              <span className="metric-value">{data.units.active}</span>
            </div>
            <div className="metric-row">
              <div className="metric-dot pending"></div>
              <span className="metric-label">Pending</span>
              <span className="metric-value">{data.units.pending}</span>
            </div>
            <div className="metric-row">
              <div className="metric-dot closed"></div>
              <span className="metric-label">Closed</span>
              <span className="metric-value">{data.units.closed}</span>
            </div>
            <div className="metric-row total">
              <div className="metric-dot total"></div>
              <span className="metric-label">Total Pending & Closed</span>
              <span className="metric-value">{data.units.pending + data.units.closed}</span>
            </div>
          </div>
        </div>

        {/* Transaction Volume Card */}
        <div className="vital-card">
          <div className="card-header">
            <div className="card-info">
              <span className="card-category">TRANSACTION VOLUME</span>
              <h2 className="card-goal">Annual Goal: $19,740,000.00</h2>
            </div>
            <div className="progress-circle">
              <span className="progress-percent">{Math.round((data.volume.closed / 19740000) * 100)}%</span>
            </div>
          </div>
          
          <div className="metrics-list">
            <div className="metric-row">
              <div className="metric-dot active"></div>
              <span className="metric-label">Active Listing Volume</span>
              <span className="metric-value">${data.volume.active.toLocaleString()}</span>
            </div>
            <div className="metric-row">
              <div className="metric-dot pending"></div>
              <span className="metric-label">Pending Volume</span>
              <span className="metric-value">${data.volume.pending.toLocaleString()}</span>
            </div>
            <div className="metric-row">
              <div className="metric-dot closed"></div>
              <span className="metric-label">Closed Volume</span>
              <span className="metric-value">${data.volume.closed.toLocaleString()}</span>
            </div>
            <div className="metric-row total">
              <div className="metric-dot total"></div>
              <span className="metric-label">Total Pending & Closed Volume</span>
              <span className="metric-value">${(data.volume.pending + data.volume.closed).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Transaction GCI Card */}
        <div className="vital-card">
          <div className="card-header">
            <div className="card-info">
              <span className="card-category">TRANSACTION GCI</span>
              <h2 className="card-goal">Annual Goal: $282,000.00</h2>
            </div>
            <div className="progress-circle">
              <span className="progress-percent">{Math.round((data.gci.closed / 282000) * 100)}%</span>
            </div>
          </div>
          
          <div className="metrics-list">
            <div className="metric-row">
              <div className="metric-dot active"></div>
              <span className="metric-label">Active Listing GCI</span>
              <span className="metric-value">${data.gci.active.toLocaleString()}</span>
            </div>
            <div className="metric-row">
              <div className="metric-dot pending"></div>
              <span className="metric-label">Pending GCI</span>
              <span className="metric-value">${data.gci.pending.toLocaleString()}</span>
            </div>
            <div className="metric-row">
              <div className="metric-dot closed"></div>
              <span className="metric-label">Closed GCI</span>
              <span className="metric-value">${data.gci.closed.toLocaleString()}</span>
            </div>
            <div className="metric-row total">
              <div className="metric-dot total"></div>
              <span className="metric-label">Total Pending & Closed GCI</span>
              <span className="metric-value">${(data.gci.pending + data.gci.closed).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Gross Commission Income Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Gross Commission Income</h3>
            <div className="chart-actions">
              <button className="chart-btn goal-gap">GOAL GAP VIEW</button>
              <button className="chart-btn actual-only active">ACTUAL ONLY</button>
            </div>
          </div>
          
          <div className="chart-placeholder">
            <div className="line-chart">
              {/* Simplified line chart representation */}
              <svg width="100%" height="200" viewBox="0 0 800 200">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                
                {/* Chart line based on actual monthly profits */}
                <polyline
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  points={data.monthly_profits.map((value, index) => {
                    const x = 50 + (index * 700) / 11
                    const maxValue = Math.max(...data.monthly_profits)
                    const y = 180 - (value / maxValue) * 160
                    return `${x},${y}`
                  }).join(' ')}
                />
                
                {/* Data points */}
                {data.monthly_profits.map((value, index) => {
                  const x = 50 + (index * 700) / 11
                  const maxValue = Math.max(...data.monthly_profits)
                  const y = 180 - (value / maxValue) * 160
                  return <circle key={index} cx={x} cy={y} r="4" fill="#ef4444" />
                })}
                
                {/* Y-axis labels */}
                <text x="20" y="40" fontSize="12" fill="#6b7280">$30,000</text>
                <text x="20" y="90" fontSize="12" fill="#6b7280">$20,000</text>
                <text x="20" y="140" fontSize="12" fill="#6b7280">$10,000</text>
                <text x="20" y="190" fontSize="12" fill="#6b7280">$0</text>
                
                {/* X-axis labels */}
                <text x="50" y="195" fontSize="10" fill="#6b7280">Jan</text>
                <text x="150" y="195" fontSize="10" fill="#6b7280">Mar</text>
                <text x="250" y="195" fontSize="10" fill="#6b7280">May</text>
                <text x="350" y="195" fontSize="10" fill="#6b7280">Jul</text>
                <text x="450" y="195" fontSize="10" fill="#6b7280">Sep</text>
                <text x="550" y="195" fontSize="10" fill="#6b7280">Nov</text>
                <text x="650" y="195" fontSize="10" fill="#6b7280">Jan</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Goal/Gap Section */}
        <div className="goalgap-container">
          <h3>Goal/Gap</h3>
          
          <div className="goalgap-stats">
            <div className="stat-item">
              <div className="stat-circle red">
                <span className="stat-number">68</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">DAYS LEFT</span>
                <span className="stat-detail">to take listings in Q4 (2025): 9/27/2025</span>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-circle blue">
                <span className="stat-number">57</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">DAYS LEFT</span>
                <span className="stat-detail">to sell in Q1 (2026): 9/30/2025</span>
              </div>
            </div>
          </div>

          <div className="listing-year">
            <h4>Listing Year</h4>
            <span className="year">2025</span>
          </div>

          <div className="transaction-year">
            <h4>Transaction Year</h4>
            <span className="year">2025</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 