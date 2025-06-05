
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Produto } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  AlertCircle, 
  Camera, 
  Package, 
  ArrowLeft, 
  Save, 
  Trash, 
  Image, 
  Loader2,
  AlertTriangle
} from "lucide-react";
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
import { User } from "@/api/entities";

export default function EditarProduto() {
  const navigate = useNavigate();
  const [produto, setProduto] = useState({
    nome: "",
    codigo: "",
    preco: 0,
    custo_mp: 0, // Adicionado
    descricao: "",
    imagem_url: ""
  });
  
  const [produtoOriginal, setProdutoOriginal] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Adicionado
  
  const urlParams = new URLSearchParams(window.location.search);
  const produtoId = urlParams.get("id");
  
  const fileInputRef = React.useRef(null);
  
  useEffect(() => {
    if (!produtoId) {
      setError("ID do produto não encontrado");
      setIsLoading(false);
      return;
    }
    const checkAdminAndLoad = async () => {
        try {
            const user = await User.me();
            setIsAdmin(user.role === 'admin');
        } catch (e) {
            console.error("Erro ao verificar perfil de usuário:", e);
        }
        carregarProduto();
    }
    checkAdminAndLoad();
  }, [produtoId]);
  
  const carregarProduto = async () => {
    setIsLoading(true);
    try {
      const produtoData = await Produto.get(produtoId);
      setProdutoOriginal(produtoData);
      setProduto(produtoData);
      
      // Configurar preview da imagem se existir
      if (produtoData.imagem_url) {
        setPreviewImage(produtoData.imagem_url);
      }
    } catch (error) {
      console.error("Erro ao carregar produto:", error);
      setError("Erro ao carregar produto. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (campo, valor) => {
    setProduto(prev => ({
      ...prev,
      [campo]: valor
    }));
  };
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Criar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Fazer upload da imagem
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setProduto(prev => ({
        ...prev,
        imagem_url: file_url
      }));
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
      setPreviewImage(produtoOriginal?.imagem_url || null);
    } finally {
      setIsUploading(false);
    }
  };
  
  const removerImagem = () => {
    setPreviewImage(null);
    setProduto(prev => ({
      ...prev,
      imagem_url: ""
    }));
  };
  
  const salvarProduto = async () => {
    if (!produto.nome) {
      alert("Por favor, informe o nome do produto");
      return;
    }
    
    if (!produto.preco || produto.preco <= 0) {
      alert("Por favor, informe um preço válido");
      return;
    }
    if (isAdmin && (produto.custo_mp === undefined || produto.custo_mp < 0)) {
        alert("Por favor, informe um custo de matéria prima válido (pode ser 0).");
        return;
    }
    
    setIsSaving(true);
    try {
      const payload = {...produto};
      if (!isAdmin) {
        // Se não for admin, não enviar o custo_mp ou garantir que seja o valor original não modificado
        // Para simplificar, se não for admin, não alteramos o custo_mp que veio do banco
        if (produtoOriginal && payload.custo_mp !== produtoOriginal.custo_mp) {
             payload.custo_mp = produtoOriginal.custo_mp === undefined ? 0 : produtoOriginal.custo_mp;
        } else if (!produtoOriginal && payload.custo_mp !== undefined) {
            payload.custo_mp = 0;
        }
      }
      await Produto.update(produtoId, payload);
      navigate(createPageUrl("Produtos"));
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const calcularMC1Cadastro = () => {
    if (!isAdmin || !produto.preco || produto.preco <= 0 || produto.custo_mp === undefined || produto.custo_mp < 0) {
      return "N/A";
    }
    const precoVendaComImpostoAprox = produto.preco * 0.9;
    if (precoVendaComImpostoAprox <= 0) return "N/A";
    
    const mc1 = (((produto.custo_mp / precoVendaComImpostoAprox) - 1) * -1) * 100;
    return `${mc1.toFixed(2)}%`;
  };
  
  const excluirProduto = async () => {
    setIsDeleting(true);
    try {
      await Produto.delete(produtoId);
      navigate(createPageUrl("Produtos"));
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto. Tente novamente.");
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Produtos"))}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
            <h2 className="text-xl font-bold mb-2">Erro</h2>
            <p className="text-gray-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-4 pb-16">
      {/* Botão voltar */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate(createPageUrl("Produtos"))}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar
      </Button>
      
      {/* Dados do produto */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex justify-center mb-2">
              <div 
                className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
                onClick={handleImageClick}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                    <span className="text-xs text-gray-500">Enviando...</span>
                  </div>
                ) : previewImage ? (
                  <>
                    <img 
                      src={previewImage} 
                      alt="Imagem do produto"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute bottom-1 right-1 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        removerImagem();
                      }}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Image className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Adicionar imagem</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={produto.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Nome do produto"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  value={produto.codigo}
                  onChange={(e) => handleChange("codigo", e.target.value)}
                  placeholder="Código ou referência"
                />
              </div>
              <div>
                <Label htmlFor="preco">Preço de Venda</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5">R$</span>
                  <Input
                    id="preco"
                    type="number"
                    min="0"
                    step="0.01"
                    value={produto.preco}
                    onChange={(e) => handleChange("preco", Number(e.target.value))}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {isAdmin && (
              <>
                <div>
                  <Label htmlFor="custo_mp">Custo Matéria Prima (MP)</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5">R$</span>
                    <Input
                      id="custo_mp"
                      type="number"
                      min="0"
                      step="0.01"
                      value={produto.custo_mp}
                      onChange={(e) => handleChange("custo_mp", Number(e.target.value))}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                </div>
                 <div className="p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-700">MC1 do Cadastro (Estimada): <span className="font-semibold">{calcularMC1Cadastro()}</span></p>
                    <p className="text-xs text-gray-500 italic mt-1">Fórmula: (((Custo MP) / (Preço Venda * 0,9)) - 1) * -1</p>
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={produto.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder="Descrição do produto"
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Ações */}
      <div className="sticky bottom-16 bg-white border-t p-4 rounded-t-lg shadow-lg">
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash className="h-4 w-4 mr-1" />
            Excluir
          </Button>
          
          <Button 
            onClick={salvarProduto} 
            disabled={isSaving || !produto.nome || !produto.preco || produto.preco <= 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? 
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                Salvando
              </div>
              : 
              <>
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </>
            }
          </Button>
        </div>
      </div>
      
      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={excluirProduto}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                  Excluindo...
                </div>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-1" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
