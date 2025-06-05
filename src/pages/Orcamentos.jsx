
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Orcamento } from "@/api/entities";
import { User } from "@/api/entities";
import { Vendedor } from "@/api/entities";
import { 
  Plus, 
  Search, 
  Filter, 
  X,
  Download,
  Share2,
  FileText,
  ArrowDown,
  ArrowUp,
  TrendingDown,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { etapasFunilConfig, getEtapaFunilInfo } from "@/components/funilUtils";

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState({
    status: "todos",
    etapa_funil: "todos",
    ordenacao: "mais_recentes"
  });
  const [vendedorLogado, setVendedorLogado] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState(null);

  const statusBadge = {
    rascunho: { label: "Rascunho", className: "bg-gray-100 text-gray-800" },
    enviado: { label: "Enviado", className: "bg-blue-100 text-blue-800" },
    aprovado: { label: "Aprovado", className: "bg-green-100 text-green-800" },
    rejeitado: { label: "Rejeitado", className: "bg-red-100 text-red-800" }
  };

  const carregarOrcamentos = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setUsuarioAtual(user);
      setIsAdmin(user.role === 'admin');
      
      let vendedorAssociado = null;
      if (user.role !== 'admin') {
        try {
          const todosVendedores = await Vendedor.list();
          vendedorAssociado = todosVendedores.find(v => v.email && user.email && v.email.toLowerCase() === user.email.toLowerCase());
          setVendedorLogado(vendedorAssociado);
        } catch (err) {
          console.warn("Erro ao buscar vendedor associado:", err);
        }
      }
      
      let listaOrcamentos;
      if (user.role === 'admin') {
        listaOrcamentos = await Orcamento.list('-created_date');
      } else if (vendedorAssociado) {
        listaOrcamentos = await Orcamento.filter({ vendedor_id: vendedorAssociado.id }, '-created_date');
      } else {
        listaOrcamentos = [];
      }
      
      setOrcamentos(listaOrcamentos);
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
      alert("Erro ao carregar orçamentos. Por favor, recarregue a página.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarOrcamentos();
  }, []);
  
  const aplicarFiltros = () => {
    let resultado = [...orcamentos];
    
    if (pesquisa) {
      const termoPesquisa = pesquisa.toLowerCase();
      resultado = resultado.filter(orcamento => 
        orcamento.cliente_nome?.toLowerCase().includes(termoPesquisa)
      );
    }
    
    if (filtros.status !== "todos") {
      resultado = resultado.filter(orcamento => orcamento.status === filtros.status);
    }

    if (filtros.etapa_funil !== "todos") {
      resultado = resultado.filter(orcamento => orcamento.etapa_funil === filtros.etapa_funil);
    }
    
    if (filtros.ordenacao === "mais_recentes") {
      resultado.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (filtros.ordenacao === "mais_antigos") {
      resultado.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    } else if (filtros.ordenacao === "maior_valor") {
      resultado.sort((a, b) => (b.valor_total || 0) - (a.valor_total || 0));
    } else if (filtros.ordenacao === "menor_valor") {
      resultado.sort((a, b) => (a.valor_total || 0) - (b.valor_total || 0));
    }
    
    return resultado;
  };
  
  const limparFiltros = () => {
    setPesquisa("");
    setFiltros({
      status: "todos",
      etapa_funil: "todos",
      ordenacao: "mais_recentes"
    });
    setMostrarFiltros(false);
  };
  
  const orcamentosFiltrados = aplicarFiltros();
  
  return (
    <div className="p-4 pb-16">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Meus Orçamentos
          <span className="text-sm text-gray-500 ml-2">({orcamentosFiltrados.length} encontrados)</span>
        </h1>
        <div className="flex items-center gap-2">
            <Button 
                variant={mostrarFiltros ? "default" : "outline"}
                size="sm"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={mostrarFiltros ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
                <Filter className="h-4 w-4 mr-1" />
                Filtros
            </Button>
            {(isAdmin || vendedorLogado) && (
                <Link to={createPageUrl("NovoOrcamento")}>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-1" />
                        Novo
                    </Button>
                </Link>
            )}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-md mb-4 text-sm flex items-center">
          <span>Visualizando como administrador</span>
        </div>
      )}
      {vendedorLogado && !isAdmin && (
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md mb-4 text-sm flex items-center">
          <span>Vendedor: <strong>{vendedorLogado.nome}</strong></span>
        </div>
      )}
    
      {/* Barra de Pesquisa - movida para baixo dos botões principais, antes dos filtros */}
      <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar orçamento por cliente..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="pl-8"
          />
        </div>
      
      {mostrarFiltros && (
        <Card className="mb-4 border border-blue-100 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Filtros Avançados</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={limparFiltros}
                className="h-8 text-xs"
              >
                Limpar
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Status</label>
                <Select 
                  value={filtros.status} 
                  onValueChange={(valor) => setFiltros({...filtros, status: valor})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Etapa do Funil</label>
                <Select 
                  value={filtros.etapa_funil} 
                  onValueChange={(valor) => setFiltros({...filtros, etapa_funil: valor})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas Etapas</SelectItem>
                    {Object.keys(etapasFunilConfig).filter(key => key !== 'default').map(key => (
                      <SelectItem key={key} value={key}>
                        {etapasFunilConfig[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Ordenar por</label>
                <Select 
                  value={filtros.ordenacao} 
                  onValueChange={(valor) => setFiltros({...filtros, ordenacao: valor})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mais recentes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mais_recentes">Mais recentes</SelectItem>
                    <SelectItem value="mais_antigos">Mais antigos</SelectItem>
                    <SelectItem value="maior_valor">Maior valor</SelectItem>
                    <SelectItem value="menor_valor">Menor valor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : orcamentosFiltrados.length > 0 ? (
        <div className="space-y-3">
          {orcamentosFiltrados.map(orcamento => {
            const statusInfo = statusBadge[orcamento.status] || { label: orcamento.status, className: "bg-gray-100 text-gray-800" };
            const etapaInfoCard = getEtapaFunilInfo(orcamento.etapa_funil);
            return (
              <Link 
                key={orcamento.id} 
                to={createPageUrl(`DetalhesOrcamento?id=${orcamento.id}`)}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1">
                          <h3 className="font-medium text-gray-900">{orcamento.cliente_nome}</h3>
                          {orcamento.hubspot_deal_id && (
                            <div className="flex items-center gap-1 bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md text-xs">
                              <Globe className="h-3.5 w-3.5" />
                              <span className="font-mono">#{orcamento.hubspot_deal_id}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                          <span>
                            {format(new Date(orcamento.created_date), "dd/MM/yyyy")}
                          </span>
                          <Badge className={`${statusInfo.className} text-xs`}>
                            {statusInfo.label}
                          </Badge>
                          <Badge className={`${etapaInfoCard.bgColor} ${etapaInfoCard.color} text-xs flex items-center gap-1`}>
                            {React.cloneElement(etapaInfoCard.icon, { className: `h-3 w-3 ${etapaInfoCard.color}` })}
                            {etapaInfoCard.label}
                          </Badge>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {(orcamento.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="text-center">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <FileText className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-600 mb-4">
              {pesquisa || filtros.status !== "todos" ? 
                "Nenhum orçamento encontrado com os filtros aplicados" :
                (isAdmin ? "Nenhum orçamento cadastrado no sistema." : 
                 vendedorLogado ? "Você ainda não tem orçamentos cadastrados." :
                 "Nenhum orçamento para exibir. Complete seu cadastro de vendedor se aplicável.")
              }
            </p>
             {pesquisa || filtros.status !== "todos" ? (
              <Button variant="outline" onClick={limparFiltros}>Limpar filtros</Button>
            ) : (
              (isAdmin || vendedorLogado) && (
                <Link to={createPageUrl("NovoOrcamento")}>
                  <Button>Criar primeiro orçamento</Button>
                </Link>
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
