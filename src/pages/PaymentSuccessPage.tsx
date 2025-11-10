import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Mail, MessageCircle } from "lucide-react";

export const PaymentSuccessPage = () => {
  const { orderId } = useParams<{ orderId: string }>();

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          {/* Ícone de sucesso */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-6">
              <CheckCircle2 className="w-20 h-20 text-green-600" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pagamento Confirmado! 🎉
          </h1>

          {/* Mensagem de agradecimento */}
          <p className="text-lg text-gray-700 mb-8">
            Obrigado pela sua compra! Seu pedido foi processado com sucesso.
          </p>

          {/* Informações de envio */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Próximos passos:
            </h2>

            {/* Email */}
            <div className="flex items-start gap-4 text-left">
              <div className="bg-blue-100 rounded-lg p-3 flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Confirmação por E-mail
                </h3>
                <p className="text-gray-600 text-sm">
                  Enviamos os detalhes do seu pedido para o e-mail cadastrado.
                  Verifique sua caixa de entrada e spam.
                </p>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-start gap-4 text-left">
              <div className="bg-green-100 rounded-lg p-3 flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Confirmação por WhatsApp
                </h3>
                <p className="text-gray-600 text-sm">
                  Você também receberá uma mensagem no WhatsApp com todas as
                  informações do seu pedido.
                </p>
              </div>
            </div>
          </div>

          {/* Número do pedido */}
          {orderId && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Número do pedido:</p>
              <p className="font-mono text-sm text-gray-900 break-all">
                {orderId}
              </p>
            </div>
          )}

          {/* Mensagem final */}
          <p className="text-gray-600 text-sm">
            Se tiver alguma dúvida, entre em contato conosco através dos canais
            de atendimento.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Obrigado por confiar em nós! 💚
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
