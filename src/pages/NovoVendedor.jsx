
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Vendedor } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, UserCircle, Phone, Mail, Briefcase, Image, Loader2, Globe } from "lucide-react";
import { User } from "@/api/entities"; // Adicionado

export default function NovoVendedor() {
  const navigate = useNavigate();
  const [vendedor, setVendedor] = useState({
    nome: "",
    telefone: "",
    email: "",
    cargo: "",
    foto_url: "",
    hubspot_owner_id: "" // Adicionado
  });
  
  const [previewImage, setPreviewImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const fileInputRef = React.useRef(null);
  
  // Verificar se o usuário é admin quando o componente for montado
  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        const userData = await User.me();
        setIsAdmin(userData.role === 'admin');
      } catch (error) {
        console.error("Erro ao verificar usuário:", error);
      }
    };
    
    verificarAdmin();
  }, []);
  
  const handleChange = (campo, valor) => {
    if (campo === "email") {
      setVendedor(prev => ({
        ...prev,
        [campo]: valor.toLowerCase().trim()
      }));
    } else {
      setVendedor(prev => ({
        ...prev,
        [campo]: valor
      }));
    }
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
      setVendedor(prev => ({
        ...prev,
        foto_url: file_url
      }));
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
      setPreviewImage(null);
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
      const vendedorExistente = vendedoresExistentes.find(
        v => v.email && v.email.toLowerCase() === vendedor.email.toLowerCase()
      );
      
      if (vendedorExistente) {
        alert(`Já existe um vendedor cadastrado com este email: ${vendedorExistente.nome}`);
        setIsSaving(false);
        return;
      }
      
      await Vendedor.create({
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
          <span>Você está cadastrando um novo vendedor como administrador.</span>
        </div>
      )}
      
      {/* Dados do vendedor */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Foto */}
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
      
      {/* Ações */}
      <div className="sticky bottom-16 bg-white border-t p-4 rounded-t-lg shadow-lg">
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Vendedores"))}
          >
            Cancelar
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
    </div>
  );
}
