import { useEffect, useState } from 'react'
import { apiService } from '../services/api'
import './Listings.css'

interface Listing {
  id: number
  status: 'Active' | 'Pending' | 'Sold'
  transactionType: string
  primaryAgent: string
  address: string
  unitGoal: string
  contingentSale: string
  signedListingDate: string
  activeListingDate: string
  targetMlsDate: string
  dateOnMarket: string
  expirationDate: string
  listingPrice: number
  grossCommission: number
  team: string
  grossProfit: number
}

interface ListingsStats {
  activeCount: number
  totalActiveVolume: number
  totalActiveGCI: number
  totalActiveGrossProfit: number
}

const Listings = () => {
  const [listings, setListings] = useState<Listing[]>([])
  const [stats, setStats] = useState<ListingsStats>({
    activeCount: 0,
    totalActiveVolume: 0,
    totalActiveGCI: 0,
    totalActiveGrossProfit: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [listingsResponse, statsResponse] = await Promise.all([
          apiService.getListings(),
          apiService.getListingsStats()
        ])
        
        setListings(listingsResponse.listings)
        setStats({
          activeCount: statsResponse.activeCount,
          totalActiveVolume: statsResponse.totalActiveVolume,
          totalActiveGCI: statsResponse.totalActiveGCI,
          totalActiveGrossProfit: statsResponse.totalActiveGrossProfit
        })
        setError(null)
      } catch (err) {
        console.error('Failed to fetch listings data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDeleteListing = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await apiService.deleteListing(id)
        setListings(listings.filter(listing => listing.id !== id))
        // Refresh stats
        const statsResponse = await apiService.getListingsStats()
        setStats({
          activeCount: statsResponse.activeCount,
          totalActiveVolume: statsResponse.totalActiveVolume,
          totalActiveGCI: statsResponse.totalActiveGCI,
          totalActiveGrossProfit: statsResponse.totalActiveGrossProfit
        })
      } catch (err) {
        console.error('Failed to delete listing:', err)
        alert('Failed to delete listing')
      }
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredListings = listings.filter(listing =>
    listing.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.primaryAgent.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="loading">Loading listings...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="listings">
      {/* Page Header */}
      <div className="listings-header">
        <div className="breadcrumb-nav">
          <span className="breadcrumb-item">🏠</span>
          <span className="breadcrumb-separator">•</span>
          <span className="breadcrumb-item">Listings</span>
          <span className="breadcrumb-separator">•</span>
          <span className="breadcrumb-current">All Listings</span>
        </div>
        <h1 className="page-title">Listings</h1>
      </div>

      {/* Metrics Cards */}
      <div className="listings-metrics">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">TOTAL ACTIVE UNITS</span>
            <div className="metric-icon blue">🏠</div>
          </div>
          <div className="metric-value">{stats.activeCount}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">TOTAL ACTIVE VOLUME</span>
            <div className="metric-icon red">💰</div>
          </div>
          <div className="metric-value">${stats.totalActiveVolume.toLocaleString()}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">TOTAL ACTIVE GCI</span>
            <div className="metric-icon red">💰</div>
          </div>
          <div className="metric-value">${stats.totalActiveGCI.toLocaleString()}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">TOTAL ACTIVE GROSS PROFIT</span>
            <div className="metric-icon red">💰</div>
          </div>
          <div className="metric-value negative">${stats.totalActiveGrossProfit.toLocaleString()}</div>
        </div>
      </div>

      {/* Listings Section */}
      <div className="listings-content">
        <div className="content-header">
          <h2>Listings</h2>
        </div>

        {/* Status Filter */}
        <div className="status-filter">
          <button className="status-btn active">Active</button>
          <div className="filter-divider">Select a View</div>
          <div className="entry-count">{listings.length}</div>
        </div>

        {/* Search and Controls */}
        <div className="table-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          
          <div className="control-buttons">
            <button className="control-btn">Search</button>
            <button className="control-btn">Reset Filters</button>
            <button className="control-btn">Export Listings</button>
            <button className="control-btn new">New</button>
            <button 
              className="control-btn filters"
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍 Filters
            </button>
            <button className="control-btn stats">📊 Stats</button>
          </div>
        </div>

        {/* Listings Table */}
        <div className="listings-table-container">
          <table className="listings-table">
            <thead>
              <tr>
                <th>ACTIONS</th>
                <th>STATUS</th>
                <th>TRANSACTION TYPE</th>
                <th>PRIMARY AGENT</th>
                <th>ADDRESS</th>
                <th>UNIT GOAL</th>
                <th>CONTINGENT SALE</th>
                <th>SIGNED LISTING DATE</th>
                <th>ACTIVE LISTING DATE</th>
                <th>TARGET MLS DATE</th>
                <th>DATE ON MARKET</th>
                <th>EXPIRATION DATE</th>
                <th>LISTING PRICE</th>
                <th>GROSS COMMISSION</th>
                <th>TEAM</th>
                <th>GROSS PROFIT</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ textAlign: 'center', padding: '2rem' }}>
                    {searchTerm ? 'No listings found matching your search.' : 'No listings available.'}
                  </td>
                </tr>
              ) : (
                filteredListings.map(listing => (
                  <tr key={listing.id}>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" title="Edit">✏️</button>
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => handleDeleteListing(listing.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${listing.status.toLowerCase()}`}>
                        {listing.status}
                      </span>
                    </td>
                    <td>{listing.transactionType}</td>
                    <td>
                      <div className="agent-cell">
                        <div className="agent-avatar">{listing.primaryAgent.charAt(0)}</div>
                        <span>{listing.primaryAgent}</span>
                      </div>
                    </td>
                    <td className="address-cell">{listing.address}</td>
                    <td>{listing.unitGoal}</td>
                    <td>{listing.contingentSale}</td>
                    <td>{listing.signedListingDate}</td>
                    <td>{listing.activeListingDate}</td>
                    <td>{listing.targetMlsDate}</td>
                    <td>{listing.dateOnMarket}</td>
                    <td>{listing.expirationDate}</td>
                    <td className="price-cell">${listing.listingPrice.toLocaleString()}</td>
                    <td className="price-cell">${listing.grossCommission.toLocaleString()}</td>
                    <td>
                      <span className="team-badge">{listing.team}</span>
                    </td>
                    <td className={`price-cell ${listing.grossProfit < 0 ? 'negative' : ''}`}>
                      ${listing.grossProfit.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="table-footer">
          <span className="entries-info">
            Showing {filteredListings.length} of {listings.length} entries
          </span>
          <div className="pagination">
            <button className="pagination-btn" disabled>‹</button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn" disabled>›</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Listings 