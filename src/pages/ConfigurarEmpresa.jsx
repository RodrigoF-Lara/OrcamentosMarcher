
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Empresa } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Save, 
  Building, 
  Image, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  CreditCard,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function ConfigurarEmpresa() {
  const navigate = useNavigate();
  const [empresaId, setEmpresaId] = useState(null);
  const [empresa, setEmpresa] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    logo_url: "",
    website: "",
    dados_bancarios: "",
    hubspot_api_key: ""
  });
  
  const [previewLogo, setPreviewLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const logoInputRef = React.useRef(null);
  
  useEffect(() => {
    carregarEmpresa();
    // Aqui você poderia carregar a chave do HubSpot de algum local, como localStorage ou de outra fonte
  }, []);
  
  const carregarEmpresa = async () => {
    setIsLoading(true);
    try {
      // Buscar se já existe uma empresa cadastrada
      const empresas = await Empresa.list();
      
      if (empresas.length > 0) {
        const empresaData = empresas[0];
        setEmpresa(empresaData);
        setEmpresaId(empresaData.id);
        
        if (empresaData.logo_url) {
          setPreviewLogo(empresaData.logo_url);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados da empresa:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (campo, valor) => {
    setEmpresa(prev => ({
      ...prev,
      [campo]: valor
    }));
  };
  
  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };
  
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Criar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewLogo(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Fazer upload da imagem
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setEmpresa(prev => ({
        ...prev,
        logo_url: file_url
      }));
    } catch (error) {
      console.error("Erro ao fazer upload do logo:", error);
      alert("Erro ao fazer upload do logo. Tente novamente.");
      setPreviewLogo(empresa.logo_url || null);
    } finally {
      setIsUploading(false);
    }
  };
  
  const removerLogo = () => {
    setPreviewLogo(null);
    setEmpresa(prev => ({
      ...prev,
      logo_url: ""
    }));
  };
  
  const salvarEmpresa = async () => {
    if (!empresa.nome) {
      alert("Por favor, informe o nome da empresa");
      return;
    }
    
    setIsSaving(true);
    try {
      if (empresaId) {
        await Empresa.update(empresaId, empresa);
      } else {
        await Empresa.create(empresa);
      }
      
      navigate(createPageUrl("Configuracoes"));
    } catch (error) {
      console.error("Erro ao salvar dados da empresa:", error);
      alert("Erro ao salvar dados. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
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
        onClick={() => navigate(createPageUrl("Configuracoes"))}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar
      </Button>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Logo */}
            <div className="flex justify-center mb-2">
              <div 
                className="w-32 h-32 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative rounded-lg"
                onClick={handleLogoClick}
              >
                <input 
                  type="file" 
                  ref={logoInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                    <span className="text-xs text-gray-500">Enviando...</span>
                  </div>
                ) : previewLogo ? (
                  <img 
                    src={previewLogo} 
                    alt="Logo da empresa"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4">
                    <Image className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 text-center">Adicionar logo da empresa</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="nome">Nome da Empresa</Label>
              <Input
                id="nome"
                value={empresa.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>
            
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={empresa.cnpj}
                onChange={(e) => handleChange("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center mb-1">
                  <Phone className="h-4 w-4 text-gray-500 mr-1" />
                  <Label htmlFor="telefone">Telefone</Label>
                </div>
                <Input
                  id="telefone"
                  value={empresa.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  placeholder="(00) 0000-0000"
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
                  value={empresa.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center mb-1">
                <Globe className="h-4 w-4 text-gray-500 mr-1" />
                <Label htmlFor="website">Website</Label>
              </div>
              <Input
                id="website"
                value={empresa.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://www.seusite.com"
              />
            </div>
            
            <div>
              <div className="flex items-center mb-1">
                <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                <Label htmlFor="endereco">Endereço</Label>
              </div>
              <Textarea
                id="endereco"
                value={empresa.endereco}
                onChange={(e) => handleChange("endereco", e.target.value)}
                placeholder="Endereço completo da empresa"
                rows={3}
              />
            </div>
            
            <div>
              <div className="flex items-center mb-1">
                <CreditCard className="h-4 w-4 text-gray-500 mr-1" />
                <Label htmlFor="dados_bancarios">Dados Bancários</Label>
              </div>
              <Textarea
                id="dados_bancarios"
                value={empresa.dados_bancarios}
                onChange={(e) => handleChange("dados_bancarios", e.target.value)}
                placeholder="Informações bancárias para pagamentos"
                rows={3}
              />
            </div>
          </div>
          
          {/* Adicionar depois de todos os outros campos */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-2">Integrações</h3>
            
            <div>
              <div className="flex items-center mb-1">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-500 mr-1">
                  <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
                  <path d="M8.5 5.5h3v9h-3v-9z"></path>
                  <path d="M5.5 8.5h9v3h-9v-3z"></path>
                </svg>
                <Label htmlFor="hubspot_api_key">Chave de API do HubSpot</Label>
              </div>
              <Input
                id="hubspot_api_key"
                type="password"
                value={empresa.hubspot_api_key || ""}
                onChange={(e) => handleChange("hubspot_api_key", e.target.value)}
                placeholder="Informe sua chave de API do HubSpot (começa com 'pat-')"
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta chave será usada para integrar orçamentos com o HubSpot CRM
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Ações */}
      <div className="sticky bottom-16 bg-white border-t p-4 rounded-t-lg shadow-lg">
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Configuracoes"))}
          >
            Cancelar
          </Button>
          
          <Button 
            onClick={salvarEmpresa} 
            disabled={isSaving || !empresa.nome}
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
