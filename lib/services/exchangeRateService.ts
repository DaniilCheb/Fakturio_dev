/**
 * Exchange Rate Service
 * Fetches and caches exchange rates from Frankfurter API
 * Uses ECB data, free and open-source
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const FRANKFURTER_API_BASE = "https://api.frankfurter.app";

export interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  date: string;
}

/**
 * Fetch exchange rate from Frankfurter API
 * @param from Base currency code (e.g., 'CHF')
 * @param to Target currency code (e.g., 'EUR')
 * @param date Optional date (YYYY-MM-DD), defaults to today
 */
export async function fetchExchangeRate(
  from: string,
  to: string,
  date?: string
): Promise<number> {
  // If same currency, return 1
  if (from === to) {
    return 1;
  }

  const dateParam = date || new Date().toISOString().split("T")[0];
  const url = `${FRANKFURTER_API_BASE}/${dateParam}?from=${from}&to=${to}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      // If API fails, throw error
      throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Frankfurter API returns rates in the format: { rates: { EUR: 0.92 } }
    if (data.rates && data.rates[to]) {
      const rate = parseFloat(data.rates[to]);
      return rate;
    }

    throw new Error(`Exchange rate not found for ${from} to ${to}`);
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    throw error;
  }
}

/**
 * Get cached exchange rate from database
 * @param supabase Supabase client
 * @param from Base currency code
 * @param to Target currency code
 * @param date Date (YYYY-MM-DD), defaults to today
 */
export async function getCachedRate(
  supabase: SupabaseClient,
  from: string,
  to: string,
  date?: string
): Promise<number | null> {
  if (from === to) {
    return 1;
  }

  const dateParam = date || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("base_currency", from)
    .eq("target_currency", to)
    .eq("date", dateParam)
    .maybeSingle();

  if (error) {
    console.error("Error fetching cached rate:", error);
    return null;
  }

  return data?.rate ? parseFloat(String(data.rate)) : null;
}

/**
 * Cache exchange rate in database
 * @param supabase Supabase client
 * @param from Base currency code
 * @param to Target currency code
 * @param rate Exchange rate
 * @param date Date (YYYY-MM-DD), defaults to today
 */
export async function cacheExchangeRate(
  supabase: SupabaseClient,
  from: string,
  to: string,
  rate: number,
  date?: string
): Promise<void> {
  if (from === to) {
    return; // No need to cache 1:1 rates
  }

  const dateParam = date || new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("exchange_rates")
    .upsert(
      {
        base_currency: from,
        target_currency: to,
        rate: rate,
        date: dateParam,
      },
      {
        onConflict: "base_currency,target_currency,date",
      }
    );

  if (error) {
    console.error("Error caching exchange rate:", error);
    // Don't throw - caching failure shouldn't break the flow
  }
}

/**
 * Get exchange rate with caching
 * First checks database cache, then fetches from API if needed
 * @param supabase Supabase client
 * @param from Base currency code
 * @param to Target currency code
 * @param date Optional date (YYYY-MM-DD), defaults to today
 */
export async function getExchangeRate(
  supabase: SupabaseClient,
  from: string,
  to: string,
  date?: string
): Promise<number> {
  // Check cache first
  const cachedRate = await getCachedRate(supabase, from, to, date);
  if (cachedRate !== null) {
    return cachedRate;
  }

  // Fetch from API
  try {
    const rate = await fetchExchangeRate(from, to, date);
    
    // Cache the rate for future use
    await cacheExchangeRate(supabase, from, to, rate, date);
    
    return rate;
  } catch (error) {
    // If API fails, try to get the most recent cached rate (fallback)
    const dateParam = date || new Date().toISOString().split("T")[0];
    
    const { data } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("base_currency", from)
      .eq("target_currency", to)
      .lte("date", dateParam)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.rate) {
      console.warn(`Using cached rate from ${dateParam} (API unavailable)`);
      return parseFloat(String(data.rate));
    }

    // If no cache available, throw the original error
    throw new Error(
      `Failed to get exchange rate for ${from} to ${to}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Convert amount from one currency to another
 * @param amount Amount to convert
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @param rate Optional exchange rate (if not provided, will be fetched)
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate?: number
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const exchangeRate = rate || 1;
  const converted = amount * exchangeRate;
  return converted;
}

