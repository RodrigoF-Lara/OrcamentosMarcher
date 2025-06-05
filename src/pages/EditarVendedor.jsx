
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Vendedor } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Save, 
  Trash, 
  UserCircle, 
  Phone, 
  Mail, 
  Briefcase,
  Image,
  Loader2,
  AlertCircle,
  Globe
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
import { User } from "@/api/entities"; // Adicionado

export default function EditarVendedor() {
  const navigate = useNavigate();
  const [vendedor, setVendedor] = useState({
    nome: "",
    telefone: "",
    email: "",
    cargo: "",
    foto_url: "",
    hubspot_owner_id: null
  });
  
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const vendedorId = urlParams.get("id");
  
  const fileInputRef = React.useRef(null);
  
  useEffect(() => {
    if (!vendedorId) {
      setError("ID do vendedor não encontrado");
      setIsLoading(false);
      return;
    }
    
    carregarVendedor();
  }, [vendedorId]);
  
  const carregarVendedor = async () => {
    setIsLoading(true);
    try {
      // Verificar se o usuário é admin
      const userData = await User.me();
      setIsAdmin(userData.role === 'admin');
      
      const vendedorData = await Vendedor.get(vendedorId);
      setVendedor(vendedorData);
      
      if (vendedorData.foto_url) {
        setPreviewImage(vendedorData.foto_url);
      }
    } catch (error) {
      console.error("Erro ao carregar vendedor:", error);
      setError("Erro ao carregar dados do vendedor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (campo, valor) => {
    setVendedor(prev => ({
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
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
    
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setVendedor(prev => ({
        ...prev,
        foto_url: file_url
      }));
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
      setPreviewImage(vendedor.foto_url);
    } finally {
      setIsUploading(false);
    }
  };
  
  const removerImagem = () => {
    setPreviewImage(null);
    setVendedor(prev => ({
      ...prev,
      foto_url: ""
    }));
  };
  
  const salvarVendedor = async () => {
    if (!vendedor.nome) {
      alert("Por favor, informe o nome do vendedor");
      return;
    }
    
    if (!vendedor.email) {
      alert("Por favor, informe o email do vendedor para associação com a conta de usuário");
      return;
    }
    
    if (!vendedor.email.includes('@')) {
      alert("Por favor, informe um email válido");
      return;
    }
    
    setIsSaving(true);
    try {
      const vendedoresExistentes = await Vendedor.list();
      const vendedorComMesmoEmail = vendedoresExistentes.find(
        v => v.email && 
            v.email.toLowerCase() === vendedor.email.toLowerCase() && 
            v.id !== vendedorId
      );
      
      if (vendedorComMesmoEmail) {
        alert(`Já existe outro vendedor cadastrado com este email: ${vendedorComMesmoEmail.nome}`);
        setIsSaving(false);
        return;
      }
      
      await Vendedor.update(vendedorId, {
        ...vendedor,
        email: vendedor.email.toLowerCase().trim()
      });
      
      navigate(createPageUrl("Vendedores"));
    } catch (error) {
      console.error("Erro ao salvar vendedor:", error);
      alert("Erro ao salvar vendedor. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const excluirVendedor = async () => {
    setIsDeleting(true);
    try {
      await Vendedor.delete(vendedorId);
      navigate(createPageUrl("Vendedores"));
    } catch (error) {
      console.error("Erro ao excluir vendedor:", error);
      alert("Erro ao excluir vendedor. Tente novamente.");
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
          onClick={() => navigate(createPageUrl("Vendedores"))}
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
        onClick={() => navigate(createPageUrl("Vendedores"))}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar
      </Button>
      
      {/* Mensagem de admin */}
      {isAdmin && (
        <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-md mb-4 text-sm">
          <span>Você está editando como administrador. Todas as alterações serão registradas.</span>
        </div>
      )}
      
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex justify-center mb-2">
              <div 
                className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
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
                  <img 
                    src={previewImage} 
                    alt="Foto do vendedor"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <UserCircle className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Foto</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-center mb-1">
                <UserCircle className="h-4 w-4 text-gray-500 mr-1" />
                <Label htmlFor="nome">Nome completo</Label>
              </div>
              <Input
                id="nome"
                value={vendedor.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Nome do vendedor"
              />
            </div>
            
            <div>
              <div className="flex items-center mb-1">
                <Mail className="h-4 w-4 text-gray-500 mr-1" />
                <Label htmlFor="email">E-mail</Label>
              </div>
              <Input
                id="email"
                type="email"
                value={vendedor.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center mb-1">
                  <Phone className="h-4 w-4 text-gray-500 mr-1" />
                  <Label htmlFor="telefone">Telefone</Label>
                </div>
                <Input
                  id="telefone"
                  value={vendedor.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <Briefcase className="h-4 w-4 text-gray-500 mr-1" />
                  <Label htmlFor="cargo">Cargo</Label>
                </div>
                <Input
                  id="cargo"
                  value={vendedor.cargo}
                  onChange={(e) => handleChange("cargo", e.target.value)}
                  placeholder="Cargo"
                />
              </div>
            </div>
            
            {/* Campo de ID do proprietário no HubSpot (apenas para admin) */}
            {isAdmin && (
              <div>
                <div className="flex items-center mb-1">
                  <Globe className="h-4 w-4 text-gray-500 mr-1" />
                  <Label htmlFor="hubspot_owner_id">ID do Proprietário no HubSpot</Label>
                </div>
                <Input
                  id="hubspot_owner_id"
                  value={vendedor.hubspot_owner_id || ""}
                  onChange={(e) => handleChange("hubspot_owner_id", e.target.value)}
                  placeholder="ID numérico do proprietário no HubSpot"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Digite o ID do usuário proprietário no HubSpot para sincronização de orçamentos.
                  Este ID pode ser encontrado na URL do perfil do usuário ou na API do HubSpot.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
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
            onClick={salvarVendedor} 
            disabled={isSaving || !vendedor.nome}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                Salvando
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>
      
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vendedor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este vendedor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={excluirVendedor}
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
