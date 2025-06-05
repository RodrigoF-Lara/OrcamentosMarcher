
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Orcamento } from "@/api/entities";
import { User } from "@/api/entities";
import { Vendedor } from "@/api/entities";
import { Cliente } from "@/api/entities";
import { Produto } from "@/api/entities";
import { Empresa } from "@/api/entities";
import { 
  FileText, 
  Plus, 
  TrendingUp, 
  Calendar, 
  UserCheck,
  ArrowRight,
  Clock,
  Filter,
  Users,
  Package,
  UserCircle as VendedorIcon, // Renomeado para evitar conflito com User da Lucide
  TrendingDown, // Default para etapa
  Building,
  Shield,
  UserCircle,
  AlertCircle,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { etapasFunilConfig, getEtapaFunilInfo } from "../components/funilUtils"; // Caminho corrigido

export default function Dashboard() {
  const [orcamentosBase, setOrcamentosBase] = useState([]); // Lista original sem filtros de dashboard
  const [orcamentosFiltradosDashboard, setOrcamentosFiltradosDashboard] = useState([]); // Lista após filtros do dashboard
  const [usuario, setUsuario] = useState(null);
  const [vendedorLogado, setVendedorLogado] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [empresa, setEmpresa] = useState(null);

  // Dados para filtros de admin
  const [todosVendedores, setTodosVendedores] = useState([]);
  const [todosClientes, setTodosClientes] = useState([]);
  const [todosProdutos, setTodosProdutos] = useState([]);

  // Estado dos filtros
  const [filtroVendedor, setFiltroVendedor] = useState("todos");
  const [filtroCliente, setFiltroCliente] = useState("todos");
  const [filtroProduto, setFiltroProduto] = useState("todos");
  const [filtroEtapaFunil, setFiltroEtapaFunil] = useState("todos"); // Adicionado
  
  const statusBadge = {
    rascunho: { label: "Rascunho", className: "bg-gray-100 text-gray-800" },
    enviado: { label: "Enviado", className: "bg-blue-100 text-blue-800" },
    aprovado: { label: "Aprovado", className: "bg-green-100 text-green-800" },
    rejeitado: { label: "Rejeitado", className: "bg-red-100 text-red-800" }
  };
  
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setIsLoading(true);
      try {
        const [user, empresas] = await Promise.all([
          User.me(),
          Empresa.list()
        ]);
        setUsuario(user);
        if (empresas.length > 0) {
          setEmpresa(empresas[0]);
        }
        
        let vendedorAssociado = null;
        const listaTodosVendedores = await Vendedor.list(); // Carrega todos uma vez
        setTodosVendedores(listaTodosVendedores); // Salva para uso nos filtros e display

        if (user.role !== 'admin') {
          vendedorAssociado = listaTodosVendedores.find(v => v.email && user.email && v.email.toLowerCase() === user.email.toLowerCase());
          setVendedorLogado(vendedorAssociado);
        } else {
          // Admin carrega dados para filtros
          const [clientesData, produtosData] = await Promise.all([
            Cliente.list("nome"),
            Produto.list("nome")
          ]);
          setTodosClientes(clientesData);
          setTodosProdutos(produtosData);
        }
        
        let orcamentosIniciais;
        if (user.role === 'admin') {
          orcamentosIniciais = await Orcamento.list('-created_date'); // Admin vê todos os orçamentos inicialmente
        } else if (vendedorAssociado) {
          orcamentosIniciais = await Orcamento.filter({ vendedor_id: vendedorAssociado.id }, '-created_date');
        } else {
          orcamentosIniciais = [];
        }
        setOrcamentosBase(orcamentosIniciais);
        setOrcamentosFiltradosDashboard(orcamentosIniciais); // Inicialmente, lista filtrada é igual à base
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarDadosIniciais();
  }, []);

  // Aplicar filtros do dashboard (apenas para admin)
  useEffect(() => {
    if (usuario?.role !== 'admin') return;

    let resultado = [...orcamentosBase];

    if (filtroVendedor !== "todos") {
      resultado = resultado.filter(orc => orc.vendedor_id === filtroVendedor);
    }
    if (filtroCliente !== "todos") {
      resultado = resultado.filter(orc => orc.cliente_id === filtroCliente);
    }
    if (filtroProduto !== "todos") {
      resultado = resultado.filter(orc => 
        orc.itens.some(item => item.produto_id === filtroProduto)
      );
    }

    if (filtroEtapaFunil !== "todos") { // Adicionado filtro de etapa
        resultado = resultado.filter(orc => orc.etapa_funil === filtroEtapaFunil);
    }
    setOrcamentosFiltradosDashboard(resultado);
  }, [orcamentosBase, filtroVendedor, filtroCliente, filtroProduto, filtroEtapaFunil, usuario]);

  const getNomeVendedor = (vendedorId) => {
    if (!vendedorId || todosVendedores.length === 0) return "N/A";
    const vendedor = todosVendedores.find(v => v.id === vendedorId);
    return vendedor ? vendedor.nome : "Desconhecido";
  };
  
  const calcularEstatisticas = () => {
    const orcamentosParaEstatisticas = usuario?.role === 'admin' ? orcamentosFiltradosDashboard : orcamentosBase;
    const total = orcamentosParaEstatisticas.length;
    const totalValor = orcamentosParaEstatisticas.reduce((sum, orc) => sum + (orc.valor_total || 0), 0);
    const aprovados = orcamentosParaEstatisticas.filter(orc => orc.status === "aprovado").length;
    const taxaAprovacao = total > 0 ? (aprovados / total * 100).toFixed(1) : 0;
    
    return {
      totalOrcamentos: total,
      totalValor: totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      taxaAprovacao: taxaAprovacao + "%",
      orcamentosHoje: orcamentosParaEstatisticas.filter(orc => {
        const hoje = new Date().toISOString().split('T')[0];
        return orc.created_date?.split('T')[0] === hoje;
      }).length
    };
  };
  
  const estatisticas = calcularEstatisticas(); // Readicionando a chamada da função

  const nomeExibicao = () => {
    if (usuario?.role === 'admin') {
      return usuario?.full_name?.split(' ')[0] || 'Admin';
    }
    if (vendedorLogado) {
      return vendedorLogado.nome?.split(' ')[0] || 'Vendedor';
    }
    return usuario?.full_name?.split(' ')[0] || 'Usuário';
  };

  const listaRecentesParaExibir = usuario?.role === 'admin' ? orcamentosFiltradosDashboard : orcamentosBase;

  return (
    <div className="p-4 pb-16">
      {/* Header com Logo e Info do Usuário */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {empresa?.logo_url ? (
              <img 
                src={empresa.logo_url} 
                alt="Logo da empresa" 
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Olá, {nomeExibicao()} <span className="text-sm font-normal text-gray-500">({usuario?.email})</span>
              </h1>
              <p className="text-gray-600">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>
          {(usuario?.role === 'admin' || vendedorLogado) && (
            <Link to={createPageUrl("NovoOrcamento")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-5 w-5 mr-1" />
                Novo Orçamento
              </Button>
            </Link>
          )}
        </div>
        
        {usuario?.role === 'admin' ? (
          <div className="mt-2 flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm">
            <Shield className="h-4 w-4" />
            <span>Administrador do sistema</span>
          </div>
        ) : vendedorLogado ? (
          <div className="mt-2 flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm">
            <UserCircle className="h-4 w-4" />
            <span>Vendedor: {vendedorLogado.nome}</span>
          </div>
        ) : (
          usuario && usuario.role !== 'admin' && (
            <Link to={createPageUrl("NovoVendedor")} className="mt-2 flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm hover:bg-amber-100 transition-colors">
              <AlertCircle className="h-4 w-4" />
              <span>Complete seu cadastro como vendedor</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          )
        )}
      </div>

      {/* Filtros para Admin */}
      {usuario?.role === 'admin' && (
        <Card className="mb-6 bg-gradient-to-r from-gray-50 to-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Filter className="h-4 w-4 mr-2 text-gray-600" />
              <h3 className="text-sm font-medium text-gray-700">Filtros do Dashboard</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Select value={filtroVendedor} onValueChange={setFiltroVendedor}>
                  <SelectTrigger className="text-xs bg-white">
                    <SelectValue placeholder="Todos Vendedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos" className="text-xs">Todos Vendedores</SelectItem>
                    {todosVendedores.map(v => (
                      <SelectItem key={v.id} value={v.id} className="text-xs">{v.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                  <SelectTrigger className="text-xs bg-white">
                    <SelectValue placeholder="Todos Clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos" className="text-xs">Todos Clientes</SelectItem>
                    {todosClientes.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={filtroProduto} onValueChange={setFiltroProduto}>
                  <SelectTrigger className="text-xs bg-white">
                    <SelectValue placeholder="Todas Máquinas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos" className="text-xs">Todas Máquinas</SelectItem>
                    {todosProdutos.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={filtroEtapaFunil} onValueChange={setFiltroEtapaFunil}>
                  <SelectTrigger className="text-xs bg-white">
                    <SelectValue placeholder="Todas Etapas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos" className="text-xs">Todas Etapas</SelectItem>
                    {Object.keys(etapasFunilConfig).filter(key => key !== 'default').map(key => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {etapasFunilConfig[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Cards de Estatísticas com novo layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-blue-200 rounded-lg">
                <FileText className="h-4 w-4 text-blue-700" />
              </div>
              <p className="text-xs text-blue-700 font-medium ml-2">Total Orçamentos</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">{estatisticas.totalOrcamentos}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-green-200 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-700" />
              </div>
              <p className="text-xs text-green-700 font-medium ml-2">Aprovação</p>
            </div>
            <p className="text-2xl font-bold text-green-900">{estatisticas.taxaAprovacao}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-amber-200 rounded-lg">
                <UserCheck className="h-4 w-4 text-amber-700" />
              </div>
              <p className="text-xs text-amber-700 font-medium ml-2">Faturamento</p>
            </div>
            <p className="text-2xl font-bold text-amber-900">{estatisticas.totalValor}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-purple-200 rounded-lg">
                <Calendar className="h-4 w-4 text-purple-700" />
              </div>
              <p className="text-xs text-purple-700 font-medium ml-2">Criados Hoje</p>
            </div>
            <p className="text-2xl font-bold text-purple-900">{estatisticas.orcamentosHoje}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Orçamentos Recentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-gray-500" />
            Orçamentos Recentes
          </h2>
          <Link to={createPageUrl("Orcamentos")} className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
            Ver todos <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : listaRecentesParaExibir.length > 0 ? (
          <div className="space-y-3">
            {listaRecentesParaExibir.slice(0, 5).map(orcamento => {
              const statusInfoRecente = statusBadge[orcamento.status] || { label: orcamento.status, className: "bg-gray-100 text-gray-800" };
              const etapaInfoRecente = getEtapaFunilInfo(orcamento.etapa_funil);
              return (
              <Link 
                key={orcamento.id} 
                to={createPageUrl(`DetalhesOrcamento?id=${orcamento.id}`)}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {orcamento.cliente_nome}
                          </h3>
                          {orcamento.hubspot_deal_id && (
                            <div className="flex items-center gap-1 bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md text-xs">
                              <Globe className="h-3.5 w-3.5" />
                              <span className="font-mono">#{orcamento.hubspot_deal_id}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(orcamento.created_date), "dd/MM/yyyy")}
                        </div>
                        {usuario?.role === 'admin' && orcamento.vendedor_id && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <VendedorIcon className="h-3 w-3 mr-1" />
                            {getNomeVendedor(orcamento.vendedor_id)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end ml-2">
                        <div className="flex gap-1 mb-1">
                            <Badge className={`${statusInfoRecente.className} text-xs px-1.5 py-0.5`}>
                            {statusInfoRecente.label}
                            </Badge>
                            <Badge className={`${etapaInfoRecente.bgColor} ${etapaInfoRecente.color} text-xs px-1.5 py-0.5 flex items-center gap-1`}>
                                {React.cloneElement(etapaInfoRecente.icon, { className: `h-3 w-3 ${etapaInfoRecente.color}` })}
                                {etapaInfoRecente.label}
                            </Badge>
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">
                          {(orcamento.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-600 mb-4">
                { (filtroCliente !== "todos" || filtroProduto !== "todos" || filtroVendedor !== "todos" || filtroEtapaFunil !== "todos") && usuario?.role === 'admin' ? 
                  "Nenhum orçamento encontrado com os filtros aplicados." :
                  usuario?.role === 'admin' ? "Nenhum orçamento recente encontrado." : 
                  vendedorLogado ? "Você ainda não tem orçamentos recentes." :
                  "Nenhum orçamento para exibir."
                }
              </p>
              {(usuario?.role === 'admin' || vendedorLogado) && (
                (filtroCliente === "todos" && filtroProduto === "todos" && filtroVendedor === "todos" && filtroEtapaFunil === "todos") && (
                   <Link to={createPageUrl("NovoOrcamento")}>
                     <Button variant="outline">Criar primeiro orçamento</Button>
                   </Link>
                )
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
