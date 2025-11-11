import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}

interface WebhooksListProps {
  webhooks: Webhook[];
  onEdit: (webhook: Webhook) => void;
  onDelete: (webhookId: string) => Promise<void>;
}

const EVENT_LABELS: Record<string, string> = {
  pix_generated: "PIX Gerado",
  purchase_approved: "Compra Aprovada",
};

export function WebhooksList({ webhooks, onEdit, onDelete }: WebhooksListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (webhookId: string) => {
    setWebhookToDelete(webhookId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!webhookToDelete) return;

    setDeleting(true);
    try {
      await onDelete(webhookToDelete);
      setDeleteDialogOpen(false);
      setWebhookToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const maskUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.length > 20 
        ? urlObj.pathname.substring(0, 20) + "..." 
        : urlObj.pathname;
      return `${urlObj.protocol}//${urlObj.host}${path}`;
    } catch {
      return url.length > 40 ? url.substring(0, 40) + "..." : url;
    }
  };

  if (webhooks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm" style={{ color: "var(--subtext)" }}>
          Nenhum webhook configurado ainda
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ color: "var(--text)" }}>URL</TableHead>
              <TableHead style={{ color: "var(--text)" }}>Eventos</TableHead>
              <TableHead style={{ color: "var(--text)" }}>Status</TableHead>
              <TableHead className="text-right" style={{ color: "var(--text)" }}>
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.map((webhook) => (
              <TableRow key={webhook.id}>
                <TableCell className="font-mono text-sm" style={{ color: "var(--text)" }}>
                  {maskUrl(webhook.url)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {EVENT_LABELS[event] || event}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={webhook.active ? "default" : "secondary"}
                    className={webhook.active ? "bg-green-600" : "bg-gray-600"}
                  >
                    {webhook.active ? "ATIVO" : "INATIVO"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(webhook)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este webhook? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
