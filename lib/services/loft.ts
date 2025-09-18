// Loft service for API interactions

export interface LoftSelectionItem {
  id: string;
  name: string;
  address: string;
}

export interface LoftSelectionResponse {
  lofts: LoftSelectionItem[];
  total: number;
}

/**
 * Fetch lofts for selection in task forms
 * @param search Optional search term to filter lofts by name or address
 * @returns Promise with lofts data
 */
export async function fetchLoftsForSelection(search?: string): Promise<LoftSelectionResponse> {
  try {
    const url = new URL('/api/lofts/selection', window.location.origin);
    
    if (search && search.trim()) {
      url.searchParams.set('search', search.trim());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching lofts for selection:', error);
    throw error;
  }
}

/**
 * Get a formatted display name for a loft (name + address)
 * @param loft The loft selection item
 * @returns Formatted display string
 */
export function formatLoftDisplayName(loft: LoftSelectionItem): string {
  return `${loft.name} - ${loft.address}`;
}