import { Router, Request, Response } from 'express'
import { db } from '../database/setup'
import type { PortalData } from '../types/portal'

const router = Router()

interface DatabasePortalRow {
  units_active: number;
  units_pending: number;
  units_closed: number;
  gci_active: number;
  gci_pending: number;
  gci_closed: number;
  volume_active: number;
  volume_pending: number;
  volume_closed: number;
  profits_current_month: number;
  profits_next_month: number;
  profits_total: number;
  monthly_profits: string;
  profit_goals: string;
  ratings: string;
  updated_at?: string;
}

// GET /api/portal - Get portal dashboard data
router.get('/', (req: Request, res: Response): void => {
  try {
    const result = db.prepare(`
      SELECT 
        units_active, units_pending, units_closed,
        gci_active, gci_pending, gci_closed,
        volume_active, volume_pending, volume_closed,
        profits_current_month, profits_next_month, profits_total,
        monthly_profits, profit_goals, ratings,
        updated_at
      FROM portal_data 
      ORDER BY id DESC 
      LIMIT 1
    `).get() as DatabasePortalRow | undefined

    if (!result) {
      res.status(404).json({ error: 'Portal data not found' })
      return
    }

    // Transform database result to match PortalData interface
    const portalData: PortalData = {
      units: {
        active: result.units_active,
        pending: result.units_pending,
        closed: result.units_closed
      },
      gci: {
        active: result.gci_active,
        pending: result.gci_pending,
        closed: result.gci_closed
      },
      volume: {
        active: result.volume_active,
        pending: result.volume_pending,
        closed: result.volume_closed
      },
      profits: {
        current_month: result.profits_current_month,
        next_month: result.profits_next_month,
        total: result.profits_total
      },
      monthly_profits: JSON.parse(result.monthly_profits),
      profit_goals: JSON.parse(result.profit_goals),
      ratings: JSON.parse(result.ratings)
    }

    res.json(portalData)
  } catch (error) {
    console.error('Error fetching portal data:', error)
    res.status(500).json({ error: 'Failed to fetch portal data' })
  }
})

// PUT /api/portal - Update portal dashboard data
router.put('/', (req: Request, res: Response): void => {
  try {
    const { units, gci, volume, profits, monthly_profits, profit_goals, ratings }: PortalData = req.body

    // Validate required fields
    if (!units || !gci || !volume || !profits || !monthly_profits || !profit_goals || !ratings) {
      res.status(400).json({ error: 'All portal data fields are required' })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE portal_data SET 
        units_active = ?, units_pending = ?, units_closed = ?,
        gci_active = ?, gci_pending = ?, gci_closed = ?,
        volume_active = ?, volume_pending = ?, volume_closed = ?,
        profits_current_month = ?, profits_next_month = ?, profits_total = ?,
        monthly_profits = ?, profit_goals = ?, ratings = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT MAX(id) FROM portal_data)
    `)

    const result = updateStmt.run(
      units.active, units.pending, units.closed,
      gci.active, gci.pending, gci.closed,
      volume.active, volume.pending, volume.closed,
      profits.current_month, profits.next_month, profits.total,
      JSON.stringify(monthly_profits),
      JSON.stringify(profit_goals),
      JSON.stringify(ratings)
    )

    if (result.changes === 0) {
      res.status(404).json({ error: 'Portal data not found for update' })
      return
    }

    res.json({ message: 'Portal data updated successfully', changes: result.changes })
  } catch (error) {
    console.error('Error updating portal data:', error)
    res.status(500).json({ error: 'Failed to update portal data' })
  }
})

// POST /api/portal/reset - Reset portal data to defaults (useful for testing)
router.post('/reset', (req: Request, res: Response): void => {
  try {
    const resetStmt = db.prepare(`
      UPDATE portal_data SET 
        units_active = 1, units_pending = 2, units_closed = 47,
        gci_active = 900, gci_pending = 1500, gci_closed = 282000,
        volume_active = 600000, volume_pending = 800000, volume_closed = 19740000,
        profits_current_month = 0, profits_next_month = 0, profits_total = 0,
        monthly_profits = ?, profit_goals = ?, ratings = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT MAX(id) FROM portal_data)
    `)

    const result = resetStmt.run(
      JSON.stringify([15000, 18000, 22000, 25000, 28000, 32000, 28000, 24000, 20000, 18000, 15000, 12000]),
      JSON.stringify([18800, 18800, 18800, 28200, 28200, 28200, 28200, 28200, 28200, 18800, 18800, 18800]),
      JSON.stringify([1, 0, 0, 0, 0, 0])
    )

    res.json({ message: 'Portal data reset to defaults', changes: result.changes })
  } catch (error) {
    console.error('Error resetting portal data:', error)
    res.status(500).json({ error: 'Failed to reset portal data' })
  }
})

export default router 