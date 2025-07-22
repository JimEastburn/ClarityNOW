import { NavLink } from 'react-router-dom'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="app-layout">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🎯</span>
            <span className="logo-text">ClarityNOW</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboards</span>
          </NavLink>
          
          <NavLink 
            to="/reports" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Reports</span>
          </NavLink>
          
          <NavLink 
            to="/business-planning" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">Business Planning</span>
          </NavLink>
          
          <NavLink 
            to="/goal-gap" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-text">Goal/Gap</span>
          </NavLink>
          
          <NavLink 
            to="/daily-tracking" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-text">Daily Tracking</span>
          </NavLink>
          
          <NavLink 
            to="/sales-pipeline" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">🔄</span>
            <span className="nav-text">Sales Pipeline</span>
          </NavLink>
          
          <NavLink 
            to="/listings" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Listings</span>
          </NavLink>
          
          <NavLink 
            to="/transactions" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">💼</span>
            <span className="nav-text">Transactions</span>
          </NavLink>
          
          <NavLink 
            to="/financials" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">💰</span>
            <span className="nav-text">Financials</span>
          </NavLink>
          
          <NavLink 
            to="/refer-friend" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Refer a Friend</span>
          </NavLink>
          
          <NavLink 
            to="/observatory" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">🔭</span>
            <span className="nav-text">Observatory</span>
          </NavLink>
          
          <NavLink 
            to="/team" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">👨‍💼</span>
            <span className="nav-text">Team</span>
          </NavLink>
          
          <NavLink 
            to="/need-help" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">❓</span>
            <span className="nav-text">Need Help</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-content">
            <div className="breadcrumb">
              <span>🏠</span>
            </div>
            <div className="header-actions">
              <button className="header-btn">🔔</button>
              <button className="header-btn">⚙️</button>
              <button className="header-btn">❓</button>
              <div className="user-profile">
                <span className="user-initials">JE</span>
                <span className="user-name">Jim Eastburn</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout 