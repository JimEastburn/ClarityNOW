import type { PortalData } from '../../../types/shared/portal'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

interface ListingsResponse {
  listings: Array<{
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
  }>
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface ListingsStatsResponse {
  activeCount: number
  pendingCount: number
  soldCount: number
  totalActiveVolume: number
  totalActiveGCI: number
  totalActiveGrossProfit: number
  totalListings: number
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${url}`, error)
      throw error
    }
  }

  // Portal API endpoints
  async getPortalData(): Promise<PortalData> {
    return this.request<PortalData>('/portal')
  }

  async updatePortalData(data: PortalData): Promise<{ message: string; changes: number }> {
    return this.request('/portal', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async resetPortalData(): Promise<{ message: string; changes: number }> {
    return this.request('/portal/reset', {
      method: 'POST',
    })
  }

  // Listings API endpoints
  async getListings(params?: { status?: string; limit?: number; offset?: number }): Promise<ListingsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const endpoint = `/listings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request<ListingsResponse>(endpoint)
  }

  async getListing(id: number) {
    return this.request(`/listings/${id}`)
  }

  async createListing(listing: any) {
    return this.request('/listings', {
      method: 'POST',
      body: JSON.stringify(listing),
    })
  }

  async updateListing(id: number, listing: any) {
    return this.request(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(listing),
    })
  }

  async deleteListing(id: number) {
    return this.request(`/listings/${id}`, {
      method: 'DELETE',
    })
  }

  async getListingsStats(): Promise<ListingsStatsResponse> {
    return this.request<ListingsStatsResponse>('/listings/stats/summary')
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`)
    return response.json()
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService 