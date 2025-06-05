
import React, { useState, useEffect } from "react";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Loader2, Search, User } from "lucide-react";
import { Empresa } from "@/api/entities";

export default function BuscaHubspotCliente({ onClienteSelected }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [apiKey, setApiKey] = useState("");

  // Buscar API key do HubSpot quando o componente carregar
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const empresas = await Empresa.list();
        if (empresas.length > 0 && empresas[0].hubspot_api_key) {
          setApiKey(empresas[0].hubspot_api_key);
        }
      } catch (error) {
        console.error("Erro ao buscar API key do HubSpot:", error);
      }
    };
    
    fetchApiKey();
  }, []);

  const searchClients = async () => {
    if (searchTerm.length < 3) return;
    
    setIsLoading(true);
    setShowResults(true);
    
    try {
      if (apiKey) {
        console.log('🔍 Iniciando busca no HubSpot...');
        console.log('📝 Termo de busca:', searchTerm);
        console.log('🔑 API Key encontrada:', apiKey.substring(0, 10) + '...');

        const response = await InvokeLLM({
          prompt: `
            Buscar contatos no HubSpot com o termo "${searchTerm}" usando a API v3.
            
            Endpoint: https://api.hubapi.com/crm/v3/objects/contacts/search
            Método: POST
            Headers: 
              - Authorization: Bearer ${apiKey}
              - Content-Type: application/json
            
            Body:
            {
              "filterGroups": [{
                "filters": [{
                  "propertyName": "firstname", // ou 'lastname', 'email'
                  "operator": "CONTAINS_TOKEN",
                  "value": "${searchTerm}"
                }, {
                  "propertyName": "lastname", 
                  "operator": "CONTAINS_TOKEN",
                  "value": "${searchTerm}"
                }, {
                  "propertyName": "email", 
                  "operator": "CONTAINS_TOKEN",
                  "value": "${searchTerm}"
                }
              ], "operator": "OR"}], // Adicionado OR para buscar em múltiplos campos
              "properties": ["firstname", "lastname", "email", "phone", "mobilephone", "address", "city", "state", "zip", "hs_legal_entity_type", "cnpj"], // Adicionado mobilephone, cnpj, hs_legal_entity_type
              "limit": 5
            }
            
            Retorne os resultados mapeados para o formato esperado pelo cliente. O nome deve ser a concatenação de firstname e lastname. O telefone deve priorizar mobilephone, senão phone. O CPF/CNPJ deve ser o campo cnpj.
          `,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    nome: { type: "string" },
                    email: { type: "string" },
                    telefone: { type: "string" },
                    endereco: { type: "string" },
                    cidade: { type: "string" },
                    estado: { type: "string" },
                    cpf_cnpj: { type: "string" }
                  }
                }
              }
            }
          }
        });
        
        console.log('📥 Resposta recebida da API (HubSpot):', response);
        
        // Verificar e definir os resultados
        if (response && Array.isArray(response.results)) {
          console.log('✅ Resultados válidos encontrados:', response.results);
          setResults(response.results);
        } else {
          console.warn('⚠️ Resposta da API em formato inesperado:', response);
          console.log('Estrutura da resposta:', JSON.stringify(response, null, 2));
          setResults([]);
        }
      } else {
        console.log('⚠️ API Key não encontrada, usando dados mock');
        const mockResults = [
          {
            id: "1",
            nome: `${searchTerm} Silva`,
            email: `${searchTerm.toLowerCase()}@example.com`,
            telefone: "(11) 99999-1111",
            endereco: "Av. Paulista, 1000",
            cidade: "São Paulo",
            estado: "SP",
            cpf_cnpj: "123.456.789-00"
          },
          {
            id: "2",
            nome: `Maria ${searchTerm}`,
            email: `maria.${searchTerm.toLowerCase()}@example.com`,
            telefone: "(11) 99999-2222",
            endereco: "Rua Augusta, 500",
            cidade: "São Paulo",
            estado: "SP",
            cpf_cnpj: "987.654.321-00"
          }
        ];
        
        setResults(mockResults);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClient = (client) => {
    onClienteSelected(client);
    setShowResults(false);
    setSearchTerm("");
  };

  return (
    <div className="relative mb-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={apiKey ? "Buscar cliente no HubSpot..." : "Configure API do HubSpot nas configurações"}
            className="w-full pl-9 py-2 border rounded-md"
            onKeyDown={(e) => e.key === 'Enter' && searchClients()}
          />
        </div>
        <Button 
          onClick={searchClients}
          disabled={searchTerm.length < 3 || isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
        </Button>
      </div>
      
      {/* Resultados da busca */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md border shadow-lg z-50 max-h-80 overflow-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : results && results.length > 0 ? (
            <ul>
              {results.map((client, index) => (
                <li 
                  key={client.id || `client-${index}`} 
                  className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                  onClick={() => handleSelectClient(client)}
                >
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{client.nome}</div>
                    <div className="text-sm text-gray-500">
                      {client.email || client.telefone || "Sem contato"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-center text-gray-500">
              {apiKey ? "Nenhum cliente encontrado" : "Configure a API do HubSpot nas configurações"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
