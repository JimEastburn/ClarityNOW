/**
 * Status counts for various metrics
 */
export interface StatusCounts {
  active: number;
  pending: number;
  closed: number;
}

/**
 * Profit information
 */
export interface Profits {
  current_month: number;
  next_month: number;
  total: number;
}

/**
 * Portal API response data structure
 */
export interface PortalData {
  /** Unit counts by status */
  units: StatusCounts;
  
  /** GCI (Gross Commission Income) counts by status */
  gci: StatusCounts;
  
  /** Volume counts by status */
  volume: StatusCounts;
  
  /** Current profit information */
  profits: Profits;
  
  /** Monthly profit data (12 months) */
  monthly_profits: number[];
  
  /** Monthly profit goals (12 months) */
  profit_goals: number[];
  
  /** Ratings array (6 elements) */
  ratings: number[];
}