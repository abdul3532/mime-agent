import { supabase } from "@/integrations/supabase/client";

export interface ScrapeResult {
  success: boolean;
  products_found: number;
  categories: string[];
  pages_scanned: number;
  error?: string;
}

export async function scrapeProducts(url: string): Promise<ScrapeResult> {
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
    body: { url },
  });

  if (error) {
    return { success: false, products_found: 0, categories: [], pages_scanned: 0, error: error.message };
  }

  if (data?.error) {
    return { success: false, products_found: 0, categories: [], pages_scanned: 0, error: data.error };
  }

  return data as ScrapeResult;
}
