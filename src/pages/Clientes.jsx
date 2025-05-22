
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Cliente } from "@/api/entities";
import { 
  Plus, 
  Search, 
  Users, 
  FileText, 
  Edit, 
  User,
  ArrowDown,
  ArrowUp,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ImportarClientesCSV from "../components/clientes/ImportarClientesCSV"; // Adicionado

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [ordenacao, setOrdenacao] = useState("nome-asc");
  const [showImportModal, setShowImportModal] = useState(false); // Adicionado
  
  useEffect(() => {
    carregarClientes();
  }, []);
  
  const carregarClientes = async () => {
    setIsLoading(true);
    try {
      const listaClientes = await Cliente.list("nome");
      setClientes(listaClientes);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const aplicarFiltros = () => {
    let resultado = [...clientes];
    
    // Filtro de pesquisa
    if (pesquisa) {
      const termoPesquisa = pesquisa.toLowerCase();
      resultado = resultado.filter(cliente => 
        cliente.nome?.toLowerCase().includes(termoPesquisa) ||
        cliente.telefone?.toLowerCase().includes(termoPesquisa) ||
        cliente.email?.toLowerCase().includes(termoPesquisa)
      );
    }
    
    // Ordenação
    if (ordenacao === "nome-asc") {
      resultado.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    } else if (ordenacao === "nome-desc") {
      resultado.sort((a, b) => (b.nome || "").localeCompare(a.nome || ""));
    } else if (ordenacao === "criado-desc") {
      resultado.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (ordenacao === "criado-asc") {
      resultado.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    }
    
    return resultado;
  };
  
  const alternarOrdenacao = () => {
    if (ordenacao === "nome-asc") setOrdenacao("nome-desc");
    else if (ordenacao === "nome-desc") setOrdenacao("criado-desc");
    else if (ordenacao === "criado-desc") setOrdenacao("criado-asc");
    else setOrdenacao("nome-asc");
  };
  
  const handleImportComplete = () => {
    setShowImportModal(false);
    carregarClientes(); // Recarregar lista de clientes após importação
  };
  
  const clientesFiltrados = aplicarFiltros();
  
  return (
    <div className="p-4 pb-16">
      {/* Barra de ações */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 mr-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar cliente..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={alternarOrdenacao}
          title={
            ordenacao === "nome-asc" ? "Nome (A-Z)" :
            ordenacao === "nome-desc" ? "Nome (Z-A)" :
            ordenacao === "criado-desc" ? "Mais recentes" :
            "Mais antigos"
          }
        >
          {ordenacao.includes("asc") ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowImportModal(true)}
          title="Importar Clientes via CSV"
          className="ml-2"
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Link to={createPageUrl("NovoCliente")} className="ml-2">
          <Button size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      {/* Lista de clientes */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : clientesFiltrados.length > 0 ? (
        <div className="space-y-3">
          {clientesFiltrados.map(cliente => (
            <Link 
              key={cliente.id} 
              to={createPageUrl(`EditarCliente?id=${cliente.id}`)}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">{cliente.nome}</h3>
                        <div className="flex flex-col text-sm text-gray-500 mt-1">
                          <div className="flex flex-wrap items-center">
                            {cliente.telefone && (
                              <div className="flex items-center mr-3">
                                <Phone className="h-3 w-3 mr-1" />
                                {cliente.telefone}
                              </div>
                            )}
                            {cliente.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {cliente.email}
                              </div>
                            )}
                          </div>
                          {(cliente.cidade || cliente.estado) && (
                            <div className="flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                              <span className="text-xs">
                                {cliente.cidade}{cliente.cidade && cliente.estado ? " - " : ""}{cliente.estado}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Edit className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Users className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-600 mb-4">
              {pesquisa ? 
                "Nenhum cliente encontrado com os filtros aplicados" :
                "Você ainda não tem clientes cadastrados"}
            </p>
            {pesquisa ? (
              <Button variant="outline" onClick={() => setPesquisa("")}>Limpar pesquisa</Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Link to={createPageUrl("NovoCliente")}>
                  <Button>Cadastrar primeiro cliente</Button>
                </Link>
                <Button variant="outline" onClick={() => setShowImportModal(true)}>
                  <FileText className="h-4 w-4 mr-2" /> Importar via CSV
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Importação CSV */}
      <ImportarClientesCSV
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
