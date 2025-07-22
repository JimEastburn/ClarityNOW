import { Router, Request, Response } from 'express'
import { db } from '../database/setup'

const router = Router()

interface Listing {
  id?: number
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

// GET /api/listings - Get all listings
router.get('/', (req: Request, res: Response): void => {
  try {
    const { status, limit = '50', offset = '0' } = req.query

    let query = `
      SELECT 
        id, status, transaction_type as transactionType, primary_agent as primaryAgent,
        address, unit_goal as unitGoal, contingent_sale as contingentSale,
        signed_listing_date as signedListingDate, active_listing_date as activeListingDate,
        target_mls_date as targetMlsDate, date_on_market as dateOnMarket,
        expiration_date as expirationDate, listing_price as listingPrice,
        gross_commission as grossCommission, team, gross_profit as grossProfit,
        created_at, updated_at
      FROM listings
    `

    const params: any[] = []

    if (status && typeof status === 'string') {
      query += ' WHERE status = ?'
      params.push(status)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit as string), parseInt(offset as string))

    const listings = db.prepare(query).all(...params)

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM listings'
    let countParams: any[] = []

    if (status && typeof status === 'string') {
      countQuery += ' WHERE status = ?'
      countParams.push(status)
    }

    const totalResult = db.prepare(countQuery).get(...countParams) as { total: number }

    res.json({
      listings,
      pagination: {
        total: totalResult.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < totalResult.total
      }
    })
  } catch (error) {
    console.error('Error fetching listings:', error)
    res.status(500).json({ error: 'Failed to fetch listings' })
  }
})

// GET /api/listings/stats/summary - Get listings summary statistics (must come before /:id)
router.get('/stats/summary', (req: Request, res: Response): void => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as activeCount,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pendingCount,
        COUNT(CASE WHEN status = 'Sold' THEN 1 END) as soldCount,
        COALESCE(SUM(CASE WHEN status = 'Active' THEN listing_price END), 0) as totalActiveVolume,
        COALESCE(SUM(CASE WHEN status = 'Active' THEN gross_commission END), 0) as totalActiveGCI,
        COALESCE(SUM(CASE WHEN status = 'Active' THEN gross_profit END), 0) as totalActiveGrossProfit,
        COUNT(*) as totalListings
      FROM listings
    `).get()

    res.json(stats)
  } catch (error) {
    console.error('Error fetching listings stats:', error)
    res.status(500).json({ error: 'Failed to fetch listings stats' })
  }
})

// GET /api/listings/:id - Get specific listing
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const listing = db.prepare(`
      SELECT 
        id, status, transaction_type as transactionType, primary_agent as primaryAgent,
        address, unit_goal as unitGoal, contingent_sale as contingentSale,
        signed_listing_date as signedListingDate, active_listing_date as activeListingDate,
        target_mls_date as targetMlsDate, date_on_market as dateOnMarket,
        expiration_date as expirationDate, listing_price as listingPrice,
        gross_commission as grossCommission, team, gross_profit as grossProfit,
        created_at, updated_at
      FROM listings WHERE id = ?
    `).get(id)

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' })
      return
    }

    res.json(listing)
  } catch (error) {
    console.error('Error fetching listing:', error)
    res.status(500).json({ error: 'Failed to fetch listing' })
  }
})

// POST /api/listings - Create new listing
router.post('/', (req: Request, res: Response): void => {
  try {
    const listing: Omit<Listing, 'id'> = req.body

    // Validate required fields
    const requiredFields = [
      'status', 'transactionType', 'primaryAgent', 'address',
      'signedListingDate', 'activeListingDate', 'targetMlsDate',
      'dateOnMarket', 'expirationDate', 'listingPrice', 'grossCommission'
    ]

    for (const field of requiredFields) {
      if (!listing[field as keyof typeof listing]) {
        res.status(400).json({ error: `Field '${field}' is required` })
        return
      }
    }

    const insertStmt = db.prepare(`
      INSERT INTO listings (
        status, transaction_type, primary_agent, address,
        unit_goal, contingent_sale, signed_listing_date, active_listing_date,
        target_mls_date, date_on_market, expiration_date,
        listing_price, gross_commission, team, gross_profit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = insertStmt.run(
      listing.status,
      listing.transactionType,
      listing.primaryAgent,
      listing.address,
      listing.unitGoal || 'No',
      listing.contingentSale || 'No',
      listing.signedListingDate,
      listing.activeListingDate,
      listing.targetMlsDate,
      listing.dateOnMarket,
      listing.expirationDate,
      listing.listingPrice,
      listing.grossCommission,
      listing.team || '',
      listing.grossProfit || 0
    )

    const newListing = db.prepare(`
      SELECT 
        id, status, transaction_type as transactionType, primary_agent as primaryAgent,
        address, unit_goal as unitGoal, contingent_sale as contingentSale,
        signed_listing_date as signedListingDate, active_listing_date as activeListingDate,
        target_mls_date as targetMlsDate, date_on_market as dateOnMarket,
        expiration_date as expirationDate, listing_price as listingPrice,
        gross_commission as grossCommission, team, gross_profit as grossProfit,
        created_at, updated_at
      FROM listings WHERE id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json(newListing)
  } catch (error) {
    console.error('Error creating listing:', error)
    res.status(500).json({ error: 'Failed to create listing' })
  }
})

// PUT /api/listings/:id - Update listing
router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const listing: Partial<Listing> = req.body

    // Check if listing exists
    const existingListing = db.prepare('SELECT id FROM listings WHERE id = ?').get(id)
    if (!existingListing) {
      res.status(404).json({ error: 'Listing not found' })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE listings SET 
        status = COALESCE(?, status),
        transaction_type = COALESCE(?, transaction_type),
        primary_agent = COALESCE(?, primary_agent),
        address = COALESCE(?, address),
        unit_goal = COALESCE(?, unit_goal),
        contingent_sale = COALESCE(?, contingent_sale),
        signed_listing_date = COALESCE(?, signed_listing_date),
        active_listing_date = COALESCE(?, active_listing_date),
        target_mls_date = COALESCE(?, target_mls_date),
        date_on_market = COALESCE(?, date_on_market),
        expiration_date = COALESCE(?, expiration_date),
        listing_price = COALESCE(?, listing_price),
        gross_commission = COALESCE(?, gross_commission),
        team = COALESCE(?, team),
        gross_profit = COALESCE(?, gross_profit),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)

    const result = updateStmt.run(
      listing.status,
      listing.transactionType,
      listing.primaryAgent,
      listing.address,
      listing.unitGoal,
      listing.contingentSale,
      listing.signedListingDate,
      listing.activeListingDate,
      listing.targetMlsDate,
      listing.dateOnMarket,
      listing.expirationDate,
      listing.listingPrice,
      listing.grossCommission,
      listing.team,
      listing.grossProfit,
      id
    )

    if (result.changes === 0) {
      res.status(404).json({ error: 'Listing not found' })
      return
    }

    const updatedListing = db.prepare(`
      SELECT 
        id, status, transaction_type as transactionType, primary_agent as primaryAgent,
        address, unit_goal as unitGoal, contingent_sale as contingentSale,
        signed_listing_date as signedListingDate, active_listing_date as activeListingDate,
        target_mls_date as targetMlsDate, date_on_market as dateOnMarket,
        expiration_date as expirationDate, listing_price as listingPrice,
        gross_commission as grossCommission, team, gross_profit as grossProfit,
        created_at, updated_at
      FROM listings WHERE id = ?
    `).get(id)

    res.json(updatedListing)
  } catch (error) {
    console.error('Error updating listing:', error)
    res.status(500).json({ error: 'Failed to update listing' })
  }
})

// DELETE /api/listings/:id - Delete listing
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const deleteStmt = db.prepare('DELETE FROM listings WHERE id = ?')
    const result = deleteStmt.run(id)

    if (result.changes === 0) {
      res.status(404).json({ error: 'Listing not found' })
      return
    }

    res.json({ message: 'Listing deleted successfully', id: parseInt(id) })
  } catch (error) {
    console.error('Error deleting listing:', error)
    res.status(500).json({ error: 'Failed to delete listing' })
  }
})

export default router 