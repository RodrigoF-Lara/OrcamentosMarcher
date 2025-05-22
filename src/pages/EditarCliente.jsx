
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Cliente } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Trash2, User, Phone, Mail, MapPin, AlertCircle, Globe, Key } from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hubspotSyncCliente } from "@/api/functions";

export default function EditarCliente() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState({
    nome: "",
    codigo_pais_telefone: "+55",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    estado: "",
    cpf_cnpj: "",
    codigo_protheus: "",
    hubspot_company_id: null,
    hubspot_last_sync: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const clienteId = urlParams.get("id");
  
  useEffect(() => {
    if (!clienteId) {
      setError("ID do cliente não encontrado");
      setIsLoading(false);
      return;
    }
    carregarCliente();
  }, [clienteId]);
  
  const carregarCliente = async () => {
    setIsLoading(true);
    try {
      const clienteData = await Cliente.get(clienteId);
      setCliente({
        ...clienteData,
        codigo_pais_telefone: clienteData.codigo_pais_telefone || "+55",
        telefone: clienteData.telefone || "",
        codigo_protheus: clienteData.codigo_protheus || "",
        hubspot_company_id: clienteData.hubspot_company_id || null,
        hubspot_last_sync: clienteData.hubspot_last_sync || null
      });
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
      setError("Erro ao carregar cliente. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (campo, valor) => {
    setCliente(prev => ({
      ...prev,
      [campo]: valor
    }));
  };
  
  const salvarCliente = async () => {
    if (!cliente.nome) {
      alert("Por favor, informe o nome do cliente");
      return;
    }
    
    setIsSaving(true);
    try {
      await Cliente.update(clienteId, {
        ...cliente,
        telefone: cliente.telefone.replace(/\D/g, '') // Garantir que só números sejam salvos
      });
      navigate(createPageUrl("Clientes"));
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const excluirCliente = async () => {
    setIsDeleting(true);
    try {
      await Cliente.delete(clienteId);
      navigate(createPageUrl("Clientes"));
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      alert("Erro ao excluir cliente. Tente novamente.");
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };
  
  const sincronizarComHubspot = async () => {
    if (!clienteId || !cliente.codigo_protheus) return;
    
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const response = await hubspotSyncCliente({
        clienteId: clienteId,
        forcarAtualizacao: true
      });
      
      console.log("Resposta da sincronização:", response);
      
      if (response.data?.status === "success") {
        setSyncStatus({
          type: "success",
          message: response.data.message || "Cliente sincronizado com sucesso!"
        });
        
        // Recarregar os dados do cliente para pegar o hubspot_company_id atualizado
        carregarCliente();
      } else {
        setSyncStatus({
          type: "error",
          message: response.data?.message || "Erro ao sincronizar com HubSpot."
        });
      }
    } catch (error) {
      console.error("Erro ao sincronizar cliente:", error);
      setSyncStatus({
        type: "error",
        message: "Erro ao sincronizar com HubSpot."
      });
    } finally {
      setIsSyncing(false);
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
          onClick={() => navigate(createPageUrl("Clientes"))}
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
        onClick={() => navigate(createPageUrl("Clientes"))}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar
      </Button>
      
      {/* Dados do cliente */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <div className="flex items-center mb-1">
                <User className="h-4 w-4 text-gray-500 mr-1" />
                <Label htmlFor="nome">Nome completo</Label>
              </div>
              <Input
                id="nome"
                value={cliente.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <div className="flex items-center mb-1">
                  <Globe className="h-4 w-4 text-gray-500 mr-1" />
                  <Label htmlFor="codigo_pais_telefone">País</Label>
                </div>
                <Select
                  value={cliente.codigo_pais_telefone}
                  onValueChange={(value) => handleChange("codigo_pais_telefone", value)}
                >
                  <SelectTrigger id="codigo_pais_telefone">
                    <SelectValue placeholder="Código do País" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+55">Brasil (+55)</SelectItem>
                    <SelectItem value="+1">EUA (+1)</SelectItem>
                    <SelectItem value="+351">Portugal (+351)</SelectItem>
                    <SelectItem value="+44">Reino Unido (+44)</SelectItem>
                    <SelectItem value="+49">Alemanha (+49)</SelectItem>
                    {/* Adicionar mais países conforme necessário */}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center mb-1">
                  <Phone className="h-4 w-4 text-gray-500 mr-1" />
                  <Label htmlFor="telefone">Telefone (somente números)</Label>
                </div>
                <Input
                  id="telefone"
                  value={cliente.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 11987654321"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
              <Input
                id="cpf_cnpj"
                value={cliente.cpf_cnpj}
                onChange={(e) => handleChange("cpf_cnpj", e.target.value)}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
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
                value={cliente.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            {/* Novo campo Código Protheus */}
            <div>
              <div className="flex items-center mb-1">
                <Key className="h-4 w-4 text-gray-500 mr-1" />
                <Label htmlFor="codigo_protheus">Código Protheus</Label>
              </div>
              <Input
                id="codigo_protheus"
                value={cliente.codigo_protheus}
                onChange={(e) => handleChange("codigo_protheus", e.target.value)}
                placeholder="Código interno Protheus"
              />
              {cliente.codigo_protheus && cliente.hubspot_company_id && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Cliente vinculado ao HubSpot (ID: {cliente.hubspot_company_id})
                  {cliente.hubspot_last_sync && (
                    <span className="block text-gray-500">
                      Última sincronização: {new Date(cliente.hubspot_last_sync).toLocaleString()}
                    </span>
                  )}
                </p>
              )}
              {cliente.codigo_protheus && !cliente.hubspot_company_id && (
                <div className="text-xs text-blue-600 mt-1 flex items-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={sincronizarComHubspot}
                    disabled={isSyncing || !cliente.codigo_protheus}
                    className="mt-1 text-xs h-7 px-2"
                  >
                    {isSyncing ? (
                      <>
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                        Sincronizando...
                      </>
                    ) : (
                      <>Sincronizar com HubSpot</>
                    )}
                  </Button>
                </div>
              )}
              {!cliente.codigo_protheus && (
                <p className="text-xs text-amber-600 mt-1">
                  O código Protheus é necessário para sincronização com HubSpot
                </p>
              )}
            </div>
            
            {/* Mostrar resultado da sincronização */}
            {syncStatus && (
              <div className={`mt-2 p-2 text-sm rounded-md ${
                syncStatus.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                {syncStatus.message}
              </div>
            )}
            
            <div>
              <div className="flex items-center mb-1">
                <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                <Label htmlFor="endereco">Endereço</Label>
              </div>
              <Textarea
                id="endereco"
                value={cliente.endereco}
                onChange={(e) => handleChange("endereco", e.target.value)}
                placeholder="Endereço completo"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={cliente.cidade}
                  onChange={(e) => handleChange("cidade", e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={cliente.estado}
                  onChange={(e) => handleChange("estado", e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                  className="uppercase"
                />
              </div>
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
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
          
          <Button 
            onClick={salvarCliente} 
            disabled={isSaving || !cliente.nome}
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
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={excluirCliente}
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
                  <Trash2 className="h-4 w-4 mr-1" />
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
