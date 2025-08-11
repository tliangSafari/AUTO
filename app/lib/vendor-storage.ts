// Vendor storage utilities for local persistence and management

export interface VendorData {
  id: string
  name: string
  lastUsed?: string
  verified?: boolean
  searchable?: boolean
}

const VENDORS_STORAGE_KEY = 'jonas_vendors'
const DEFAULT_VENDORS_KEY = 'jonas_default_vendors'

// Default vendor list that can be customized by user
const INITIAL_DEFAULT_VENDORS = [
  "Also Energy",
  "SDB LLC",
  "Fantasy Landscaping LLC",
  "United Agrivoltaics North America",
  "JUUCE Energy"
]

/**
 * Get all stored vendors from localStorage
 */
export function getStoredVendors(): VendorData[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(VENDORS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading vendors from storage:', error)
    return []
  }
}

/**
 * Save vendors to localStorage
 */
export function saveVendors(vendors: VendorData[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(vendors))
  } catch (error) {
    console.error('Error saving vendors to storage:', error)
  }
}

/**
 * Add a new vendor
 */
export function addVendor(name: string): VendorData {
  const vendors = getStoredVendors()
  const newVendor: VendorData = {
    id: generateId(),
    name: name.trim(),
    lastUsed: new Date().toISOString()
  }
  
  // Check if vendor already exists
  const existingVendor = vendors.find(v => v.name.toLowerCase() === name.toLowerCase())
  if (existingVendor) {
    existingVendor.lastUsed = new Date().toISOString()
    saveVendors(vendors)
    return existingVendor
  }
  
  vendors.push(newVendor)
  saveVendors(vendors)
  return newVendor
}

/**
 * Update an existing vendor
 */
export function updateVendor(id: string, updates: Partial<VendorData>): VendorData | null {
  const vendors = getStoredVendors()
  const vendorIndex = vendors.findIndex(v => v.id === id)
  
  if (vendorIndex === -1) return null
  
  vendors[vendorIndex] = { ...vendors[vendorIndex], ...updates }
  saveVendors(vendors)
  return vendors[vendorIndex]
}

/**
 * Remove a vendor
 */
export function removeVendor(id: string): boolean {
  const vendors = getStoredVendors()
  const filteredVendors = vendors.filter(v => v.id !== id)
  
  if (filteredVendors.length === vendors.length) return false
  
  saveVendors(filteredVendors)
  return true
}

/**
 * Get default vendors list (editable)
 */
export function getDefaultVendors(): string[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_VENDORS
  
  try {
    const stored = localStorage.getItem(DEFAULT_VENDORS_KEY)
    return stored ? JSON.parse(stored) : INITIAL_DEFAULT_VENDORS
  } catch (error) {
    console.error('Error loading default vendors:', error)
    return INITIAL_DEFAULT_VENDORS
  }
}

/**
 * Save default vendors list
 */
export function saveDefaultVendors(vendors: string[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(DEFAULT_VENDORS_KEY, JSON.stringify(vendors))
  } catch (error) {
    console.error('Error saving default vendors:', error)
  }
}

/**
 * Import vendors from array of strings
 */
export function importVendors(vendorNames: string[]): VendorData[] {
  const existingVendors = getStoredVendors()
  const newVendors: VendorData[] = []
  
  vendorNames.forEach(name => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    
    // Check if vendor already exists
    const existing = existingVendors.find(v => v.name.toLowerCase() === trimmedName.toLowerCase())
    if (existing) {
      existing.lastUsed = new Date().toISOString()
      return
    }
    
    const newVendor: VendorData = {
      id: generateId(),
      name: trimmedName,
      lastUsed: new Date().toISOString()
    }
    newVendors.push(newVendor)
    existingVendors.push(newVendor)
  })
  
  saveVendors(existingVendors)
  return newVendors
}

/**
 * Export vendors to array format
 */
export function exportVendors(): string[] {
  return getStoredVendors().map(v => v.name)
}

/**
 * Search vendors by name
 */
export function searchVendors(query: string): VendorData[] {
  const vendors = getStoredVendors()
  const lowerQuery = query.toLowerCase()
  
  return vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(lowerQuery)
  ).sort((a, b) => {
    // Sort by exact match first, then by last used
    const aExact = a.name.toLowerCase().startsWith(lowerQuery)
    const bExact = b.name.toLowerCase().startsWith(lowerQuery)
    
    if (aExact && !bExact) return -1
    if (!aExact && bExact) return 1
    
    // Then by last used (most recent first)
    const aDate = new Date(a.lastUsed || 0).getTime()
    const bDate = new Date(b.lastUsed || 0).getTime()
    return bDate - aDate
  })
}

/**
 * Mark vendors as used
 */
export function markVendorsAsUsed(vendorNames: string[]): void {
  const vendors = getStoredVendors()
  const now = new Date().toISOString()
  let updated = false
  
  vendorNames.forEach(name => {
    const vendor = vendors.find(v => v.name === name)
    if (vendor) {
      vendor.lastUsed = now
      updated = true
    }
  })
  
  if (updated) {
    saveVendors(vendors)
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Clear all vendor data (for testing/reset)
 */
export function clearVendorStorage(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(VENDORS_STORAGE_KEY)
  localStorage.removeItem(DEFAULT_VENDORS_KEY)
}