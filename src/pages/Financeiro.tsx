import { useEffect, useState } from "react";
import { Loader2, Check, AlertCircle, Copy } from "lucide-react";
import {
  savePushinPaySettings,
  getPushinPaySettings,
  testPushinPayConnection,
  type PushinPayEnvironment,
} from "@/services/pushinpay";

export default function Financeiro() {
  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [environment, setEnvironment] = useState<PushinPayEnvironment>("sandbox");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    ok: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const settings = await getPushinPaySettings();
        if (settings) {
          if (settings.pushinpay_token === "••••••••") {
            setHasExistingToken(true);
            setApiToken("");
          } else {
            setApiToken(settings.pushinpay_token ?? "");
          }
          setEnvironment(settings.environment ?? "sandbox");
          setLastUpdated(new Date().toISOString());
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  async function handleTestConnection() {
    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      const result = await testPushinPayConnection();
      setConnectionStatus({
        tested: true,
        ok: result.ok,
        message: result.message,
        details: result.details
      });
    } catch (error: any) {
      setConnectionStatus({
        tested: true,
        ok: false,
        message: `Erro ao testar: ${error.message}`
      });
    } finally {
      setTestingConnection(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: `${label} copiado!` });
    setTimeout(() => setMessage(null), 2000);
  }

  async function onSave() {
    // Se já existe token e o campo está vazio, não exigir novo token
    if (!hasExistingToken && !apiToken.trim()) {
      setMessage({ type: "error", text: "Por favor, informe o API Token" });
      return;
    }

    // Se tem token existente e campo vazio, mantém o token existente
    if (hasExistingToken && !apiToken.trim()) {
      setMessage({ type: "error", text: "Para atualizar, informe um novo token ou mantenha o atual" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await savePushinPaySettings({
        pushinpay_token: apiToken,
        environment,
      });

      if (result.ok) {
        setMessage({ type: "success", text: "Integração PushinPay salva com sucesso!" });
        setHasExistingToken(true);
        setApiToken("");
        setLastUpdated(new Date().toISOString());
        setConnectionStatus(null);
      } else {
        setMessage({ type: "error", text: `Erro ao salvar: ${result.error}` });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `Erro: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure suas integrações de pagamento e split de receita
        </p>
      </div>

      {/* Integração PushinPay */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Integração PIX - PushinPay</h2>
        </div>

        <p className="text-sm text-muted-foreground">
          Conecte sua conta PushinPay informando o <strong>API Token</strong>.
          Você pode solicitar acesso ao <em>Sandbox</em> direto no suporte deles.
        </p>

        {/* Status da Integração */}
        {hasExistingToken && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${
                  connectionStatus?.ok ? 'bg-green-500' : 
                  connectionStatus?.tested && !connectionStatus.ok ? 'bg-red-500' : 
                  'bg-yellow-500'
                }`} />
                <span className="text-sm font-medium">
                  {connectionStatus?.ok ? 'Conectado' : 
                   connectionStatus?.tested ? 'Erro de conexão' : 
                   'Status desconhecido'}
                </span>
              </div>
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar conexão'
                )}
              </button>
            </div>

            {connectionStatus && (
              <div className={`text-xs p-2 rounded ${
                connectionStatus.ok 
                  ? 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100'
                  : 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100'
              }`}>
                {connectionStatus.message}
                {connectionStatus.details && (
                  <div className="mt-1 text-[10px] opacity-80">
                    Account ID: {connectionStatus.details.accountId}
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <div>Ambiente: <strong>{environment === 'sandbox' ? 'Sandbox' : 'Produção'}</strong></div>
              {lastUpdated && (
                <div>Última atualização: {new Date(lastUpdated).toLocaleString('pt-BR')}</div>
              )}
            </div>
          </div>
        )}

        {/* Alertas Contextuais */}
        {environment === 'production' && (
          <div className="rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-3 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-yellow-900 dark:text-yellow-100">Modo Produção Ativo</strong>
                <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                  Você está utilizando credenciais de produção. Pagamentos reais serão processados.
                  Certifique-se de que o webhook está configurado corretamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {environment === 'sandbox' && (
          <div className="rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-3 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-blue-900 dark:text-blue-100">Modo Sandbox (Testes)</strong>
                <p className="text-blue-800 dark:text-blue-200 mt-1">
                  Você está em ambiente de testes. Use o painel da PushinPay para simular pagamentos.
                  Nenhum dinheiro real será movimentado.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">API Token</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={hasExistingToken ? "Token configurado (deixe vazio para manter)" : "Bearer token da PushinPay"}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                {showToken ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {hasExistingToken && (
              <p className="text-xs text-muted-foreground mt-1">
                Token já configurado. Deixe em branco para manter o atual ou informe um novo para atualizar.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ambiente</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as PushinPayEnvironment)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="sandbox">Sandbox (testes)</option>
              <option value="production">Produção</option>
            </select>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100"
                  : "bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100"
              }`}
            >
              {message.type === "success" ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <button
            disabled={loading || !apiToken}
            onClick={onSave}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Salvando..." : "Salvar integração"}
          </button>
        </div>

        {/* Configuração do Webhook */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 mt-6">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Configuração do Webhook (PushinPay)
          </h3>
          
          <p className="text-xs text-muted-foreground">
            Configure estes valores no painel da PushinPay (seção Webhooks):
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium w-20">URL:</label>
              <code className="flex-1 text-xs bg-muted px-2 py-1 rounded overflow-x-auto">
                https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/pushinpay-webhook
              </code>
              <button
                onClick={() => copyToClipboard(
                  "https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/pushinpay-webhook",
                  "URL"
                )}
                className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copiar
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium w-20">Token:</label>
              <code className="flex-1 text-xs bg-muted px-2 py-1 rounded">
                rise_secure_token_123
              </code>
              <button
                onClick={() => copyToClipboard("rise_secure_token_123", "Token")}
                className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copiar
              </button>
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              <strong>Eventos:</strong> pix.created, pix.paid, pix.expired, pix.canceled
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-medium mb-2">Informações importantes</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>O token é armazenado de forma segura no banco de dados</li>
            <li>Use o ambiente Sandbox para testes antes de ir para produção</li>
            <li>Certifique-se de configurar o webhook no painel da PushinPay</li>
            <li>A taxa da plataforma é aplicada automaticamente em cada transação PIX</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
