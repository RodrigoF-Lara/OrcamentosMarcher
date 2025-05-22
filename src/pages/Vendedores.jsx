
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Vendedor } from "@/api/entities";
import { User } from "@/api/entities"; // Adicionado
import { 
  Plus, 
  Search, 
  UserCircle, 
  Mail, 
  Phone,
  Shield,
  AlertTriangle,
  ArrowLeft,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export default function Vendedores() {
  const [vendedores, setVendedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Para armazenar o objeto User completo
  const [vendedorDoUsuarioLogado, setVendedorDoUsuarioLogado] = useState(null); // Para o perfil do vendedor logado
  
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        setIsAdmin(user.role === 'admin');
        
        const listaTodosVendedores = await Vendedor.list("nome");
        
        if (user.role === 'admin') {
          setVendedores(listaTodosVendedores);
        } else {
          // Se não é admin, tenta encontrar o perfil de vendedor associado ao email do usuário logado
          const vendedorLogado = listaTodosVendedores.find(v => 
            v.email && user.email && v.email.toLowerCase() === user.email.toLowerCase()
          );
          setVendedorDoUsuarioLogado(vendedorLogado);
          // A lista de vendedores para exibir será apenas ele mesmo, ou vazia se não for encontrado (tratado no render)
        }
      } catch (error) {
        console.error("Erro ao carregar dados da página de vendedores:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarDadosIniciais();
  }, []);
  
  const vendedoresFiltradosParaAdmin = () => {
    if (!isAdmin) return []; // Não-admins não usam esta função para filtrar a lista geral
    if (!pesquisa) return vendedores;
    
    const termoPesquisa = pesquisa.toLowerCase();
    return vendedores.filter(vendedor => 
      vendedor.nome?.toLowerCase().includes(termoPesquisa) ||
      vendedor.email?.toLowerCase().includes(termoPesquisa) ||
      vendedor.telefone?.includes(termoPesquisa)
    );
  };
  
  // Se estiver carregando, mostrar spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Lógica de exibição para não-admin (vendedor)
  if (!isAdmin) {
    if (vendedorDoUsuarioLogado) {
      // Mostrar o perfil do vendedor logado
      return (
        <div className="p-4 pb-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil de Vendedor</h1>
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {/* ... foto e dados do vendedorDoUsuarioLogado ... */}
                   <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    {vendedorDoUsuarioLogado.foto_url ? (
                        <img 
                        src={vendedorDoUsuarioLogado.foto_url} 
                        alt={vendedorDoUsuarioLogado.nome}
                        className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <UserCircle className="h-8 w-8 text-blue-600" />
                    )}
                    </div>
                    <div>
                    <h2 className="text-xl font-semibold">{vendedorDoUsuarioLogado.nome}</h2>
                    <p className="text-gray-600">{vendedorDoUsuarioLogado.cargo || "Vendedor"}</p>
                    
                    <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {vendedorDoUsuarioLogado.email}
                        </div>
                        {vendedorDoUsuarioLogado.telefone && (
                        <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {vendedorDoUsuarioLogado.telefone}
                        </div>
                        )}
                    </div>
                    </div>
                </div>
                <Link to={createPageUrl(`EditarVendedor?id=${vendedorDoUsuarioLogado.id}`)}>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          <div className="bg-blue-50 p-4 rounded-md text-blue-800">
            <p className="text-sm">
              Como vendedor, você tem acesso apenas aos orçamentos atribuídos a você.
              Seus dados de perfil serão exibidos nos orçamentos que criar.
            </p>
          </div>
        </div>
      );
    } else {
      // Não é admin e não tem perfil de vendedor, mostrar mensagem para se cadastrar
      return (
        <div className="p-4 pb-16">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Complete seu Cadastro</h2>
            <p className="text-gray-600 mb-4">
              Para acessar todas as funcionalidades, por favor, complete seu cadastro como vendedor.
            </p>
            <Link to={createPageUrl("NovoVendedor")}>
              <Button>Cadastrar como Vendedor</Button>
            </Link>
          </div>
        </div>
      );
    }
  }
  
  // Lógica de exibição para admin (lista de todos os vendedores)
  const listaExibicaoAdmin = vendedoresFiltradosParaAdmin();
  return (
    <div className="p-4 pb-16">
      {/* Cabeçalho com mensagem de admin */}
      <div className="flex items-center gap-2 mb-4 bg-purple-50 text-purple-800 px-4 py-2 rounded-md">
        <Shield className="h-5 w-5" />
        <p className="text-sm font-medium">Você está visualizando como administrador</p>
      </div>
      
      {/* Barra de ações */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 mr-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar vendedor..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="pl-8"
          />
        </div>
        <Link to={createPageUrl("NovoVendedor")}>
          <Button size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      {/* Lista de vendedores para admin */}
      {listaExibicaoAdmin.length > 0 ? (
        <div className="space-y-3">
          {listaExibicaoAdmin.map(vendedor => (
            <Link 
              key={vendedor.id} 
              to={createPageUrl(`EditarVendedor?id=${vendedor.id}`)}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        {vendedor.foto_url ? (
                          <img 
                            src={vendedor.foto_url} 
                            alt={vendedor.nome}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">{vendedor.nome}</h3>
                        <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1">
                          <div className="flex items-center mr-3">
                            <Mail className="h-3 w-3 mr-1" />
                            {vendedor.email}
                          </div>
                          {vendedor.telefone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {vendedor.telefone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {vendedor.cargo && (
                        <span className="text-sm text-gray-600 mr-2">{vendedor.cargo}</span>
                      )}
                      <Edit className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <UserCircle className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-600 mb-4">
              {pesquisa ? 
                "Nenhum vendedor encontrado com os filtros aplicados" :
                "Nenhum vendedor cadastrado ainda"}
            </p>
            {pesquisa ? (
              <Button variant="outline" onClick={() => setPesquisa("")}>Limpar pesquisa</Button>
            ) : (
              <Link to={createPageUrl("NovoVendedor")}>
                <Button>Cadastrar primeiro vendedor</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
