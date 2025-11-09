import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Integracoes = () => {
  const [utmifyToken, setUtmifyToken] = useState("");
  const [utmifyActive, setUtmifyActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!utmifyToken.trim()) {
        toast.error("API Token é obrigatório");
        return;
      }

      // Simulação - em produção, fazer chamada real ao Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Integração salva com sucesso!");
    } catch (error) {
      console.error("Error saving integration:", error);
      toast.error("Erro ao salvar integração");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      
      if (!utmifyToken.trim()) {
        toast.error("Configure o token primeiro");
        return;
      }

      // Simulação - em produção, fazer chamada real ao Supabase
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Conexão testada com sucesso!");
    } catch (error) {
      console.error("Error testing integration:", error);
      toast.error("Erro ao testar conexão");
    } finally {
      setTesting(false);
    }
  };

  return (
    
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>Integrações</h1>
          <p className="text-sm" style={{ color: 'var(--subtext)' }}>
            Configure suas integrações com serviços externos
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle style={{ color: 'var(--text)' }}>UTMify</CardTitle>
                  <CardDescription style={{ color: 'var(--subtext)' }}>
                    Rastreamento e atribuição de conversões
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="utmify-active" style={{ color: 'var(--text)' }}>Ativo</Label>
                  <Switch
                    id="utmify-active"
                    checked={utmifyActive}
                    onCheckedChange={setUtmifyActive}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="utmify-token" style={{ color: 'var(--text)' }}>API Token</Label>
                <Input
                  id="utmify-token"
                  type="password"
                  placeholder="Cole seu token da UTMify aqui"
                  value={utmifyToken}
                  onChange={(e) => setUtmifyToken(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs" style={{ color: 'var(--subtext)' }}>
                  Obtenha seu token em{" "}
                  <a 
                    href="https://utmify.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    utmify.com.br
                  </a>
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Configuração
                </Button>
                <Button variant="outline" onClick={handleTest} disabled={testing || !utmifyToken}>
                  {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Testar Conexão
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium" style={{ color: 'var(--text)' }}>
                  Mais integrações em breve
                </p>
                <p className="text-sm" style={{ color: 'var(--subtext)' }}>
                  Estamos trabalhando para trazer mais integrações úteis para você
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    
  );
};

export default Integracoes;
