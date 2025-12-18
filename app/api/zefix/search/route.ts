import { NextRequest, NextResponse } from 'next/server';

const ZEFIX_API_URL = 'https://www.zefix.admin.ch/ZefixPublicREST/api/v1/company/search';

export interface CompanySearchResult {
  name: string;
  uid: string;
  legalSeat: string;
  legalForm: string;
  status: string;
}

/**
 * POST /api/zefix/search
 * Search for Swiss companies by name
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Search query must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Get credentials from environment
    const username = process.env.ZEFIX_USERNAME;
    const password = process.env.ZEFIX_PASSWORD || '';

    if (!username) {
      return NextResponse.json(
        { error: 'Zefix API credentials not configured' },
        { status: 401 }
      );
    }

    const credentials = Buffer.from(`${username}:${password}`).toString('base64');

    // Call Zefix Search API
    const response = await fetch(ZEFIX_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        name: name.trim(),
        activeOnly: true,
      }),
    });

    if (response.status === 401) {
      return NextResponse.json(
        { error: 'Zefix API authentication failed' },
        { status: 401 }
      );
    }

    if (!response.ok) {
      console.error('Zefix search error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to search companies' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform to simplified format
    const results: CompanySearchResult[] = (data || []).map((company: any) => ({
      name: company.name,
      uid: company.uid,
      legalSeat: company.legalSeat || '',
      legalForm: company.legalForm?.shortName?.de || '',
      status: company.status,
    }));

    return NextResponse.json(results);

  } catch (error) {
    console.error('Zefix search error:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching' },
      { status: 500 }
    );
  }
}


