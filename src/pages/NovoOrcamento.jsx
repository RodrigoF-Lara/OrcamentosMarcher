
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Orcamento } from "@/api/entities";
import { Cliente } from "@/api/entities";
import { Produto } from "@/api/entities";
import { Vendedor } from "@/api/entities";
import { Empresa } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Import Label
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  UserPlus, 
  Plus, 
  Trash, 
  Save, 
  ArrowLeft,
  Calculator,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

import ItemOrcamento from "../components/orcamentos/ItemOrcamento";
import ClienteCombobox from "../components/orcamentos/ClienteCombobox";
import { User } from "@/api/entities";
import { etapasFunilConfig, getEtapaFunilInfo } from "../components/funilUtils";

export default function NovoOrcamento() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [vendedorLogado, setVendedorLogado] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [orcamento, setOrcamento] = useState({
    cliente_id: "",
    cliente_nome: "",
    cliente_email_snapshot: "",
    cliente_telefone_snapshot: "",
    cliente_codigo_pais_telefone_snapshot: "+55",
    vendedor_id: "",
    vendedor_nome: "",
    empresa_id: "",
    empresa_nome: "",
    data: format(new Date(), "yyyy-MM-dd"),
    validade: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    itens: [],
    observacoes: "",
    valor_total: 0,
    status: "rascunho",
    etapa_funil: "frio",
    motivo_perda: ""
  });
  
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setIsAdmin(user.role === 'admin');
        
        const [clientesData, produtosData, todosVendedores, empresasData] = await Promise.all([
          Cliente.list("nome"),
          Produto.list("nome"),
          Vendedor.list("nome"),
          Empresa.list("nome")
        ]);
        
        setClientes(clientesData);
        setProdutos(produtosData);
        setEmpresas(empresasData);

        if (user.role === 'admin') {
          setVendedores(todosVendedores);
        } else {
          const vendedorDoUsuario = todosVendedores.find(v => 
            v.email && user.email && v.email.toLowerCase() === user.email.toLowerCase()
          );
          
          if (vendedorDoUsuario) {
            setVendedorLogado(vendedorDoUsuario);
            setOrcamento(prev => ({
              ...prev,
              vendedor_id: vendedorDoUsuario.id,
              vendedor_nome: vendedorDoUsuario.nome
            }));
          } else {
            console.warn("Usuário não admin sem perfil de vendedor associado tentando criar orçamento.");
          }
        }
        
        if (empresasData.length === 1) {
          setOrcamento(prev => ({
            ...prev,
            empresa_id: empresasData[0].id,
            empresa_nome: empresasData[0].nome
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar dados para novo orçamento:", error);
      } finally {
        setIsLoading(false);
      }
    };
    carregarDadosIniciais();
  }, []);
  
  const handleChange = (campo, valor) => {
    setOrcamento(prev => {
      const newState = {...prev, [campo]: valor};
      // Se a etapa do funil não for "perdido", limpar motivo_perda
      if (campo === "etapa_funil" && valor !== "perdido") {
        newState.motivo_perda = "";
      }
      return newState;
    });
        
    if (campo === "vendedor_id") {
      const vendedorSelecionado = vendedores.find(v => v.id === valor);
      if (vendedorSelecionado) {
        setOrcamento(prev => ({
          ...prev,
          vendedor_nome: vendedorSelecionado.nome
        }));
      }
    }
    
    if (campo === "empresa_id") {
      const empresaSelecionada = empresas.find(e => e.id === valor);
      if (empresaSelecionada) {
        setOrcamento(prev => ({
          ...prev,
          empresa_nome: empresaSelecionada.nome
        }));
      }
    }
  };

  const handleClienteChange = (clienteId) => {
    const clienteSelecionado = clientes.find(c => c.id === clienteId);
    if (clienteSelecionado) {
      setOrcamento(prev => ({
        ...prev,
        cliente_id: clienteSelecionado.id,
        cliente_nome: clienteSelecionado.nome,
        cliente_email: clienteSelecionado.email || "",
        cliente_email_snapshot: clienteSelecionado.email || "",
        cliente_telefone_snapshot: clienteSelecionado.telefone || "",
        cliente_codigo_pais_telefone_snapshot: clienteSelecionado.codigo_pais_telefone || "+55",
        cliente_cpf_cnpj_snapshot: clienteSelecionado.cpf_cnpj || "",
        cliente_endereco_snapshot: clienteSelecionado.endereco || "",
        cliente_cidade_snapshot: clienteSelecionado.cidade || "",
        cliente_estado_snapshot: clienteSelecionado.estado || "",
      }));
    } else {
      setOrcamento(prev => ({
        ...prev,
        cliente_id: "",
        cliente_nome: "",
        cliente_email: "",
        cliente_email_snapshot: "",
        cliente_telefone_snapshot: "",
        cliente_codigo_pais_telefone_snapshot: "+55",
        cliente_cpf_cnpj_snapshot: "",
        cliente_endereco_snapshot: "",
        cliente_cidade_snapshot: "",
        cliente_estado_snapshot: "",
      }));
    }
  };
  
  const handleClienteHubspotSelected = (clienteData) => {
    if (!clienteData || typeof clienteData !== 'object') {
      console.warn("Dados inválidos do cliente HubSpot");
      return;
    }
    
    const existingClient = clientes.find(c => 
      (clienteData.email && c.email === clienteData.email) || 
      (clienteData.cpf_cnpj && c.cpf_cnpj === clienteData.cpf_cnpj)
    );
    
    if (existingClient) {
      handleChange("cliente_id", existingClient.id);
    } else {
      setOrcamento(prev => ({
        ...prev,
        cliente_nome: clienteData.nome || ""
      }));
    }
  };

  const adicionarItem = () => {
    if (produtos.length === 0) return;
    
    const novoProduto = produtos[0]; // Produto padrão
    const novoItem = {
      produto_id: novoProduto.id,
      produto_nome: novoProduto.nome,
      quantidade: 1,
      preco_unitario: novoProduto.preco || 0,
      desconto_percentual_1: 0,
      desconto_percentual_2: 0,
      desconto_percentual_3: 0,
      desconto_percentual_4: 0,
      desconto_percentual_5: 0,
      desconto_valor: 0,
      desconto_efetivo: 0,
      valor_final: novoProduto.preco || 0,
      custo_mp_item_total: (novoProduto.custo_mp !== undefined) ? (novoProduto.custo_mp * 1) : 0 // Cálculo inicial
    };
    
    setOrcamento(prev => {
      const novosItens = [...prev.itens, novoItem];
      const novoValorTotal = calcularTotal(novosItens);
      return {
        ...prev,
        itens: novosItens,
        valor_total: novoValorTotal
      };
    });
  };
  
  const removerItem = (index) => {
    setOrcamento(prev => {
      const novosItens = prev.itens.filter((_, i) => i !== index);
      return {
        ...prev,
        itens: novosItens,
        valor_total: calcularTotal(novosItens)
      };
    });
  };
  
  const atualizarItem = (index, itemAtualizado) => {    
    setOrcamento(prev => {
      const novosItens = [...prev.itens];
      // O itemAtualizado já virá com custo_mp_item_total calculado pelo ItemOrcamento
      novosItens[index] = itemAtualizado; 
      
      const novoValorTotal = novosItens.reduce((total, item) => {
        return total + (parseFloat(item.valor_final) || 0);
      }, 0);
      
      return {
        ...prev,
        itens: novosItens,
        valor_total: novoValorTotal
      };
    });
  };
  
  const calcularTotal = (itens) => {
    return itens.reduce((soma, item) => soma + (item.valor_final || 0), 0);
  };

  const gerarNumeroOrcamento = async () => {
    try {
      const anoMes = format(new Date(), "yyyyMM");
      const orcamentosMes = await Orcamento.list();
      
      const orcamentosNumero = orcamentosMes
        .filter(orc => orc.numero?.startsWith(anoMes))
        .map(orc => parseInt(orc.numero.substring(6)))
        .sort((a, b) => b - a);
      
      const ultimoNumero = orcamentosNumero[0] || 0;
      const novoNumero = `${anoMes}${String(ultimoNumero + 1).padStart(4, '0')}`;
      
      return novoNumero;
    } catch (error) {
      console.error("Erro ao gerar número do orçamento:", error);
      return `${format(new Date(), "yyyyMM")}0001`;
    }
  };
  
  const salvarOrcamento = async () => {
    if (!orcamento.cliente_id) {
      alert("Por favor, selecione um cliente");
      return;
    }
    
    if (orcamento.itens.length === 0) {
      alert("Adicione pelo menos um item ao orçamento");
      return;
    }

    if (!orcamento.vendedor_id && (isAdmin || vendedorLogado) ) {
        alert("Por favor, selecione um vendedor ou associe sua conta a um perfil de vendedor.");
        return;
    }
    
    if (orcamento.etapa_funil === "perdido" && !orcamento.motivo_perda?.trim()) {
        alert("Por favor, informe o motivo da perda para esta etapa do funil.");
        return;
    }
    
    const valorTotalFinal = calcularTotal(orcamento.itens);
    
    setIsSaving(true);
    try {
      const numeroOrcamento = await gerarNumeroOrcamento();
      
      const payload = {
        ...orcamento,
        numero: numeroOrcamento,
        valor_total: valorTotalFinal
      };
      // Garantir que motivo_perda só seja enviado se a etapa for "perdido"
      if (payload.etapa_funil !== "perdido") {
        delete payload.motivo_perda;
      }

      await Orcamento.create(payload);
      
      navigate(createPageUrl("Orcamentos"));
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      alert("Erro ao salvar orçamento. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const calcularMC1OrcamentoCompleto = () => {
    // Apenas para exibição
    if (orcamento.itens.length === 0) return "N/A";

    // Garante que apenas admins ou o vendedor logado vejam o MC1
    if (!isAdmin && (!vendedorLogado || orcamento.vendedor_id !== vendedorLogado.id)) return "N/A";

    const somaCustoMpTotalItens = orcamento.itens.reduce((soma, item) => {
        // Se custo_mp_item_total está no item, usa ele.
        // Senão, tenta calcular (caso de item adicionado antes da lógica estar 100% no ItemOrcamento)
        let custoItem = item.custo_mp_item_total;
        if (custoItem === undefined) {
            const produtoDoItem = produtos.find(p => p.id === item.produto_id);
            if (produtoDoItem && produtoDoItem.custo_mp !== undefined) {
                custoItem = (produtoDoItem.custo_mp || 0) * (item.quantidade || 1);
            } else {
                custoItem = 0;
            }
        }
        return soma + (custoItem || 0);
    }, 0);

    const somaValorFinalTotalItens = orcamento.valor_total || 0;
    const receitaLiquidaEstimadaOrcamento = somaValorFinalTotalItens * 0.9;

    if (receitaLiquidaEstimadaOrcamento <= 0 || somaCustoMpTotalItens < 0) return "N/A";

    const mc1 = (((somaCustoMpTotalItens / receitaLiquidaEstimadaOrcamento) - 1) * -1) * 100;
    return `${mc1.toFixed(2)}%`;
  };

  const etapaInfo = getEtapaFunilInfo(orcamento.etapa_funil);

  return (
    <div className="p-4 pb-16">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate(createPageUrl("Orcamentos"))}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar
      </Button>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Cliente
                  </label>
                  <div className="flex gap-2">
                    <ClienteCombobox
                      clientes={clientes}
                      value={orcamento.cliente_id}
                      onChange={handleClienteChange}
                      placeholder="Selecione ou digite para buscar..."
                    />
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(createPageUrl("NovoCliente"))}
                      title="Novo cliente"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Vendedor
                  </label>
                  {isAdmin ? (
                    <Select 
                      value={orcamento.vendedor_id} 
                      onValueChange={(value) => {
                        const vendSel = vendedores.find(v => v.id === value);
                        handleChange("vendedor_id", value);
                        handleChange("vendedor_nome", vendSel ? vendSel.nome : "");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um vendedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendedores.map(v => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : vendedorLogado ? (
                    <div className="bg-gray-100 border rounded-md px-3 py-2 text-gray-700">
                      {vendedorLogado.nome}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 text-yellow-700 text-sm">
                      Perfil de vendedor não encontrado para sua conta.
                    </div>
                  )}
                </div>
                
                {empresas.length > 1 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Empresa
                    </label>
                    <Select 
                      value={orcamento.empresa_id} 
                      onValueChange={(value) => handleChange("empresa_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas.map(empresa => (
                          <SelectItem key={empresa.id} value={empresa.id}>
                            {empresa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Data
                    </label>
                    <Input
                      type="date"
                      value={orcamento.data}
                      onChange={(e) => handleChange("data", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Validade
                    </label>
                    <Input
                      type="date"
                      value={orcamento.validade}
                      onChange={(e) => handleChange("validade", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Etapa do Funil
                    </label>
                    <Select 
                      value={orcamento.etapa_funil} 
                      onValueChange={(value) => handleChange("etapa_funil", value)}
                    >
                      <SelectTrigger className={`border-2 ${etapaInfo.borderColor || 'border-gray-300'} ${etapaInfo.textColor}`}>
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(etapasFunilConfig).filter(key => key !== 'default').map(key => {
                          const config = etapasFunilConfig[key];
                          return (
                            <SelectItem key={key} value={key} className={`${config.textColor} hover:${config.bgColor}`}>
                              <div className="flex items-center gap-2">
                                {React.cloneElement(config.icon, { className: `h-4 w-4 ${config.color}` })}
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {orcamento.etapa_funil === "perdido" && (
                      <div className="mt-2">
                        <Label htmlFor="motivo_perda" className="text-sm font-medium text-gray-700 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />
                          Motivo da Perda
                        </Label>
                        <Textarea
                          id="motivo_perda"
                          placeholder="Descreva o motivo pelo qual o orçamento foi perdido..."
                          value={orcamento.motivo_perda}
                          onChange={(e) => handleChange("motivo_perda", e.target.value)}
                          rows={2}
                          className="mt-1 border-yellow-400 focus:border-yellow-500"
                        />
                      </div>
                    )}
                  </div>

              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Itens</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={adicionarItem}
                  disabled={produtos.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar item
                </Button>
              </div>
              
              {orcamento.itens.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  Clique em "Adicionar item" para incluir produtos
                </div>
              ) : (
                <div className="space-y-3">
                  {orcamento.itens.map((item, index) => (
                    <ItemOrcamento
                      key={index}
                      item={item}
                      index={index}
                      produtos={produtos}
                      atualizarItem={atualizarItem}
                      removerItem={removerItem}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mb-4">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Observações
              </label>
              <Textarea
                placeholder="Informe condições de pagamento, prazos de entrega ou outras informações relevantes..."
                value={orcamento.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
          
           <div className="sticky bottom-16 bg-white border-t p-4 rounded-t-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Orçamento</p>
                  <p className="text-xl font-bold">
                    {(orcamento.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  {(() => {
                    const valorBaseTodos = orcamento.itens?.reduce((total, item) => {
                      const valorBase = (item.quantidade || 1) * (item.preco_unitario || 0);
                      return total + valorBase;
                    }, 0) || 0;
                    
                    const descontoTotalValor = valorBaseTodos - (orcamento.valor_total || 0);
                    
                    const descontoTotalPerc = valorBaseTodos > 0 ? (descontoTotalValor / valorBaseTodos) * 100 : 0;
                    
                    if (descontoTotalValor > 0) {
                      return (
                        <p className="text-sm text-green-600">
                          Desconto: {descontoTotalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          {' '}({descontoTotalPerc.toFixed(2)}%)
                        </p>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              </div>
              <Button 
                onClick={salvarOrcamento} 
                disabled={isSaving || !orcamento.cliente_id || orcamento.itens.length === 0 || (!isAdmin && !vendedorLogado)}
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
            {(isAdmin || (vendedorLogado && orcamento.vendedor_id === vendedorLogado.id)) && orcamento.itens.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <p className="text-sm text-gray-500 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                    MC1 do Orçamento (Estimada): 
                    <span className="font-semibold ml-1 text-green-700">{calcularMC1OrcamentoCompleto()}</span>
                </p>
                <p className="text-xs text-gray-500 italic mt-1">
                    Fórmula: (((Soma Custos MP Itens) / (Total Orçamento * 0,9)) - 1) * -1
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
