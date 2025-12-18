import { NextRequest, NextResponse } from 'next/server';
import { normalizeUid, isValidUid, transformZefixResponse, type ZefixCompany } from '@/lib/services/zefixService';

const ZEFIX_API_URL = 'https://www.zefix.admin.ch/ZefixPublicREST/api/v1/company/uid';

/**
 * GET /api/zefix/[uid]
 * Proxy endpoint for Zefix API to lookup Swiss companies by UID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    
    // Validate UID format
    if (!uid || !isValidUid(uid)) {
      return NextResponse.json(
        { error: 'Invalid UID format. Expected format: CHE-123.456.789 or CHE123456789' },
        { status: 400 }
      );
    }

    const normalizedUid = normalizeUid(uid);
    
    // Get credentials from environment
    const username = process.env.ZEFIX_USERNAME;
    const password = process.env.ZEFIX_PASSWORD || '';
    
    // Build request headers
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    // Add Basic Auth if credentials are configured
    if (username) {
      const credentials = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    // Call Zefix API
    const response = await fetch(`${ZEFIX_API_URL}/${normalizedUid}`, {
      method: 'GET',
      headers,
    });

    if (response.status === 401) {
      return NextResponse.json(
        { error: 'Zefix API authentication failed. Please configure valid credentials.' },
        { status: 401 }
      );
    }

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'Company not found with the provided UID.' },
        { status: 404 }
      );
    }

    if (!response.ok) {
      console.error('Zefix API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch company data from Zefix.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // API returns an array for UID lookups
    const companies: ZefixCompany[] = Array.isArray(data) ? data : [data];
    
    if (companies.length === 0) {
      return NextResponse.json(
        { error: 'Company not found.' },
        { status: 404 }
      );
    }

    // Transform to simplified format
    const companyInfo = transformZefixResponse(companies[0]);
    
    return NextResponse.json(companyInfo);
    
  } catch (error) {
    console.error('Zefix lookup error:', error);
    return NextResponse.json(
      { error: 'An error occurred while looking up the company.' },
      { status: 500 }
    );
  }
}


