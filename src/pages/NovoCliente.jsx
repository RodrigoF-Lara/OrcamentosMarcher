
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Cliente } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, User, Phone, Mail, MapPin,Globe, Key } from "lucide-react";
import BuscaHubspotCliente from "../components/clientes/BuscaHubspotCliente";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Adicionado

export default function NovoCliente() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState({
    nome: "",
    codigo_pais_telefone: "+55", // Default para Brasil
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    estado: "",
    cpf_cnpj: "",
    codigo_protheus: "" // Adicionado
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  const handleChange = (campo, valor) => {
    setCliente(prev => ({
      ...prev,
      [campo]: valor
    }));
  };
  
  const handleClienteHubspotSelected = (clienteData) => {
    if (clienteData && typeof clienteData === 'object') {
      // Tentar extrair código do país se já estiver no telefone
      let codigoPais = "+55";
      let numeroTelefone = clienteData.telefone || "";
      if (numeroTelefone.startsWith("+")) {
        const espacoIndex = numeroTelefone.indexOf(" ");
        if (espacoIndex > 0 && espacoIndex <=4) { // ex: +55 11... ou +1 ...
          codigoPais = numeroTelefone.substring(0, espacoIndex);
          numeroTelefone = numeroTelefone.substring(espacoIndex + 1);
        } else if (numeroTelefone.length > 10 && !isNaN(numeroTelefone.substring(1,3))) { // ex: +5511... ou +1415...
            if(numeroTelefone.startsWith("+55")){
                 codigoPais = "+55";
                 numeroTelefone = numeroTelefone.substring(3);
            } else if (numeroTelefone.startsWith("+1")){
                 codigoPais = "+1";
                 numeroTelefone = numeroTelefone.substring(2);
            }
            // Adicionar mais lógicas se necessário para outros códigos comuns
        }
      }

      setCliente({
        nome: clienteData.nome || "",
        codigo_pais_telefone: codigoPais,
        telefone: numeroTelefone.replace(/\D/g, ''), // Remover não dígitos
        email: clienteData.email || "",
        endereco: clienteData.endereco || "",
        cidade: clienteData.cidade || "",
        estado: clienteData.estado || "",
        cpf_cnpj: clienteData.cpf_cnpj || "",
        codigo_protheus: clienteData.codigo_protheus || "" // Adicionado (se vier do HubSpot)
      });
    }
  };
  
  const salvarCliente = async () => {
    if (!cliente.nome) {
      alert("Por favor, informe o nome do cliente");
      return;
    }
    
    setIsSaving(true);
    try {
      await Cliente.create({
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
      
      {/* Busca HubSpot */}
      <div className="mb-4">
        <BuscaHubspotCliente onClienteSelected={handleClienteHubspotSelected} />
      </div>
      
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
            </div>
            
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
            onClick={() => navigate(createPageUrl("Clientes"))}
          >
            Cancelar
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
    </div>
  );
}
