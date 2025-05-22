
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Produto } from "@/api/entities";
import { 
  Plus, 
  Search, 
  Package, 
  Edit, 
  ArrowDown,
  ArrowUp,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import ImportarProdutosCSV from "../components/produtos/ImportarProdutosCSV"; 

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [ordenacao, setOrdenacao] = useState("nome-asc");
  const [showImportModal, setShowImportModal] = useState(false);
  
  useEffect(() => {
    carregarProdutos();
  }, []);
  
  const carregarProdutos = async () => {
    setIsLoading(true);
    try {
      const listaProdutos = await Produto.list("nome");
      setProdutos(listaProdutos);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const aplicarFiltros = () => {
    let resultado = [...produtos];
    
    // Filtro de pesquisa
    if (pesquisa) {
      const termoPesquisa = pesquisa.toLowerCase();
      resultado = resultado.filter(produto => 
        produto.nome?.toLowerCase().includes(termoPesquisa) ||
        produto.codigo?.toLowerCase().includes(termoPesquisa) ||
        produto.descricao?.toLowerCase().includes(termoPesquisa)
      );
    }
    
    // Ordenação
    if (ordenacao === "nome-asc") {
      resultado.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    } else if (ordenacao === "nome-desc") {
      resultado.sort((a, b) => (b.nome || "").localeCompare(a.nome || ""));
    } else if (ordenacao === "preco-asc") {
      resultado.sort((a, b) => (a.preco || 0) - (b.preco || 0));
    } else if (ordenacao === "preco-desc") {
      resultado.sort((a, b) => (b.preco || 0) - (a.preco || 0));
    }
    
    return resultado;
  };
  
  const alternarOrdenacao = () => {
    if (ordenacao === "nome-asc") setOrdenacao("nome-desc");
    else if (ordenacao === "nome-desc") setOrdenacao("preco-asc");
    else if (ordenacao === "preco-asc") setOrdenacao("preco-desc");
    else setOrdenacao("nome-asc");
  };
  
  const handleImportComplete = () => {
    setShowImportModal(false);
    carregarProdutos(); // Recarregar lista de produtos após importação
  };

  const produtosFiltrados = aplicarFiltros();
  
  return (
    <div className="p-4 pb-16">
      {/* Barra de ações */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar produto..."
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
            ordenacao === "preco-asc" ? "Preço (menor)" :
            "Preço (maior)"
          }
        >
          {ordenacao.includes("asc") ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowImportModal(true)}
          title="Importar Produtos via CSV" // Título ajustado
        >
          <FileText className="h-4 w-4" /> {/* Ícone para CSV */}
        </Button>
        <Link to={createPageUrl("NovoProduto")}>
          <Button size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      {/* Lista de produtos */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : produtosFiltrados.length > 0 ? (
        <div className="space-y-3">
          {produtosFiltrados.map(produto => (
            <Link 
              key={produto.id} 
              to={createPageUrl(`EditarProduto?id=${produto.id}`)}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
                        {produto.imagem_url ? (
                          <img 
                            src={produto.imagem_url} 
                            alt={produto.nome}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">{produto.nome}</h3>
                        {produto.codigo && (
                          <p className="text-sm text-gray-500">Cód: {produto.codigo}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">
                        {(produto.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <Edit className="h-4 w-4 text-gray-400 mt-1 ml-auto" />
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
            <Package className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-600 mb-4">
              {pesquisa ? 
                "Nenhum produto encontrado com os filtros aplicados" :
                "Você ainda não tem produtos cadastrados"}
            </p>
            {pesquisa ? (
              <Button variant="outline" onClick={() => setPesquisa("")}>Limpar pesquisa</Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Link to={createPageUrl("NovoProduto")}>
                  <Button>Cadastrar primeiro produto</Button>
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
      <ImportarProdutosCSV
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
