import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UTMifyIntegration {
  id: string;
  vendor_id: string;
  config: {
    api_token?: string;
    selected_events?: string[];
    selected_products?: string[];
    [key: string]: any;
  };
  active: boolean;
}

/**
 * Hook para carregar integração UTMify de um vendedor
 * @param vendorId - ID do vendedor (usuário)
 */
export function useUTMifyIntegration(vendorId?: string) {
  return useQuery({
    queryKey: ["utmify-integration", vendorId],
    queryFn: async () => {
      if (!vendorId) {
        return null;
      }

      const { data, error } = await supabase
        .from("vendor_integrations")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("integration_type", "UTMIFY")
        .eq("active", true)
        .single();

      if (error) {
        // Se não encontrar, retorna null (não é um erro crítico)
        if (error.code === "PGRST116") {
          return null;
        }
        console.error("[useUTMifyIntegration] Error loading integration:", error);
        throw error;
      }

      return data as UTMifyIntegration;
    },
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Verifica se um produto específico está habilitado para envio ao UTMify
 * @param integration - Objeto de integração UTMify
 * @param productId - ID do produto a verificar
 */
export function isProductEnabledForUTMify(
  integration: UTMifyIntegration | null | undefined,
  productId: string
): boolean {
  if (!integration || !integration.active) {
    return false;
  }

  const selectedProducts = integration.config?.selected_products || [];
  return selectedProducts.includes(productId);
}
