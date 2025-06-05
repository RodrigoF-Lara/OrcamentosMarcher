
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Empresa } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Globe,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Shield,
  Key,
  Save,
  Users,
  Building,
  Search,
  Loader2,
  FileText
} from "lucide-react";
import { hubspotTest } from "@/api/functions";
import { hubspotGetCompany } from "@/api/functions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hubspotGetDeal } from "@/api/functions";
import HubSpotEscopos from "../components/manual/HubSpotEscopos";

// Adicionar o novo import
import { hubspotGetDealProperties } from "@/api/functions";

export default function HubSpotConfig() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [empresa, setEmpresa] = useState(null);
  const [hubspotInfo, setHubspotInfo] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [testStatus, setTestStatus] = useState({
    status: null, // 'success', 'error', null
    message: "",
    details: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [dealInfo, setDealInfo] = useState(null);
  const [isDealTesting, setIsDealTesting] = useState(false);
  const [dealTestStatus, setDealTestStatus] = useState({
    status: null,
    message: "",
    details: null
  });
  
  const [dealProperties, setDealProperties] = useState(null);
  const [isPropertiesLoading, setIsPropertiesLoading] = useState(false);
  
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Verificar se o usuário é admin
        const userData = await User.me();
        setIsAdmin(userData.role === 'admin');
        
        // Carregar empresa e API key
        const empresas = await Empresa.list();
        if (empresas.length > 0) {
          const empresaData = empresas[0];
          setEmpresa(empresaData);
          setApiKey(empresaData.hubspot_api_key || "");
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);
  
  const testarConexao = async () => {
    setIsTesting(true);
    setTestStatus({ status: null, message: "", details: null });
    setHubspotInfo(null);
    
    try {
      const response = await hubspotTest();
      console.log("Resposta do teste:", response);
      
      if (response?.status === "success") {
        setHubspotInfo(response);
        setTestStatus({
          status: 'success',
          message: `Conexão estabelecida! Portal: ${response.name || response.portalId}`,
          details: response
        });
      } else {
        setTestStatus({
          status: 'error',
          message: response?.message || response?.error || "Erro desconhecido na conexão",
          details: response
        });
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setTestStatus({
        status: 'error',
        message: error.message || "Erro ao conectar com HubSpot",
        details: error
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  const salvarApiKey = async () => {
    if (!empresa) return;
    
    setIsSaving(true);
    try {
      await Empresa.update(empresa.id, {
        ...empresa,
        hubspot_api_key: apiKey
      });
      
      setTestStatus({
        status: 'success',
        message: "API Key salva com sucesso!",
        details: null
      });
      
      // Atualizar dados da empresa
      const empresas = await Empresa.list();
      if (empresas.length > 0) {
        setEmpresa(empresas[0]);
      }
    } catch (error) {
      console.error("Erro ao salvar API Key:", error);
      setTestStatus({
        status: 'error',
        message: "Erro ao salvar a API Key",
        details: error
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testarBuscaEmpresa = async () => {
    setIsTesting(true);
    setTestStatus({ status: null, message: "", details: null });
    setHubspotInfo(null);
    
    try {
      // A resposta da função da base44 geralmente vem em `response.data`
      const response = await hubspotGetCompany(); 
      
      // O objeto de sucesso/erro da NOSSA função está dentro de response.data
      const functionResult = response.data; 

      console.log("Resposta completa da função:", response);
      console.log("Resultado da função (response.data):", functionResult);
      
      if (functionResult?.status === "success") {
        setHubspotInfo(functionResult.company);
        setTestStatus({
          status: 'success',
          message: `Empresa encontrada: ${functionResult.company.properties?.name || 'Nome não disponível'}`,
          details: functionResult.company
        });
      } else {
        setTestStatus({
          status: 'error',
          message: functionResult?.message || functionResult?.error || "Erro desconhecido ao buscar empresa",
          details: functionResult // Guardar todos os detalhes da função para debug
        });

        if (functionResult?.hubspot_status) {
          console.error("Erro HubSpot Status:", functionResult.hubspot_status);
        }
        if (functionResult?.hubspot_error_details) {
          console.error("Detalhes do erro HubSpot:", functionResult.hubspot_error_details);
        }
      }
    } catch (error) {
      // Este catch lida com erros na chamada da função em si (ex: rede, etc.)
      console.error("Erro ao chamar a função hubspotGetCompany:", error);
      let errorMessage = "Erro ao conectar com o servidor da função.";
      if(error.response && error.response.data && error.response.data.message){
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setTestStatus({
        status: 'error',
        message: errorMessage,
        details: error.response?.data || error // Guardar o erro completo
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testarBuscaNegocio = async () => {
    setIsDealTesting(true);
    setDealTestStatus({ status: null, message: "", details: null });
    setDealInfo(null);
    
    try {
      const response = await hubspotGetDeal();
      const functionResult = response.data;
      
      console.log("Resposta completa da busca de deal:", response);
      console.log("Resultado da função (response.data):", functionResult);
      
      if (functionResult?.status === "success") {
        setDealInfo({
          deal: functionResult.deal,
          company: functionResult.associated_company,
          lineItems: functionResult.line_items,
          stageInfo: functionResult.stage_info
        });
        
        setDealTestStatus({
          status: 'success',
          message: `Negócio encontrado: ${functionResult.deal.properties?.dealname || 'Nome não disponível'}`,
          details: functionResult
        });
      } else {
        setDealTestStatus({
          status: 'error',
          message: functionResult?.message || functionResult?.error || "Erro desconhecido ao buscar negócio",
          details: functionResult
        });
      }
    } catch (error) {
      console.error("Erro ao buscar negócio:", error);
      setDealTestStatus({
        status: 'error',
        message: `Erro ao buscar negócio no HubSpot: ${error.message || error.toString()}`,
        details: error
      });
    } finally {
      setIsDealTesting(false);
    }
  };
  
  // Adicionar esta função
  const buscarPropriedadesDeal = async () => {
    setIsPropertiesLoading(true);
    try {
      const response = await hubspotGetDealProperties();
      console.log("Propriedades de Deal:", response.data);
      setDealProperties(response.data);
    } catch (error) {
      console.error("Erro ao buscar propriedades de Deal:", error);
    } finally {
      setIsPropertiesLoading(false);
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
      
      {/* Admin badge */}
      {isAdmin && (
        <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-md mb-4 text-sm flex items-center">
          <Shield className="h-4 w-4 mr-2" />
          <span>Você está acessando como administrador</span>
        </div>
      )}
      
      {/* Configuração da API Key */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Globe className="h-5 w-5 mr-2 text-orange-500" />
            Conexão com HubSpot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center mb-1">
                <Key className="h-4 w-4 text-gray-500 mr-1" />
                <Label htmlFor="apiKey">Chave de API (Private App Token)</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="flex-1"
                />
                <Button 
                  onClick={salvarApiKey} 
                  disabled={isSaving || !apiKey || apiKey === empresa?.hubspot_api_key}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Salvando
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" /> Salvar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                O token deve começar com "pat-" e pode ser criado em sua conta HubSpot em Settings &gt; Integrations &gt; Private Apps
              </p>
            </div>
            
            <div>
              <Button 
                onClick={testarConexao} 
                disabled={isTesting}
                variant="outline"
                className="w-full"
              >
                {isTesting ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Testando conexão...
                  </div>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" /> Testar Conexão
                  </>
                )}
              </Button>
            </div>
            
            {testStatus.status && (
              <div className={`p-3 rounded-md ${
                testStatus.status === 'success' 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <div className="flex items-start">
                  {testStatus.status === 'success' 
                    ? <CheckCircle className="h-5 w-5 mr-2" /> 
                    : <AlertTriangle className="h-5 w-5 mr-2" />
                  }
                  <span>{testStatus.message}</span>
                </div>
              </div>
            )}
            
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Globe className="h-5 w-5 mr-2 text-orange-500" />
            Teste de Busca de Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={testarBuscaEmpresa} 
              disabled={isTesting}
              variant="outline"
              className="w-full"
            >
              {isTesting ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Buscando empresa...
                </div>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1" /> Buscar Empresa 18886462379
                </>
              )}
            </Button>
            
            {testStatus.status && (
              <div className={`p-3 rounded-md ${
                testStatus.status === 'success' 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <div className="flex items-start">
                  {testStatus.status === 'success' 
                    ? <CheckCircle className="h-5 w-5 mr-2" /> 
                    : <AlertTriangle className="h-5 w-5 mr-2" />
                  }
                  <span>{testStatus.message}</span>
                </div>
              </div>
            )}
            
            {hubspotInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Dados da Empresa:</h3>
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(hubspotInfo, null, 2)}
                </pre>
              </div>
            )}

            {testStatus.status === 'error' && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <h3 className="font-medium mb-2 text-red-700">Detalhes do Erro:</h3>
                <p className="text-red-600">{testStatus.message}</p>
                <details className="mt-2">
                  <summary className="text-sm text-red-500 cursor-pointer">Ver mais detalhes</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-red-600 bg-red-100 p-2 rounded">
                    {JSON.stringify({ status: testStatus.status, details: testStatus.details }, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Globe className="h-5 w-5 mr-2 text-orange-500" />
            Teste de Busca de Negócio (Deal)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={testarBuscaNegocio} 
              disabled={isDealTesting}
              variant="outline"
              className="w-full"
            >
              {isDealTesting ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Buscando negócio...
                </div>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1" /> Buscar Negócio 37277061291
                </>
              )}
            </Button>
            
            {dealTestStatus.status && (
              <div className={`p-3 rounded-md ${
                dealTestStatus.status === 'success' 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <div className="flex items-start">
                  {dealTestStatus.status === 'success' 
                    ? <CheckCircle className="h-5 w-5 mr-2" /> 
                    : <AlertTriangle className="h-5 w-5 mr-2" />
                  }
                  <span>{dealTestStatus.message}</span>
                </div>
              </div>
            )}
            
            {dealInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Dados do Negócio:</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold">Nome do Negócio:</p>
                    <p>{dealInfo.deal.properties?.dealname || "N/A"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold">Valor:</p>
                    <p>{dealInfo.deal.properties?.amount 
                      ? `R$ ${parseFloat(dealInfo.deal.properties.amount).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}`
                      : "N/A"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold">Data de Fechamento:</p>
                    <p>{dealInfo.deal.properties?.closedate 
                      ? new Date(dealInfo.deal.properties.closedate).toLocaleDateString('pt-BR')
                      : "N/A"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold">Estágio:</p>
                    <p className="flex items-center gap-2">
                      {dealInfo.deal.stageInfo?.name || dealInfo.deal.properties?.dealstage || "N/A"}
                      <Badge variant="outline">
                        {dealInfo.deal.properties?.pipeline || "Pipeline Padrão"}
                      </Badge>
                    </p>
                  </div>
                  
                  {dealInfo.company && (
                    <div>
                      <p className="text-sm font-semibold">Empresa Associada:</p>
                      <p>{dealInfo.company.properties?.name || "N/A"}</p>
                      {dealInfo.company.properties?.phone && (
                        <p className="text-xs text-gray-600">{dealInfo.company.properties.phone}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Seção de Line Items (se houver) */}
                  {dealInfo.lineItems && dealInfo.lineItems.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold mb-2">Itens do Negócio:</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-right">Preço Unit.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dealInfo.lineItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                {item.properties.name}
                                {item.properties.hs_sku && (
                                  <span className="block text-xs text-gray-500">
                                    SKU: {item.properties.hs_sku}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{item.properties.quantity || 1}</TableCell>
                              <TableCell className="text-right">
                                {item.properties.price 
                                  ? `R$ ${parseFloat(item.properties.price).toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}` 
                                  : "N/A"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {item.properties.amount 
                                  ? `R$ ${parseFloat(item.properties.amount).toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}` 
                                  : "N/A"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
                
                <details className="mt-4">
                  <summary className="text-sm text-blue-600 cursor-pointer">Ver resposta completa</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
                    {JSON.stringify(dealInfo, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            
            {dealTestStatus.status === 'error' && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <h3 className="font-medium mb-2 text-red-700">Detalhes do Erro:</h3>
                <p className="text-red-600">{dealTestStatus.message}</p>
                <details className="mt-2">
                  <summary className="text-sm text-red-500 cursor-pointer">Ver mais detalhes</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-red-600 bg-red-100 p-2 rounded">
                    {JSON.stringify({ status: dealTestStatus.status, details: dealTestStatus.details }, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Globe className="h-5 w-5 mr-2 text-orange-500" />
            Propriedades de Deal (Negócio)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={buscarPropriedadesDeal} 
              disabled={isPropertiesLoading}
              variant="outline"
              className="w-full"
            >
              {isPropertiesLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Buscando propriedades...
                </div>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1" /> Buscar Propriedades de Deal
                </>
              )}
            </Button>
            
            {dealProperties && (
              <div className="mt-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium mb-2">Propriedades Obrigatórias:</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      {dealProperties.required_properties && dealProperties.required_properties.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Label</TableHead>
                              <TableHead>Tipo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dealProperties.required_properties.map((prop) => (
                              <TableRow key={prop.name}>
                                <TableCell className="font-mono text-xs">{prop.name}</TableCell>
                                <TableCell>{prop.label}</TableCell>
                                <TableCell>{prop.type}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-gray-500 text-sm">Nenhuma propriedade obrigatória encontrada</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-2">Propriedades Importantes:</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      {dealProperties.important_properties && dealProperties.important_properties.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Label</TableHead>
                              <TableHead>Tipo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dealProperties.important_properties.map((prop) => (
                              <TableRow key={prop.name}>
                                <TableCell className="font-mono text-xs">{prop.name}</TableCell>
                                <TableCell>{prop.label}</TableCell>
                                <TableCell>{prop.type}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-gray-500 text-sm">Nenhuma propriedade importante encontrada</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-2">Pipelines Disponíveis:</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      {dealProperties.pipelines && dealProperties.pipelines.length > 0 ? (
                        <div className="space-y-4">
                          {dealProperties.pipelines.map((pipeline) => (
                            <div key={pipeline.id}>
                              <p className="font-medium">
                                {pipeline.name} 
                                <span className="text-xs text-gray-500 ml-2">
                                  (ID: {pipeline.id})
                                </span>
                              </p>
                              
                              <div className="mt-2 pl-4">
                                <p className="text-sm text-gray-700 mb-1">Estágios:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {pipeline.stages.map((stage) => (
                                    <div key={stage.id} className="text-xs p-2 bg-white rounded border">
                                      <span className="font-medium">{stage.name}</span>
                                      <br />
                                      <span className="text-gray-500">ID: {stage.id}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Nenhum pipeline encontrado</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <details className="mt-4">
                  <summary className="text-sm text-blue-600 cursor-pointer">Ver resposta completa</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
                    {JSON.stringify(dealProperties, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Informações da conta HubSpot */}
      {hubspotInfo && hubspotInfo.status === "success" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Informações do Portal HubSpot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">Portal</h3>
                <p>{hubspotInfo.name || "N/A"}</p>
              </div>
              
              <div>
                <h3 className="font-medium">ID do Portal</h3>
                <p>{hubspotInfo.portalId || "N/A"}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Tipo</h3>
                <Badge variant="outline" className="mt-1">
                  {hubspotInfo.type || "N/A"}
                </Badge>
              </div>
              
              <div>
                <h3 className="font-medium">Moeda</h3>
                <p>{hubspotInfo.currency || "N/A"}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Timezone</h3>
                <p>{hubspotInfo.timeZone || hubspotInfo.timezone || "N/A"}</p>
              </div>
            </div>
            
            {/* Adicionar mais detalhes conforme necessário, como planos, limites, etc. */}
            
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={testarConexao}
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Atualizar Informações
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Seção de funcionalidades de integração - a expandir no futuro */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Funcionalidades de Integração</h2>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-600 mb-4">
              As seguintes funcionalidades já estão disponíveis ou em desenvolvimento:
            </p>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-500" />
                    Busca de Clientes
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">Disponível</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="flex items-center">
                    <Search className="h-4 w-4 mr-2 text-blue-500" />
                    Busca de Empresas
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Em Desenvolvimento</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    Sincronização de Orçamentos
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Em Desenvolvimento</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Seção de escopos necessários */}
      <HubSpotEscopos />
      
    </div>
  );
}
