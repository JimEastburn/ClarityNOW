import Database, { type Database as DatabaseType } from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dbDir, 'claritynow.db')

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Create database connection
export const db: DatabaseType = new Database(dbPath, { 
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined 
})

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export const setupDatabase = async (): Promise<void> => {
  try {
    // Create portal_data table for dashboard metrics
    db.exec(`
      CREATE TABLE IF NOT EXISTS portal_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        units_active INTEGER NOT NULL DEFAULT 0,
        units_pending INTEGER NOT NULL DEFAULT 0,
        units_closed INTEGER NOT NULL DEFAULT 0,
        gci_active INTEGER NOT NULL DEFAULT 0,
        gci_pending INTEGER NOT NULL DEFAULT 0,
        gci_closed INTEGER NOT NULL DEFAULT 0,
        volume_active INTEGER NOT NULL DEFAULT 0,
        volume_pending INTEGER NOT NULL DEFAULT 0,
        volume_closed INTEGER NOT NULL DEFAULT 0,
        profits_current_month INTEGER NOT NULL DEFAULT 0,
        profits_next_month INTEGER NOT NULL DEFAULT 0,
        profits_total INTEGER NOT NULL DEFAULT 0,
        monthly_profits TEXT NOT NULL DEFAULT '[]',
        profit_goals TEXT NOT NULL DEFAULT '[]',
        ratings TEXT NOT NULL DEFAULT '[]',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create listings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT NOT NULL CHECK(status IN ('Active', 'Pending', 'Sold')) DEFAULT 'Active',
        transaction_type TEXT NOT NULL DEFAULT 'Resale',
        primary_agent TEXT NOT NULL,
        address TEXT NOT NULL,
        unit_goal TEXT NOT NULL DEFAULT 'No',
        contingent_sale TEXT NOT NULL DEFAULT 'No',
        signed_listing_date TEXT NOT NULL,
        active_listing_date TEXT NOT NULL,
        target_mls_date TEXT NOT NULL,
        date_on_market TEXT NOT NULL,
        expiration_date TEXT NOT NULL,
        listing_price INTEGER NOT NULL DEFAULT 0,
        gross_commission INTEGER NOT NULL DEFAULT 0,
        team TEXT NOT NULL DEFAULT '',
        gross_profit INTEGER NOT NULL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Insert default portal data if none exists
    const portalCount = db.prepare('SELECT COUNT(*) as count FROM portal_data').get() as { count: number }
    
    if (portalCount.count === 0) {
      const insertPortalData = db.prepare(`
        INSERT INTO portal_data (
          units_active, units_pending, units_closed,
          gci_active, gci_pending, gci_closed,
          volume_active, volume_pending, volume_closed,
          profits_current_month, profits_next_month, profits_total,
          monthly_profits, profit_goals, ratings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      insertPortalData.run(
        1, 2, 47,                    // units
        900, 1500, 282000,           // gci
        600000, 800000, 19740000,    // volume
        0, 0, 0,                     // profits
        JSON.stringify([15000, 18000, 22000, 25000, 28000, 32000, 28000, 24000, 20000, 18000, 15000, 12000]), // monthly_profits
        JSON.stringify([18800, 18800, 18800, 28200, 28200, 28200, 28200, 28200, 28200, 18800, 18800, 18800]), // profit_goals
        JSON.stringify([1, 0, 0, 0, 0, 0]) // ratings
      )
    }

    // Insert default listing if none exists
    const listingCount = db.prepare('SELECT COUNT(*) as count FROM listings').get() as { count: number }
    
    if (listingCount.count === 0) {
      const insertListing = db.prepare(`
        INSERT INTO listings (
          status, transaction_type, primary_agent, address,
          unit_goal, contingent_sale, signed_listing_date, active_listing_date,
          target_mls_date, date_on_market, expiration_date,
          listing_price, gross_commission, team, gross_profit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      insertListing.run(
        'Active', 'Resale', 'Bob', '06308 ONONDGA Dr Austin, TX 78757',
        'No', 'No', '07/15/2025', '07/16/2025',
        '10/15/2025', '10/15/2025', '10/15/2025',
        600000, 9000, 'CDS DESIGN', -2100
      )
    }

    console.log('Database setup completed')
  } catch (error) {
    console.error('Database setup failed:', error)
    throw error
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...')
  db.close()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Closing database connection...')
  db.close()
  process.exit(0)
}) 