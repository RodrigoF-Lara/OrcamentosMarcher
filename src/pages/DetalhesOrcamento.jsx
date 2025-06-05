
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Orcamento } from "@/api/entities";
import { InvokeLLM, SendEmail, UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Share2,
  AlertCircle,
  Clock, 
  Check, 
  X, 
  Send,
  Mail,
  Loader2,
  RefreshCw,
  FileText,
  TrendingUp,
  Edit3, 
  ThermometerSnowflake, ThermometerSun, Flame, ThumbsUp, ThumbsDown, TrendingDown, CircleSlash,
  AlertTriangle, CheckCircle, Globe, ExternalLink
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

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

import { Empresa } from "@/api/entities";
import { Produto } from "@/api/entities";
import { Cliente } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/api/entities";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { etapasFunilConfig, getEtapaFunilInfo } from "../components/funilUtils";
import { hubspotCreateDeal } from "@/api/functions";
import { hubspotDeleteDeal } from "@/api/functions";
import { toast } from "@/components/ui/use-toast";
import { downloadPDF2 } from "@/api/functions";
import { downloadPDF } from "@/api/functions";

export default function DetalhesOrcamento() {
  const navigate = useNavigate();
  const [orcamento, setOrcamento] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState({ status: false, message: null });
  const [emailData, setEmailData] = useState({
    to: "",
    subject: "",
    message: "",
    attachment: null,
    useAppEmail: false
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [htmlContentCache, setHtmlContentCache] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [produtosMapCache, setProdutosMapCache] = useState({});
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const [showModalMotivoPerda, setShowModalMotivoPerda] = useState(false);
  const [novoMotivoPerda, setNovoMotivoPerda] = useState("");
  const [etapaFunilParaPerda, setEtapaFunilParaPerda] = useState("");

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState({ type: "", text: "" });
  const [isIntegratingWithHubspot, setIsIntegratingWithHubspot] = useState(false);
  const [empresas, setEmpresas] = useState([]);

  const [showHubspotDeleteConfirm, setShowHubspotDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const orcamentoId = urlParams.get("id");
  
  const statusBadge = {
    rascunho: { label: "Rascunho", className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300", icon: Clock },
    enviado: { label: "Enviado", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", icon: Send },
    aprovado: { label: "Aprovado", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", icon: Check },
    rejeitado: { label: "Rejeitado", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: X }
  };
  
  useEffect(() => {
    const checkUserAndLoad = async () => {
      if (!orcamentoId) {
        setError("ID do orçamento não encontrado");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const user = await User.me();
        setIsAdmin(user.role === 'admin');

        if (user.role === 'admin') {
          const todosProdutos = await Produto.list();
          const map = {};
          todosProdutos.forEach(p => { map[p.id] = p; });
          setProdutosMapCache(map);
        }
        
        const empresasData = await Empresa.list();
        setEmpresas(empresasData);
        
        await carregarOrcamento();
      } catch (e) {
         console.error("Erro ao verificar usuário ou carregar produtos:", e);
         setError("Erro ao inicializar dados da página.");
      } finally {
        setIsLoading(false);
      }
    };
    checkUserAndLoad();
  }, [orcamentoId]);
  
  const carregarOrcamento = async () => {
    setIsLoading(true);
    setError(null); 
    try {
      const orcamentoData = await Orcamento.get(orcamentoId);
      
      let clienteInfoCompleto = null;
      if (orcamentoData && orcamentoData.cliente_id) {
        try {
            clienteInfoCompleto = await Cliente.get(orcamentoData.cliente_id);
        } catch (e) {
            console.warn("Não foi possível buscar dados completos do cliente para o orçamento.", e);
        }
      }

      setOrcamento({
        ...orcamentoData,
        cliente_cpf_cnpj_snapshot: orcamentoData?.cliente_cpf_cnpj_snapshot || clienteInfoCompleto?.cpf_cnpj || "",
        cliente_endereco_snapshot: orcamentoData?.cliente_endereco_snapshot || clienteInfoCompleto?.endereco || "",
        cliente_cidade_snapshot: orcamentoData?.cliente_cidade_snapshot || clienteInfoCompleto?.cidade || "",
        cliente_estado_snapshot: orcamentoData?.cliente_estado_snapshot || clienteInfoCompleto?.estado || "",
        cliente_codigo_pais_telefone_atual: clienteInfoCompleto?.codigo_pais_telefone || orcamentoData?.cliente_codigo_pais_telefone_snapshot || "+55",
        cliente_telefone_numero_atual: clienteInfoCompleto?.telefone || orcamentoData?.cliente_telefone_snapshot || "",
        cliente_email_atual: clienteInfoCompleto?.email || orcamentoData.cliente_email || ''
      });

      if (orcamentoData) {
         setEmailData(prev => ({ 
            ...prev, 
            to: clienteInfoCompleto?.email || orcamentoData.cliente_email || '', 
            subject: `Orçamento ${orcamentoData.numero || ''} - ${orcamentoData.cliente_nome || ''}`
        }));
      }

    } catch (err) {
      console.error("Erro ao carregar orçamento:", err);
      if (err.message?.includes("404") || err.message?.includes("not found")) {
        setError("Orçamento não encontrado. Verifique o ID ou tente novamente.");
      } else {
        setError("Erro ao carregar orçamento. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const alterarStatus = async (novoStatus) => {
    if (!orcamento) return;
    let novaEtapaFunil = orcamento.etapa_funil;
    let pedirMotivo = false;

    if (novoStatus === "aprovado") {
      novaEtapaFunil = "ganho";
    } else if (novoStatus === "rejeitado") {
      novaEtapaFunil = "perdido";
      pedirMotivo = true;
    }

    try {
      await Orcamento.update(orcamentoId, { status: novoStatus, etapa_funil: novaEtapaFunil });
      setOrcamento(prev => ({ ...prev, status: novoStatus, etapa_funil: novaEtapaFunil }));
      setHtmlContentCache(null); // Forçar regeração do HTML

      if (pedirMotivo) {
        setNovoMotivoPerda(orcamento.motivo_perda || "");
        setShowModalMotivoPerda(true);
      }

    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({title: "Erro", description: "Erro ao atualizar status do orçamento.", variant: "destructive"});
    }
  };
  
  const alterarEtapaFunil = async (novaEtapa, motivo = null) => {
    if (novaEtapa === "perdido" && (motivo === null || motivo.trim() === "")) {
      setEtapaFunilParaPerda(novaEtapa);
      setNovoMotivoPerda(orcamento.motivo_perda || "");
      setShowModalMotivoPerda(true);
      return;
    }

    setIsUpdating(true);
    try {
      const updateData = { etapa_funil: novaEtapa };
      if (novaEtapa === "perdido") {
        updateData.motivo_perda = motivo;
        updateData.status = "rejeitado"; // Se perdido, status também é rejeitado
      } else {
        updateData.motivo_perda = null; 
        // Se etapa for 'ganho', status é 'aprovado'
        if (novaEtapa === "ganho") {
          updateData.status = "aprovado";
        }
      }
      
      await Orcamento.update(orcamentoId, updateData);
      setOrcamento(prev => ({ ...prev, ...updateData }));
      setHtmlContentCache(null); // Forçar regeração do HTML
      toast({title: "Sucesso", description: "Etapa do funil alterada."});
    } catch (error) {
      console.error("Erro ao alterar etapa do funil:", error);
      toast({title: "Erro", description: "Falha ao alterar etapa do funil.", variant: "destructive"});
    } finally {
      setIsUpdating(false);
      setShowModalMotivoPerda(false);
      setNovoMotivoPerda("");
      setEtapaFunilParaPerda("");
    }
  };

  const handleSalvarMotivoPerda = () => {
    if (!novoMotivoPerda.trim()) {
      toast({title: "Atenção", description: "Por favor, informe o motivo da perda.", variant: "warning"});
      return;
    }
    alterarEtapaFunil("perdido", novoMotivoPerda);
  };
  
  const excluirOrcamento = async () => {
    if (!orcamento) return;
    try {
      if (orcamento.hubspot_deal_id && isAdmin) {
        setShowConfirmDelete(false); 
        setShowHubspotDeleteConfirm(true); 
        return;
      }
      
      await Orcamento.delete(orcamentoId);
      toast({title: "Sucesso", description: "Orçamento excluído."});
      navigate(createPageUrl("Orcamentos"));
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      if (error.message?.includes("404") || error.message?.includes("not found")) {
        toast({title: "Erro", description: "Este orçamento já foi excluído ou não existe mais.", variant: "destructive"});
        navigate(createPageUrl("Orcamentos"));
      } else {
        toast({title: "Erro", description: "Erro ao excluir orçamento. Tente novamente.", variant: "destructive"});
      }
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const excluirOrcamentoComHubspot = async (excluirNoHubspot) => {
    if (!orcamento) return;
    setIsDeleting(true);
    
    try {
      if (excluirNoHubspot && orcamento.hubspot_deal_id) {
        try {
          const response = await hubspotDeleteDeal({
            orcamentoId: orcamentoId
          });
          
          if (response.data?.status !== "success") {
            toast({
              title: "Aviso",
              description: response.data?.message || "Não foi possível excluir o Deal no HubSpot, mas o orçamento local será excluído.",
              variant: "warning",
              duration: 7000,
            });
          } else {
            toast({
                title: "HubSpot",
                description: "Deal excluído no HubSpot.",
            });
          }
        } catch (hubspotError) {
          console.error("Erro ao excluir Deal no HubSpot:", hubspotError);
          toast({
            title: "Aviso",
            description: "Erro ao excluir no HubSpot. O orçamento local será excluído mesmo assim.",
            variant: "warning",
            duration: 7000,
          });
        }
      }
      
      await Orcamento.delete(orcamentoId);
      toast({title: "Sucesso", description: "Orçamento excluído."});
      navigate(createPageUrl("Orcamentos"));
      
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast({title: "Erro", description: "Erro ao excluir orçamento. Tente novamente.", variant: "destructive"});
    } finally {
      setIsDeleting(false);
      setShowHubspotDeleteConfirm(false);
    }
  };

  const obterOuGerarHtmlCompleto = async (forcarRegeracao = false) => {
    if (htmlContentCache && !forcarRegeracao) {
      return htmlContentCache;
    }

    if (!orcamento) return null;
    
    setIsProcessingPDF(true); 
    try {
      const empresasData = await Empresa.list();
      const empresaData = empresasData.find(e => e.id === orcamento.empresa_id) || (empresasData.length > 0 ? empresasData[0] : null);
             
      const produtosMap = {}; // Para uso futuro se precisar buscar detalhes aqui

      const itensParaPrompt = orcamento.itens.map(item => {
        let descricaoDescontos = '';
        if (item.desconto_percentual_1 > 0) descricaoDescontos += `${item.desconto_percentual_1}%`;
        if (item.desconto_percentual_2 > 0) descricaoDescontos += descricaoDescontos ? ` + ${item.desconto_percentual_2}%` : `${item.desconto_percentual_2}%`;
        if (item.desconto_percentual_3 > 0) descricaoDescontos += descricaoDescontos ? ` + ${item.desconto_percentual_3}%` : `${item.desconto_percentual_3}%`;
        if (item.desconto_percentual_4 > 0) descricaoDescontos += descricaoDescontos ? ` + ${item.desconto_percentual_4}%` : `${item.desconto_percentual_4}%`;
        if (item.desconto_percentual_5 > 0) descricaoDescontos += descricaoDescontos ? ` + ${item.desconto_percentual_5}%` : `${item.desconto_percentual_5}%`;

        if (item.desconto_valor > 0) {
          const descontoFormatado = item.desconto_valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          descricaoDescontos += descricaoDescontos ? ` + ${descontoFormatado}` : descontoFormatado;
        }
        
        const produtoDoItemCache = produtosMapCache[item.produto_id]; // Use cache de produtos carregado no useEffect
        const imagemUrl = produtoDoItemCache?.imagem_url || '';
        
        let mc1_item_percentual_display = null;
        if (isAdmin) {
            let custoMpItemCalc = 0;
            if (item.custo_mp_item_total !== undefined) {
                custoMpItemCalc = item.custo_mp_item_total;
            } else if (produtoDoItemCache && produtoDoItemCache.custo_mp !== undefined) {
                custoMpItemCalc = (produtoDoItemCache.custo_mp || 0) * (item.quantidade || 1);
            }

            const valorFinalItem = item.valor_final || 0;
            const receitaLiquidaEstimadaItem = valorFinalItem * 0.9; // Assume 10% de impostos/taxas
            if (receitaLiquidaEstimadaItem > 0 && custoMpItemCalc >= 0) {
                const mc1Calc = (((custoMpItemCalc / receitaLiquidaEstimadaItem) - 1) * -1) * 100;
                mc1_item_percentual_display = `${mc1Calc.toFixed(2)}%`;
            } else {
                mc1_item_percentual_display = "N/A";
            }
        }
        
        return { 
            produto_nome: item.produto_nome,
            quantidade: item.quantidade,
            preco_unitario: (item.preco_unitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            desconto_detalhado: descricaoDescontos || '-',
            valor_final: (item.valor_final || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            imagem_url: imagemUrl,
            mc1_item_percentual: isAdmin ? mc1_item_percentual_display : undefined
        };
      });

      const valorBaseTodos = orcamento.itens?.reduce((total, item) => total + ((item.quantidade || 1) * (item.preco_unitario || 0)), 0) || 0;
      const descontoTotalValor = valorBaseTodos - (orcamento.valor_total || 0);
      const descontoTotalPerc = valorBaseTodos > 0 ? (descontoTotalValor / valorBaseTodos) * 100 : 0;
      const descontoTotalTexto = descontoTotalValor > 0.005 ? 
        `${descontoTotalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${descontoTotalPerc.toFixed(2)}%)` : "R$ 0,00";
      
      const mc1TotalOrcamentoEstimada = isAdmin ? calcularMC1OrcamentoCompletoDetalhes() : null;
      const etapaFunilInfoPdf = getEtapaFunilInfo(orcamento.etapa_funil);
      const etapaFunilTextoPdf = `${etapaFunilInfoPdf.label}${orcamento.etapa_funil === 'perdido' && orcamento.motivo_perda ? ` (Motivo: ${orcamento.motivo_perda})` : ''}`;

      const dadosBancarios = empresaData?.dados_bancarios?.replace(/\n/g, '<br>') || 'Dados bancários não informados.';
      const logoUrl = empresaData?.logo_url || ''; 

      const tituloDocumento = `Orçamento - ${orcamento.numero} - ${orcamento.cliente_nome}`;

      const colunasItens = "Imagem (40px, não renderizar se imagem_url vazia), Item (nome), Qtd, Preço Unit, Desconto Detalhado" +
                         (isAdmin ? ", MC1 Item (%)" : "") +
                         ", Total.";
      
      const dataOrcamentoFormatada = orcamento.data ? format(new Date(orcamento.data), "dd/MM/yyyy", { locale: ptBR }) : "N/A";
      const validadeOrcamentoFormatada = orcamento.validade ? format(new Date(orcamento.validade), "dd/MM/yyyy", { locale: ptBR }) : "N/A";

      let promptParaLLM = `Gere SOMENTE o CONTEÚDO do BODY de um HTML para um orçamento profissional.
                O HTML deve incluir estilos CSS embutidos (<style>) para garantir a aparência correta e ser otimizado para impressão em A4 vertical.
                NÃO inclua as tags <html>, <head>, <title> ou <!DOCTYPE html>. Comece diretamente com o conteúdo do <body>.
                
                No topo do conteúdo gerado, adicione um botão "Imprimir Orçamento" com a classe "no-print" e onclick="window.print()".
                Estilize este botão para que ele não apareça na impressão usando '@media print { .no-print { display: none !important; } }'.
                
                Layout do cabeçalho:
                - Logo da empresa à esquerda: ${logoUrl} (tamanho máximo 100px de largura). Se vazia, não renderize <img>.
                - Nome da empresa em destaque: ${empresaData?.nome || 'Nome da Empresa não informado'}
                - CNPJ: ${empresaData?.cnpj || 'CNPJ não informado'}
                - Endereço: ${empresaData?.endereco || 'Endereço não informado'}
                - Contatos: ${empresaData?.telefone || ''} | ${empresaData?.email || ''} | ${empresaData?.website || ''}
                
                Informações do orçamento em uma única linha dentro de um retângulo com borda:
                <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; font-weight: bold; background-color: #f8f9fa;">
                Orçamento: ${orcamento.numero} | Data: ${dataOrcamentoFormatada} | Validade: ${validadeOrcamentoFormatada} | Etapa Funil: ${etapaFunilTextoPdf}
                </div>
                
                Dados do cliente em tabela elegante:
                | Cliente: ${orcamento.cliente_nome || "Cliente não informado"}           | Endereço: ${orcamento.cliente_endereco_snapshot || ""} |
                | CPF/CNPJ: ${orcamento.cliente_cpf_cnpj_snapshot || ""}     | Cidade: ${orcamento.cliente_cidade_snapshot || ""} |
                | Telefone: ${((orcamento.cliente_codigo_pais_telefone_snapshot || "+55") + " " + (orcamento.cliente_telefone_snapshot || "")).trim()}     | Estado: ${orcamento.cliente_estado_snapshot || ""} |
                | Email: ${orcamento.cliente_email_snapshot || ""}           | Vendedor: ${orcamento.vendedor_nome || ""} |
                
                Itens (tabela com bordas suaves). JSON dos itens: ${JSON.stringify(itensParaPrompt)}
                Colunas: ${colunasItens}
                Se a coluna "MC1 Item (%)" for incluída, alinhe o texto à direita.
                
                Valor Total: ${(orcamento.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                Desconto Total Aplicado: ${descontoTotalTexto}`;
                
      if (isAdmin && mc1TotalOrcamentoEstimada && mc1TotalOrcamentoEstimada !== 'N/A') {
          promptParaLLM += `\nMC1 Orçamento (Estimada): ${mc1TotalOrcamentoEstimada}`;
      }
      
      promptParaLLM += `\nObservações: ${orcamento.observacoes || "Nenhuma observação."}
                ${orcamento.etapa_funil === 'perdido' && orcamento.motivo_perda ? `<p style="color: #555; font-style: italic; margin-top: 5px;"><strong>Motivo da Perda:</strong> ${orcamento.motivo_perda}</p>` : ''}
                Dados bancários (bloco no rodapé): ${dadosBancarios}
                
                Instruções de estilo:
                1. Fonte Arial 10pt ou 11pt. Margens do documento: 0.8cm. Espaçamento reduzido.
                2. Layout compacto e elegante. Tabela de itens bem espaçada.
                3. Cores em tons de azul. Bordas suaves.
                4. Quebras de página apropriadas (@media print { .page-break-before { page-break-before: always; } }).
                5. O HTML deve ser auto-contido com CSS inline ou em <style> tags DENTRO do corpo.
                NÃO inclua as tags <html>, <head>, <title> ou <!DOCTYPE html>.`;

      const corpoHtmlGeradoPeloLLM = await InvokeLLM({
        prompt: promptParaLLM,
        response_json_schema: null 
      });

      if (!corpoHtmlGeradoPeloLLM || typeof corpoHtmlGeradoPeloLLM !== 'string') {
        throw new Error("LLM não retornou um HTML válido.");
      }
      
      const adminWatermarkStyle = isAdmin ? `
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 60px;
          color: rgba(255, 0, 0, 0.1);
          font-weight: bold;
          z-index: 1000;
          pointer-events: none;
          width: 100%;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
        }
        .watermark-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 999;
        }
        .watermark-container .watermark:nth-child(1) { transform: translate(-50%, -100%) rotate(-45deg); }
        .watermark-container .watermark:nth-child(2) { transform: translate(-50%, 0%) rotate(-45deg); }
        .watermark-container .watermark:nth-child(3) { transform: translate(-50%, 100%) rotate(-45deg); }
        @media print {
          .watermark { color: rgba(255, 0, 0, 0.15); }
        }
      ` : '';

      const adminWatermarkDiv = isAdmin ? `
        <div class="watermark-container">
          <div class="watermark">USO INTERNO - CONFIDENCIAL</div>
          <div class="watermark">USO INTERNO - CONFIDENCIAL</div>
          <div class="watermark">USO INTERNO - CONFIDENCIAL</div>
        </div>
      ` : '';

      const fullHtmlParaIframe = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>${tituloDocumento}</title>
          <style>
            @page { size: A4 portrait; margin: 0.8cm; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.3; color: #333; background-color: #fff;}
            .page-container-print { width: 100%; max-width: 21cm; margin: 0 auto; padding: 0.5cm; box-sizing: border-box; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size:9pt; }
              .no-print { display: none !important; }
            }
            ${adminWatermarkStyle}
          </style>
        </head>
        <body>
          ${adminWatermarkDiv}
          <div class="page-container-print">
            ${corpoHtmlGeradoPeloLLM}
          </div>
        </body>
        </html>`;

      setHtmlContentCache(fullHtmlParaIframe);
      
      let updatePayload = {};
      let htmlMudou = !orcamento.pdf_html_url || forcarRegeracao;

      if (htmlMudou) {
          const htmlFile = new File([fullHtmlParaIframe], `orcamento-${orcamento.numero}.html`, { type: "text/html" });
          const { file_url } = await UploadFile({ file: htmlFile });
          updatePayload.pdf_html_url = file_url;
          
          // Se o orçamento era rascunho e foi gerado PDF, ele passa a ser 'enviado'.
          // A menos que a etapa já seja ganho ou perdido.
          if (orcamento.status === "rascunho" && orcamento.etapa_funil !== 'ganho' && orcamento.etapa_funil !== 'perdido') {
              updatePayload.status = "enviado";
          }

          if (Object.keys(updatePayload).length > 0) {
              await Orcamento.update(orcamentoId, updatePayload);
              setOrcamento(prev => ({ ...prev, ...updatePayload }));
          }
      }
      
      return fullHtmlParaIframe;

    } catch (error) {
      console.error("Erro ao gerar/processar HTML do orçamento:", error);
      toast({title: "Erro", description: "Erro ao gerar o HTML do orçamento. Tente novamente.", variant: "destructive"});
      return null;
    } finally {
      setIsProcessingPDF(false);
    }
  };

  const handleVisualizarHtml = async (forcarRegeracao = false) => {
    if (!orcamento) {
      toast({title: "Atenção", description: "Dados do orçamento não carregados.", variant: "warning"});
      return;
    }
    setIsProcessingPDF(true);
    const htmlString = await obterOuGerarHtmlCompleto(forcarRegeracao);
    setIsProcessingPDF(false);

    if (htmlString) {
      try {
        const blob = new Blob([htmlString], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        // Se o status era rascunho e agora visualizou/gerou, marcar como enviado (se não for ganho/perdido)
        if (orcamento.status === "rascunho" && orcamento.etapa_funil !== 'ganho' && orcamento.etapa_funil !== 'perdido') {
          alterarStatus("enviado");
        }
      } catch (error) {
        console.error("Erro ao carregar HTML para visualização:", error);
        toast({title: "Erro", description: "Não foi possível exibir o documento.", variant: "destructive"});
      }
    } else {
        toast({title: "Erro", description: "Não foi possível obter o HTML do documento.", variant: "destructive"});
    }
  };
  
  const enviarEmail = async () => {
    if (!orcamento) return;
    
    const destinatario = emailData.to || orcamento.cliente_email_atual;
    if (!destinatario) {
      toast({title: "Atenção", description: "Por favor, informe o email do destinatário", variant: "warning"});
      return;
    }
    
    const nomeCliente = orcamento.cliente_nome.split(' ')[0] || 'Cliente';
    const nomeVendedor = orcamento.vendedor_nome || 'Equipe de Vendas';

    const mailtoSubject = encodeURIComponent(emailData.subject || `Orçamento ${orcamento.numero} - ${orcamento.cliente_nome}`);
    
    let corpoEmail = emailData.message || `Olá ${nomeCliente},\n\nSegue orçamento solicitado!\n\nDúvidas fico à disposição.\n\nAtenciosamente,\n${nomeVendedor}`;
    
    // Adicionar link do PDF se o pdf_html_url existir
    if (orcamento.pdf_html_url) {
        corpoEmail += `\n\nVocê pode visualizar o orçamento online em: ${orcamento.pdf_html_url}`;
    } else {
        toast({
          title: "Aviso", 
          description: "HTML do orçamento não gerado. Clique em 'Ver / Imprimir Documento' primeiro para gerar o link.", 
          variant: "warning",
          duration: 7000
        });
        // Se não tem URL, não enviar.
        setShowShareOptions(false);
        return;
    }

    const mailtoBody = encodeURIComponent(corpoEmail);
    const mailtoLink = `mailto:${encodeURIComponent(destinatario)}?subject=${mailtoSubject}&body=${mailtoBody}`;
    
    window.open(mailtoLink, '_blank');
    
    setShowShareOptions(false);
    
    if (orcamento.status === "rascunho" && orcamento.etapa_funil !== 'ganho' && orcamento.etapa_funil !== 'perdido') {
      alterarStatus("enviado");
    }
  };

  const compartilharWhatsApp = async () => {
    if (!orcamento) return;
    
    const codigoPais = (orcamento.cliente_codigo_pais_telefone_atual || "+55").replace(/\D/g, '');
    const numero = (orcamento.cliente_telefone_numero_atual || "").replace(/\D/g, '');
    
    if (!numero) {
      toast({title: "Atenção", description: "Telefone do cliente não encontrado para compartilhamento via WhatsApp.", variant: "warning"});
      setIsProcessingPDF(false);
      return;
    }

    const telefoneCompleto = `${codigoPais}${numero}`;
    const nomeCliente = orcamento.cliente_nome.split(' ')[0] || 'Cliente';
    const nomeVendedor = orcamento.vendedor_nome || '';
    
    let mensagem = `Olá ${nomeCliente}, segue orçamento solicitado!`;
    
    if (orcamento.pdf_html_url) {
        mensagem += `\n\nVisualizar online: ${orcamento.pdf_html_url}`;
    } else {
        toast({
          title: "Aviso", 
          description: "HTML do orçamento não gerado. Clique em 'Ver / Imprimir Documento' primeiro para gerar o link e depois tente compartilhar.", 
          variant: "warning",
          duration: 7000
        });
        setShowShareOptions(false);
        return;
    }

    mensagem += `\n\nDúvidas fico à disposição.\n\n${nomeVendedor}`;

    const urlWA = `https://wa.me/${telefoneCompleto}?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWA, '_blank');
    
    if (orcamento.status === "rascunho" && orcamento.etapa_funil !== 'ganho' && orcamento.etapa_funil !== 'perdido') {
      alterarStatus("enviado");
    }
    setShowShareOptions(false);
  };
  
  const mapearStatusParaHubspot = (status) => { 
    return status;
  };
  
  const calcularMC1OrcamentoCompletoDetalhes = () => {
    if (!isAdmin || !orcamento || !orcamento.itens || orcamento.itens.length === 0) return "N/A";

    const somaCustoMpTotalItens = orcamento.itens.reduce((soma, item) => {
        if (item.custo_mp_item_total !== undefined) {
            return soma + (item.custo_mp_item_total || 0);
        }
        const produtoDoItem = produtosMapCache[item.produto_id];
        if (produtoDoItem && produtoDoItem.custo_mp !== undefined) {
            return soma + ((produtoDoItem.custo_mp || 0) * (item.quantidade || 1));
        }
        return soma;
    }, 0);

    const somaValorFinalTotalItens = orcamento.valor_total || 0;
    const receitaLiquidaEstimadaOrcamento = somaValorFinalTotalItens * 0.9; // Assume 10% impostos/taxas

    if (receitaLiquidaEstimadaOrcamento <= 0 || somaCustoMpTotalItens < 0) return "N/A";

    const mc1 = (((somaCustoMpTotalItens / receitaLiquidaEstimadaOrcamento) - 1) * -1) * 100;
    return `${mc1.toFixed(2)}%`;
  };

  const handleHubspotSync = async () => {
    if (!orcamento || !orcamento.id) return;

    setIsSyncing(true);
    setSyncMessage({ type: "", text: "" });
    try {
      const response = await hubspotCreateDeal({ orcamentoId: orcamento.id });
      
      if (response.data?.status === "success") {
        setSyncMessage({ type: "success", text: response.data.message || "Sincronizado com HubSpot!" });
        toast({title: "HubSpot", description: response.data.message || "Sincronizado com HubSpot!"});
        await carregarOrcamento(); 
      } else {
        setSyncMessage({ type: "error", text: response.data?.message || "Erro ao sincronizar com HubSpot." });
        toast({title: "HubSpot Erro", description: response.data?.message || "Erro ao sincronizar com HubSpot.", variant: "destructive"});
      }
    } catch (error) {
      console.error("Erro ao sincronizar com HubSpot:", error);
      setSyncMessage({ type: "error", text: "Erro de comunicação ao sincronizar." });
      toast({title: "HubSpot Erro", description: "Erro de comunicação ao sincronizar.", variant: "destructive"});
    } finally {
      setIsSyncing(false);
    }
  };

  const integrarComHubspot = async () => {
    if (!orcamento || !orcamentoId) return;
    
    setIsIntegratingWithHubspot(true);
    try {
      const response = await hubspotCreateDeal({
        orcamentoId: orcamentoId
      });
      
      if (response.data?.status === "success") {
        toast({
          title: "Sucesso!",
          description: "Orçamento integrado com o HubSpot.",
        });
        await carregarOrcamento(); 
      } else {
        toast({
          title: "Erro",
          description: response.data?.message || "Erro ao integrar com HubSpot.",
          variant: "destructive",
        });
        console.error("Erro na integração:", response.data);
      }
    } catch (error) {
      console.error("Erro ao integrar com HubSpot:", error);
      toast({
        title: "Erro",
        description: "Não foi possível integrar com o HubSpot.",
        variant: "destructive",
      });
    } finally {
      setIsIntegratingWithHubspot(false);
    }
  };
  
  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
        const response = await downloadPDF2({ orcamentoId });
        // Usamos response.data diretamente, já que o SDK fornece os bytes brutos na propriedade data
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orcamento_${orcamento.numero}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        console.error("Erro ao baixar PDF:", error);
        alert("Erro ao gerar PDF. Por favor, tente novamente.");
    } finally {
        setIsDownloadingPDF(false);
    }
};

  // Para evitar erro se orcamento for null inicialmente
  const etapaFunilAtualInfo = orcamento ? getEtapaFunilInfo(orcamento.etapa_funil) : getEtapaFunilInfo('default');

  return (
  <div className="p-4 pb-24 dark:bg-gray-900 min-h-screen"> {/* Aumentado pb para mais espaço */}
    <Button variant="ghost" size="sm" className="mb-4 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => navigate(createPageUrl("Orcamentos"))}>
      <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Orçamentos
    </Button>
    
    {isLoading && (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    )}

    {error && !isLoading && (
      <Card className="bg-white dark:bg-gray-800 shadow-lg">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
          <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">Erro ao Carregar Orçamento</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button 
            onClick={carregarOrcamento} 
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2"/> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )}
    
    {!orcamento && !isLoading && !error && ( 
      <Card className="bg-white dark:bg-gray-800 shadow-lg">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-2" />
          <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">Orçamento não encontrado</h2>
          <p className="text-gray-600 dark:text-gray-400">Não foi possível encontrar o orçamento solicitado.</p>
        </CardContent>
      </Card>
    )}
    
    {orcamento && !isLoading && !error && (
      <>
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Orçamento {orcamento.numero}</h1>
            {statusBadge[orcamento.status] && React.createElement(statusBadge[orcamento.status].icon, { className: `h-5 w-5 ${statusBadge[orcamento.status]?.className.split(' ')[1] || 'text-gray-800 dark:text-gray-300'}`})}
            <Badge className={`${statusBadge[orcamento.status]?.className} text-sm px-3 py-1 shadow`}>
              {statusBadge[orcamento.status]?.label}
            </Badge>
          </div>
          <div className="text-gray-600 dark:text-gray-400 mt-1 space-y-0.5 text-sm">
            <p>Cliente: <span className="font-medium text-gray-700 dark:text-gray-300">{orcamento.cliente_nome}</span></p>
            {orcamento.vendedor_nome && (<p>Vendedor: <span className="font-medium text-gray-700 dark:text-gray-300">{orcamento.vendedor_nome}</span></p>)}
            {orcamento.empresa_nome && (<p>Empresa: <span className="font-medium text-gray-700 dark:text-gray-300">{orcamento.empresa_nome}</span></p>)}
          </div>
        </div>

        <Card className="mb-4 bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-gray-800 dark:text-gray-100">
              <Globe className="h-5 w-5 mr-2 text-orange-500" />
              Integração HubSpot
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orcamento.hubspot_deal_id ? (
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1"/> Orçamento sincronizado com HubSpot.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Deal ID: {orcamento.hubspot_deal_id}</p>
                {orcamento.hubspot_last_sync && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Última sincronização: {format(new Date(orcamento.hubspot_last_sync), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </p>
                )}
                <div className="mt-2 flex gap-2 items-center flex-wrap">
                  <Button 
                    onClick={handleHubspotSync} 
                    variant="outline" 
                    size="sm"
                    disabled={isSyncing}
                    className="text-xs h-8 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Re-sincronizar
                  </Button>
                  {empresas.length > 0 && empresas[0]?.hubspot_api_key && empresas[0]?.hubspot_portal_id && (
                  <a 
                  href={`https://app.hubspot.com/contacts/${empresas[0].hubspot_portal_id}/deal/${orcamento.hubspot_deal_id}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 underline"
                  >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Ver no HubSpot
                  </a>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Este orçamento ainda não foi enviado para o HubSpot.
                </p>
                <Button 
                  onClick={integrarComHubspot} 
                  disabled={isIntegratingWithHubspot || !empresas[0]?.hubspot_api_key}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8"
                  title={!empresas[0]?.hubspot_api_key ? "Configure a API Key do HubSpot primeiro" : "Enviar para HubSpot"}
                >
                  {isIntegratingWithHubspot ? (
                     <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  Enviar para HubSpot
                </Button>
                 {!empresas[0]?.hubspot_api_key && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        A chave de API do HubSpot não está configurada.
                    </p>
                )}
              </div>
            )}
            {syncMessage.text && (
              <p className={`mt-2 text-xs ${syncMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {syncMessage.text}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="mb-6 shadow-lg bg-white dark:bg-gray-800">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Data</p>
                <p className="font-medium text-gray-700 dark:text-gray-300">{orcamento.data ? format(new Date(orcamento.data), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Validade</p>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {orcamento.validade ? format(new Date(orcamento.validade), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Criado em</p>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {orcamento.created_date ? format(new Date(orcamento.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "N/A"}
                </p>
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <p className="text-gray-500 dark:text-gray-400">Total do Orçamento</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {(orcamento.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                {(() => {
                  const valorBaseTodosItens = orcamento.itens?.reduce((total, item) => total + ((item.quantidade || 1) * (item.preco_unitario || 0)), 0) || 0;
                  const descontoTotalValorCalculado = valorBaseTodosItens - (orcamento.valor_total || 0);
                  const descontoTotalPercCalculado = valorBaseTodosItens > 0 ? (descontoTotalValorCalculado / valorBaseTodosItens) * 100 : 0;
                  if (descontoTotalValorCalculado > 0.005) { 
                    return (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Desconto total: {descontoTotalValorCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        {' '}({descontoTotalPercCalculado.toFixed(2)}%)
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
             {isAdmin && orcamento && orcamento.itens && orcamento.itens.length > 0 && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-green-600 dark:text-green-400" />
                      MC1 do Orçamento (Estimada): 
                      <span className="font-semibold ml-1 text-green-700 dark:text-green-300">{calcularMC1OrcamentoCompletoDetalhes()}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                      Fórmula: (((Soma Custos MP Itens) / (Total Orçamento * 0,9)) - 1) * -1
                  </p>
              </div>
             )}
            
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Documento do Orçamento:</p>
                <div className="flex gap-2 flex-wrap items-center">
                  <Button 
                    variant="default"
                    size="sm" 
                    onClick={() => handleVisualizarHtml(false)} 
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isProcessingPDF}
                  >
                    {isProcessingPDF && !htmlContentCache ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    Ver / Imprimir Documento
                  </Button>
                   <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleVisualizarHtml(true)}
                    title="Regerar e Ver/Imprimir Documento" 
                    className="h-8 w-8 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 dark:border-gray-600"
                    disabled={isProcessingPDF}
                  >
                    {isProcessingPDF ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Clique para visualizar. Na tela do documento, use o botão "Imprimir" para salvar como PDF.
                </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Itens do Orçamento</h2>
          <Card className="shadow-lg bg-white dark:bg-gray-800">
            <CardContent className="p-0 md:p-0">
              {(!orcamento.itens || orcamento.itens.length === 0) ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-6">Nenhum item no orçamento</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300 tracking-wider">Produto</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 tracking-wider">Qtd.</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 tracking-wider">Preço Unit.</th>
                        {isAdmin && <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 tracking-wider">Custo MP Item</th>}
                        <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 tracking-wider">Desconto Efet.</th>
                        {isAdmin && <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 tracking-wider">MC1 Item</th>}
                        <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 tracking-wider">Total Item</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {orcamento.itens?.map((item, index) => {
                        let custoMpItemTotalDisplay = "N/A";
                        let mc1ItemDisplay = "N/A";

                        if (isAdmin) {
                          let custoMpItemCalc = 0;
                          if (item.custo_mp_item_total !== undefined) {
                              custoMpItemCalc = item.custo_mp_item_total;
                          } else {
                              const produtoDoItem = produtosMapCache[item.produto_id];
                              if (produtoDoItem && produtoDoItem.custo_mp !== undefined) {
                                  custoMpItemCalc = (produtoDoItem.custo_mp || 0) * (item.quantidade || 1);
                              }
                          }
                          custoMpItemTotalDisplay = (custoMpItemCalc || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                          const valorFinalItem = item.valor_final || 0;
                          const receitaLiquidaEstimadaItem = valorFinalItem * 0.9; // Assume 10% impostos/taxas
                          if (receitaLiquidaEstimadaItem > 0 && custoMpItemCalc >= 0) {
                              const mc1Calc = (((custoMpItemCalc / receitaLiquidaEstimadaItem) - 1) * -1) * 100;
                              mc1ItemDisplay = `${mc1Calc.toFixed(2)}%`;
                          }
                        }

                        return (
                          <tr key={index} className="dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{item.produto_nome}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600 dark:text-gray-400">{item.quantidade}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600 dark:text-gray-400">{(item.preco_unitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            {isAdmin && <td className="px-4 py-3 whitespace-nowrap text-right text-blue-600 dark:text-blue-400">{custoMpItemTotalDisplay}</td>}
                            <td className="px-4 py-3 whitespace-nowrap text-right text-green-600 dark:text-green-400 text-xs">
                              {((item.desconto_efetivo || 0) > 0.001) ? `${item.desconto_efetivo.toFixed(2)}%` : '-'}
                            </td>
                            {isAdmin && <td className="px-4 py-3 whitespace-nowrap text-right text-green-600 dark:text-green-400">{mc1ItemDisplay}</td>}
                            <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-gray-800 dark:text-gray-100">
                              {(item.valor_final || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {orcamento.observacoes && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Observações</h2>
            <Card className="shadow-lg bg-white dark:bg-gray-800">
              <CardContent className="p-4 md:p-6">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm">{orcamento.observacoes}</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardContent className="p-3">
              <Label className="text-xs text-gray-500 dark:text-gray-400">Status</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    {statusBadge[orcamento.status] && React.createElement(statusBadge[orcamento.status].icon, { className: `h-4 w-4 mr-2 ${statusBadge[orcamento.status]?.className.split(' ')[1] || 'text-gray-800 dark:text-gray-300'}`})}
                    {statusBadge[orcamento.status]?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 dark:bg-gray-700 dark:border-gray-600">
                  <DropdownMenuLabel className="dark:text-gray-200">Alterar Status</DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-gray-600" />
                  {Object.entries(statusBadge).map(([statusKey, { label, icon: StatusIcon }]) => (
                    <DropdownMenuItem 
                      key={statusKey} 
                      onClick={() => alterarStatus(statusKey)} 
                      disabled={isUpdating || orcamento.status === statusKey}
                      className="dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      <StatusIcon className={`h-4 w-4 mr-2 ${statusBadge[statusKey]?.className.split(' ')[1] || 'text-gray-800 dark:text-gray-300'}`} />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardContent className="p-3">
              <Label className="text-xs text-gray-500 dark:text-gray-400">Etapa do Funil</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {etapaFunilAtualInfo && (
                    <Button variant="outline" className={`w-full justify-start font-normal ${etapaFunilAtualInfo.bgColor} ${etapaFunilAtualInfo.color} hover:${etapaFunilAtualInfo.bgColor.replace('-100', '-200')} border-2 ${etapaFunilAtualInfo.borderColor || 'border-gray-300 dark:border-gray-600'}`}>
                      <div className="flex items-center gap-2">
                        {React.cloneElement(etapaFunilAtualInfo.icon, { className: `h-4 w-4 ${etapaFunilAtualInfo.textColor || etapaFunilAtualInfo.color}` })}
                        {etapaFunilAtualInfo.label}
                      </div>
                    </Button>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 dark:bg-gray-700 dark:border-gray-600">
                  <DropdownMenuLabel className="dark:text-gray-200">Alterar Etapa</DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-gray-600"/>
                  {Object.keys(etapasFunilConfig).filter(key => key !== 'default').map(key => {
                    const config = getEtapaFunilInfo(key);
                    return (
                      <DropdownMenuItem 
                        key={key} 
                        onClick={() => alterarEtapaFunil(key)}
                        disabled={isUpdating || orcamento.etapa_funil === key}
                        className={`${config.textColor || config.color} hover:${config.bgColor.replace('-100', '-200')} dark:hover:bg-gray-600`}
                      >
                        <div className="flex items-center gap-2">
                          {React.cloneElement(config.icon, { className: `h-4 w-4 ${config.textColor || config.color}` })}
                          {config.label}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              {orcamento.etapa_funil === "perdido" && orcamento.motivo_perda && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                  <AlertTriangle className="h-3 w-3 inline mr-1 text-yellow-600 dark:text-yellow-400" />
                  Motivo: {orcamento.motivo_perda}
                </p>
              )}
            </CardContent>
          </Card>
        </div> 

        {/* Container para botões de ação - ficará fixo no rodapé da tela */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-3 shadow-lg z-30">
            <div className="max-w-4xl mx-auto flex flex-wrap justify-end items-center gap-2">
                {/* Novo botão para download do PDF */}
                <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPDF}
                    disabled={isDownloadingPDF}
                    className="flex items-center gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    {isDownloadingPDF ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    Download PDF
                </Button>

                <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(createPageUrl(`EditarOrcamento?id=${orcamentoId}`))}
                    className="flex items-center gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    <Edit3 className="h-4 w-4" />
                    Editar
                </Button>
                
                {isAdmin && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowConfirmDelete(true)}
                        className="flex items-center gap-1"
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Excluir
                    </Button>
                )}

                <Button 
                    size="sm"
                    onClick={() => setShowShareOptions(true)} 
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                >
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                </Button>
            </div>
        </div>
        
        {showConfirmDelete && (
          <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
            <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="dark:text-gray-100">Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription className="dark:text-gray-400">
                  Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={excluirOrcamento} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {showHubspotDeleteConfirm && (
          <AlertDialog open={showHubspotDeleteConfirm} onOpenChange={setShowHubspotDeleteConfirm}>
            <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="dark:text-gray-100">Excluir Orçamento e Deal no HubSpot?</AlertDialogTitle>
                <AlertDialogDescription className="dark:text-gray-400">
                  Este orçamento está sincronizado com o HubSpot (Deal ID: {orcamento?.hubspot_deal_id}). 
                  Deseja excluir o Deal correspondente no HubSpot também?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowHubspotDeleteConfirm(false)} disabled={isDeleting} className="dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600">Cancelar</AlertDialogCancel>
                <Button variant="outline" onClick={() => excluirOrcamentoComHubspot(false)} disabled={isDeleting} className="mr-2 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700">
                  Excluir Apenas Localmente
                </Button>
                <Button variant="destructive" onClick={() => excluirOrcamentoComHubspot(true)} disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Excluir em Ambos
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {showShareOptions && (
          <Dialog open={showShareOptions} onOpenChange={setShowShareOptions}>
            <DialogContent className="sm:max-w-[525px] dark:bg-gray-800 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="dark:text-gray-100">Compartilhar Orçamento</DialogTitle>
                <DialogDescription className="dark:text-gray-400">
                  Escolha como deseja compartilhar este orçamento.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email-to" className="text-right dark:text-gray-300">
                    Para
                  </Label>
                  <Input
                    id="email-to"
                    value={emailData.to}
                    onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                    className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email-subject" className="text-right dark:text-gray-300">
                    Assunto
                  </Label>
                  <Input
                    id="email-subject"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email-message" className="text-right dark:text-gray-300">
                    Mensagem
                  </Label>
                  <Textarea
                    id="email-message"
                    value={emailData.message}
                    onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                    className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    placeholder="Escreva uma mensagem opcional..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                  <Button variant="outline" onClick={compartilharWhatsApp} className="w-full sm:w-auto dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    WhatsApp
                  </Button>
                  <Button onClick={enviarEmail} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" disabled={isSendingEmail.status}>
                    {isSendingEmail.status && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Mail className="mr-2 h-4 w-4" /> Enviar por Email
                  </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {showModalMotivoPerda && (
          <Dialog open={showModalMotivoPerda} onOpenChange={() => { setShowModalMotivoPerda(false); setNovoMotivoPerda(""); setEtapaFunilParaPerda("");}}>
            <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="dark:text-gray-100">Motivo da Perda do Orçamento</DialogTitle>
                <DialogDescription className="dark:text-gray-400">
                  Por favor, descreva o motivo pelo qual este orçamento foi marcado como "Perdido".
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea 
                  value={novoMotivoPerda}
                  onChange={(e) => setNovoMotivoPerda(e.target.value)}
                  placeholder="Ex: Cliente optou por outra solução, preço, etc."
                  rows={4}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowModalMotivoPerda(false); setNovoMotivoPerda(""); setEtapaFunilParaPerda(""); }} className="dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600">Cancelar</Button>
                <Button onClick={handleSalvarMotivoPerda} disabled={isUpdating || !novoMotivoPerda.trim()} className="bg-blue-600 hover:bg-blue-700">
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar Motivo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </>
    )}
  </div>
);
}
