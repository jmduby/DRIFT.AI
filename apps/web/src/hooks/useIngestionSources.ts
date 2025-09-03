'use client';

import { useState, useEffect } from 'react';

export interface IngestionSource {
  id: string;
  name: string;
  type: 'bill.com' | 'quickbooks' | 'xero' | 'email';
  status: 'active' | 'inactive' | 'error';
  lastSync?: string;
}

export interface IngestionSourcesData {
  connected: boolean;
  sources: string[];
  details: IngestionSource[];
}

/**
 * Mock hook for ingestion sources data
 * Returns mock data by default, can be overridden via environment variable
 */
export function useIngestionSources(): IngestionSourcesData {
  const [data, setData] = useState<IngestionSourcesData>({
    connected: false,
    sources: [],
    details: []
  });

  useEffect(() => {
    // Check for environment override
    if (typeof window !== 'undefined') {
      const override = localStorage.getItem('drift_mock_ingestion_sources');
      if (override) {
        try {
          setData(JSON.parse(override));
          return;
        } catch {
          // Fall through to default
        }
      }
    }

    // Default mock data - no sources connected
    const mockData: IngestionSourcesData = {
      connected: false,
      sources: [],
      details: []
    };

    // Uncomment below to test with connected sources
    /*
    const mockData: IngestionSourcesData = {
      connected: true,
      sources: ['Bill.com', 'QuickBooks Online'],
      details: [
        {
          id: '1',
          name: 'Bill.com',
          type: 'bill.com',
          status: 'active',
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        {
          id: '2', 
          name: 'QuickBooks Online',
          type: 'quickbooks',
          status: 'active',
          lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
        }
      ]
    };
    */

    setData(mockData);
  }, []);

  return data;
}

/**
 * Mock function to simulate connecting a new source
 */
export function connectIngestionSource(sourceType: string): Promise<void> {
  return new Promise((resolve) => {
    console.log(`Mock: Connecting to ${sourceType}...`);
    setTimeout(() => {
      console.log(`Mock: Connected to ${sourceType} successfully`);
      resolve();
    }, 2000);
  });
}

/**
 * Mock function to simulate managing sources
 */
export function manageIngestionSources(): void {
  console.log('Mock: Opening ingestion sources management...');
  // In a real app, this would navigate to a sources management page
  alert('This would open the ingestion sources management page.');
}