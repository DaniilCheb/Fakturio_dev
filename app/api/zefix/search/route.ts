import { NextRequest, NextResponse } from 'next/server';
import { zefixRateLimiter } from '@/lib/utils/rateLimit';
import { zefixSearchSchema } from '@/lib/validations/zefix';

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
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'anonymous';
    const rateLimitResult = zefixRateLimiter.limit(ip);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const body = await request.json();
    
    // Validate input with Zod
    const validationResult = zefixSearchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { name } = validationResult.data;

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

        const apiResponse = NextResponse.json(results);
        apiResponse.headers.set('X-RateLimit-Limit', '10');
        apiResponse.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        apiResponse.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString());
        return apiResponse;

  } catch (error) {
    console.error('Zefix search error:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching' },
      { status: 500 }
    );
  }
}


