
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations';
import { Produto } from '@/api/entities';
import { 
  Loader2, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  Download,
  Info,
  FileText // Ícone para CSV
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function ImportarProdutosCSV({ open, onOpenChange, onImportComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '', details: null });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && !file.name.toLowerCase().endsWith('.csv')) {
      setFeedback({ type: 'error', message: 'Por favor, selecione um arquivo CSV (.csv).' });
      setSelectedFile(null);
      // Limpar o valor do input para permitir selecionar o mesmo arquivo novamente após um erro
      if (event.target) event.target.value = null; 
      return;
    }
    setSelectedFile(file);
    setFeedback({ type: '', message: '' });
  };

  const handleDownloadModeloCSV = () => {
    const csvHeader = "nome,codigo,preco,descricao,imagem_url\n"; // Cabeçalho simples
    const csvExample = "Produto Exemplo CSV A,CODCSV001,199.90,Descrição do produto A via CSV,https://via.placeholder.com/150/0000FF/808080?Text=ProdutoA\n";
    const csvExample2 = "Produto Exemplo CSV B,CODCSV002,245.50,Descrição do produto B via CSV,\n"; // Imagem opcional
    
    const csvContent = csvHeader + csvExample + csvExample2;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "modelo_produtos.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setFeedback({ type: 'error', message: 'Por favor, selecione um arquivo CSV.' });
      return;
    }
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setFeedback({ type: 'error', message: 'Arquivo inválido. Apenas arquivos .csv são permitidos.'});
      return;
    }

    setIsLoading(true);
    setFeedback({ type: 'info', message: 'Processando arquivo CSV...' });

    try {
      // 1. Fazer upload do arquivo
      const uploadResult = await UploadFile({ file: selectedFile });
      if (!uploadResult?.file_url) {
        throw new Error('Falha ao fazer upload do arquivo CSV.');
      }

      // 2. Extrair dados do CSV
      // A integração espera que os parâmetros sejam passados diretamente, não em um sub-objeto 'options'.
      const extractionResult = await ExtractDataFromUploadedFile({
        file_url: uploadResult.file_url,
        json_schema: {
          type: "object",
          properties: {
            nome: { type: "string" },
            codigo: { type: "string" },
            preco: { type: "number" },
            descricao: { type: "string" },
            imagem_url: { type: "string" }
          },
          required: ["nome", "preco"]
        },
        delimiter: ',',       // Especificar vírgula
        header: true,         // Indicar que o CSV tem cabeçalho
        encoding: 'utf-8',    // Especificar codificação
        ignore_errors: true   // Ignorar linhas com erros para tentar importar o máximo possível
      });

      if (extractionResult.status !== 'success' || !extractionResult.output) {
        console.error('Erro na extração do CSV:', extractionResult.details);
        let userMessage = `Falha ao extrair dados do CSV. Verifique o formato do arquivo.`;
        if (extractionResult.details) {
            userMessage += ` Detalhes: ${extractionResult.details}`;
        }
        throw new Error(userMessage);
      }
      
      let produtosParaCriar = extractionResult.output;

      // Garantir que 'preco' seja número e 'codigo' seja string
      produtosParaCriar = produtosParaCriar.map(p => ({
        ...p,
        nome: p.nome?.toString().trim(),
        codigo: p.codigo ? String(p.codigo).trim() : undefined,
        preco: parseFloat(String(p.preco).replace(",", ".")) || 0, // Substituir vírgula por ponto para decimais e converter
        descricao: p.descricao ? String(p.descricao).trim() : undefined,
        imagem_url: p.imagem_url ? String(p.imagem_url).trim() : undefined
      }));

      // Remover produtos que não têm nome ou preço após a conversão
      produtosParaCriar = produtosParaCriar.filter(p => p.nome && p.preco > 0);

      if (produtosParaCriar.length === 0) {
        throw new Error('Nenhum produto válido encontrado no CSV para importação. Verifique os dados e o formato.');
      }

      // 3. Criar produtos em massa
      setFeedback({ type: 'info', message: `Importando ${produtosParaCriar.length} produtos...` });
      await Produto.bulkCreate(produtosParaCriar);

      setFeedback({ type: 'success', message: `${produtosParaCriar.length} produtos importados com sucesso!` });
      setSelectedFile(null);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Erro na importação do CSV:', error);
      setFeedback({ type: 'error', message: error.message || 'Ocorreu um erro durante a importação do CSV.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Resetar feedback quando o diálogo é fechado/aberto
  const handleOpenChangeWithReset = (isOpen) => {
    if (!isOpen) {
      setSelectedFile(null);
      setFeedback({ type: '', message: '', details: null });
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeWithReset}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importar Produtos via CSV
          </DialogTitle>
          <DialogDescription>
            Faça o upload de um arquivo .csv para adicionar múltiplos produtos de uma vez.
            Certifique-se de que o arquivo está formatado corretamente.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Button 
            variant="outline" 
            onClick={handleDownloadModeloCSV} 
            className="w-full flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar Modelo CSV
          </Button>
          <p className="text-xs text-gray-500 px-1">
            Use este modelo para garantir que as colunas e o formato estejam corretos.
            O arquivo deve usar vírgula (,) como separador e codificação UTF-8.
          </p>

          <div className="grid w-full items-center gap-1.5 mt-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <Input 
              id="csv-file" 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {selectedFile && (
            <p className="text-sm text-gray-600 px-1">
              Arquivo selecionado: <span className="font-medium">{selectedFile.name}</span>
            </p>
          )}

          {/* Feedback */}
          {feedback.message && (
            <div className={`p-3 rounded-md text-sm flex items-start gap-2 whitespace-pre-line ${
              feedback.type === 'error' ? 'bg-red-50 text-red-700' : 
              feedback.type === 'success' ? 'bg-green-50 text-green-700' : 
              'bg-blue-50 text-blue-700'
            }`}>
              {feedback.type === 'error' && <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
              {feedback.type === 'success' && <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
              {feedback.type === 'info' && <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />}
              <div className="flex-1">{feedback.message}</div>
            </div>
          )}
           {feedback.details && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xs text-gray-500 py-1">Ver detalhes técnicos</AccordionTrigger>
                <AccordionContent className="text-xs text-gray-500 bg-gray-50 p-2 rounded max-h-32 overflow-auto">
                  <pre className="whitespace-pre-wrap break-all">{typeof feedback.details === 'object' ? JSON.stringify(feedback.details, null, 2) : feedback.details}</pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button 
            onClick={handleImport} 
            disabled={isLoading || !selectedFile}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Importar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
