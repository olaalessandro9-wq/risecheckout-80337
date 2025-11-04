-- ============================================================================
-- Tabela: system_health_logs
-- Logs de saúde do sistema com métricas agregadas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC,
  metadata JSONB,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_health_logs_timestamp ON public.system_health_logs(timestamp DESC);
CREATE INDEX idx_system_health_logs_metric_type ON public.system_health_logs(metric_type);
CREATE INDEX idx_system_health_logs_severity ON public.system_health_logs(severity);

-- ============================================================================
-- Tabela: edge_function_errors
-- Erros específicos das edge functions para debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.edge_function_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  error_message TEXT,
  error_stack TEXT,
  request_payload JSONB,
  request_headers JSONB,
  user_id UUID,
  order_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  notes TEXT
);

CREATE INDEX idx_edge_function_errors_timestamp ON public.edge_function_errors(timestamp DESC);
CREATE INDEX idx_edge_function_errors_function_name ON public.edge_function_errors(function_name);
CREATE INDEX idx_edge_function_errors_resolved ON public.edge_function_errors(resolved);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_function_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only on system_health_logs"
ON public.system_health_logs FOR ALL TO service_role
USING (true);

CREATE POLICY "Service role can manage edge_function_errors"
ON public.edge_function_errors FOR ALL TO service_role
USING (true);

-- ============================================================================
-- Função helper para registrar métricas
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_system_metric(
  p_metric_type TEXT,
  p_metric_value NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_severity TEXT DEFAULT 'info'
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.system_health_logs (
    metric_type,
    metric_value,
    metadata,
    severity
  ) VALUES (
    p_metric_type,
    p_metric_value,
    p_metadata,
    p_severity
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- View agregada para dashboard
-- ============================================================================

CREATE OR REPLACE VIEW public.v_system_health_summary AS
SELECT 
  date_trunc('hour', timestamp) AS hour,
  metric_type,
  COUNT(*) AS event_count,
  AVG(metric_value) AS avg_value,
  MAX(metric_value) AS max_value,
  MIN(metric_value) AS min_value,
  COUNT(CASE WHEN severity = 'error' THEN 1 END) AS error_count,
  COUNT(CASE WHEN severity = 'critical' THEN 1 END) AS critical_count
FROM public.system_health_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', timestamp), metric_type
ORDER BY hour DESC;

-- ============================================================================
-- View de erros recentes não resolvidos
-- ============================================================================

CREATE OR REPLACE VIEW public.v_unresolved_errors AS
SELECT 
  e.id,
  e.function_name,
  e.error_message,
  e.timestamp,
  e.user_id,
  e.order_id
FROM public.edge_function_errors e
WHERE e.resolved = FALSE
AND e.timestamp > NOW() - INTERVAL '7 days'
ORDER BY e.timestamp DESC;

COMMENT ON TABLE public.system_health_logs IS 
'System-wide health metrics and events for monitoring dashboard';

COMMENT ON TABLE public.edge_function_errors IS 
'Detailed error logs from edge functions for debugging and alerting';