import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('[Fix Inactive Products] Starting...')

    // Atualizar produtos deletados para inativos
    const { data: updateData, error: updateError } = await supabaseClient
      .from('products')
      .update({ active: false })
      .eq('status', 'deleted')
      .eq('active', true)
      .select('id, name')

    if (updateError) {
      console.error('[Fix Inactive Products] Error updating:', updateError)
      throw updateError
    }

    console.log('[Fix Inactive Products] Updated products:', updateData)

    // Contar produtos corrigidos
    const { count, error: countError } = await supabaseClient
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'deleted')
      .eq('active', false)

    if (countError) {
      console.error('[Fix Inactive Products] Error counting:', countError)
      throw countError
    }

    console.log('[Fix Inactive Products] Total inactive deleted products:', count)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${updateData?.length || 0} produtos foram marcados como inativos`,
        totalInactiveDeleted: count,
        updatedProducts: updateData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[Fix Inactive Products] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
