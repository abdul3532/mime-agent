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

export async function scrapeProducts(url: string, runId: string, storefrontId: string): Promise<ScrapeResult> {
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

  const { data, error } = await supabase.functions.invoke("scrape-products", {
    body: { url, runId, storefrontId },
  });

  if (error) {
    return { success: false, products_found: 0, categories: [], pages_scanned: 0, error: error.message };
  }

  if (data?.error) {
    return { success: false, products_found: 0, categories: [], pages_scanned: 0, error: data.error };
  }

  return data as ScrapeResult;
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
