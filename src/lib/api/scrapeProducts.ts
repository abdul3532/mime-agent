import { supabase } from "@/integrations/supabase/client";

export interface ScrapeResult {
  success: boolean;
  products_found: number;
  categories: string[];
  pages_scanned: number;
  runId?: string;
  error?: string;
}

export interface ScrapeProgress {
  status: string;
  total_urls: number;
  scraped_pages: number;
  extracted_products: number;
  error_message: string | null;
}

export async function scrapeProducts(url: string, runId: string): Promise<ScrapeResult> {
  // Ensure we have a valid session before the long-running scrape
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
  
  if (refreshError || !refreshData.session) {
    return {
      success: false,
      products_found: 0,
      categories: [],
      pages_scanned: 0,
      error: "Session expired. Please sign in again.",
    };
  }

  // Fire-and-forget: the function runs in the background and updates scrape_progress.
  // We use AbortController to avoid the client timing out on long scrapes.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 min max

  try {
    const { data, error } = await supabase.functions.invoke("scrape-products", {
      body: { url, runId },
    });

    clearTimeout(timeout);

    if (error) {
      // If aborted due to timeout, the function is still running in the background
      if (error.message?.includes("AbortError") || error.message?.includes("aborted")) {
        return { success: true, products_found: 0, categories: [], pages_scanned: 0, runId };
      }
      return { success: false, products_found: 0, categories: [], pages_scanned: 0, error: error.message };
    }

    if (data?.error) {
      return { success: false, products_found: 0, categories: [], pages_scanned: 0, error: data.error };
    }

    return data as ScrapeResult;
  } catch (e: any) {
    clearTimeout(timeout);
    // Network timeout / abort — function is still running server-side
    if (e?.name === "AbortError" || e?.message?.includes("aborted") || e?.message?.includes("Failed to fetch")) {
      // Return success so the UI keeps polling progress
      return { success: true, products_found: 0, categories: [], pages_scanned: 0, runId };
    }
    return { success: false, products_found: 0, categories: [], pages_scanned: 0, error: e?.message || "Unknown error" };
  }
}

export async function pollScrapeProgress(runId: string): Promise<ScrapeProgress | null> {
  const { data, error } = await supabase
    .from("scrape_progress")
    .select("status, total_urls, scraped_pages, extracted_products, error_message")
    .eq("run_id", runId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ScrapeProgress;
}
