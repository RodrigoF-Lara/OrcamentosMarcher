
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Trash, PercentIcon, DollarSign, Calculator, TrendingUp } from "lucide-react";

export default function ItemOrcamento({ 
  item, 
  index, 
  produtos, 
  atualizarItem, 
  removerItem,
  isAdmin // isAdmin é passado para controle VISUAL, não para impedir o cálculo de custo_mp_item_total
}) {
  const calcularValorComDesconto = (base, descontos, descontoFixo) => {
    let valor = base;
    
    // Aplicar descontos percentuais em cascata
    descontos.forEach(desconto => {
      if (desconto > 0) {
        valor = valor * (1 - (desconto / 100));
      }
    });
    
    // Aplicar desconto em R$
    valor = Math.max(0, valor - descontoFixo);
    
    return parseFloat(valor.toFixed(2));
  };

  const getProdutoSelecionado = () => {
    return produtos.find(p => p.id === item.produto_id);
  };

  const calcularCustosEMargens = (currentItemState) => {
    const produtoSelecionado = produtos.find(p => p.id === currentItemState.produto_id);
    let custoMpUnitario = 0;
    let custoMpItemTotal = 0;
    let mc1ItemPercent = "N/A";

    // O cálculo de custoMpUnitario e custoMpItemTotal deve ocorrer se produtoSelecionado.custo_mp existir,
    // independentemente de quem está logado. A *exibição* é controlada por isAdmin.
    if (produtoSelecionado && produtoSelecionado.custo_mp !== undefined) {
      custoMpUnitario = produtoSelecionado.custo_mp;
      custoMpItemTotal = custoMpUnitario * (currentItemState.quantidade || 1);
      
      const valorFinalItem = currentItemState.valor_final || 0;
      const receitaLiquidaEstimadaItem = valorFinalItem * 0.9;

      if (receitaLiquidaEstimadaItem > 0 && custoMpItemTotal >= 0) {
        const mc1Calc = (((custoMpItemTotal / receitaLiquidaEstimadaItem) - 1) * -1) * 100;
        mc1ItemPercent = `${mc1Calc.toFixed(2)}%`;
      }
    }
    return { custoMpItemTotal, mc1ItemPercent, custoMpUnitario };
  };
  
  const recalcularEAtualizarItem = (updates) => {
    const estadoAtualizado = { ...item, ...updates };
    
    const valorBase = (estadoAtualizado.quantidade || 1) * (estadoAtualizado.preco_unitario || 0);
    const descontosPerc = [
      estadoAtualizado.desconto_percentual_1 || 0,
      estadoAtualizado.desconto_percentual_2 || 0,
      estadoAtualizado.desconto_percentual_3 || 0,
      estadoAtualizado.desconto_percentual_4 || 0,
      estadoAtualizado.desconto_percentual_5 || 0
    ];
    const descontoFixo = estadoAtualizado.desconto_valor || 0;
    const valorFinalCalculado = calcularValorComDesconto(valorBase, descontosPerc, descontoFixo);
    const descontoEfetivoCalculado = valorBase > 0 ? ((valorBase - valorFinalCalculado) / valorBase) * 100 : 0;
    
    estadoAtualizado.valor_final = valorFinalCalculado;
    estadoAtualizado.desconto_efetivo = parseFloat(descontoEfetivoCalculado.toFixed(2));

    // Sempre calcular e incluir custo_mp_item_total se o produto tiver custo_mp
    // Isso garante que o dado seja salvo para o admin visualizar o MC1 depois.
    const produtoInfo = produtos.find(p => p.id === estadoAtualizado.produto_id);
    if (produtoInfo && produtoInfo.custo_mp !== undefined) {
         estadoAtualizado.custo_mp_item_total = (produtoInfo.custo_mp || 0) * (estadoAtualizado.quantidade || 1);
    } else {
         estadoAtualizado.custo_mp_item_total = 0; // Default se não admin ou produto sem custo
    }

    // Recalcular MC1 sempre que o item for atualizado, garantindo que o valor esteja sempre correto
    const { custoMpItemTotal, mc1ItemPercent, custoMpUnitario } = calcularCustosEMargens(estadoAtualizado);
    estadoAtualizado.mc1ItemPercent = mc1ItemPercent; // Salva o valor calculado no estado
    
    atualizarItem(index, estadoAtualizado);
  };


  const atualizarDesconto = (idx, valor) => {
    const descontos = [
      item.desconto_percentual_1 || 0,
      item.desconto_percentual_2 || 0,
      item.desconto_percentual_3 || 0,
      item.desconto_percentual_4 || 0,
      item.desconto_percentual_5 || 0
    ];
    descontos[idx] = parseFloat(valor) || 0;
    
    recalcularEAtualizarItem({
      desconto_percentual_1: descontos[0],
      desconto_percentual_2: descontos[1],
      desconto_percentual_3: descontos[2],
      desconto_percentual_4: descontos[3],
      desconto_percentual_5: descontos[4],
    });
  };

  const atualizarDescontoValor = (valor) => {
    recalcularEAtualizarItem({ desconto_valor: parseFloat(valor) || 0 });
  };

  // Garante que o mc1Display esteja sempre atualizado com o valor correto,
  // buscando do estado atualizado do item.
  const mc1Display = item.mc1ItemPercent || "N/A";
  const { custoMpUnitario: custoMpUnitarioDisplay } = calcularCustosEMargens(item);


  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Item {index + 1}</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 px-2"
            onClick={() => removerItem(index)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`produto-${index}`} className="text-xs text-gray-600">
              Produto
            </Label>
            <Select 
              value={item.produto_id} 
              onValueChange={(value) => {
                const produtoSelecionado = produtos.find(p => p.id === value);
                if (produtoSelecionado) {
                  recalcularEAtualizarItem({
                    produto_id: value,
                    produto_nome: produtoSelecionado.nome,
                    preco_unitario: produtoSelecionado.preco || 0,
                    // Custo MP será recalculado baseado no novo produto
                  });
                }
              }}
            >
              <SelectTrigger id={`produto-${index}`}>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {produtos.map(produto => (
                  <SelectItem key={produto.id} value={produto.id}>
                    {produto.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor={`quantidade-${index}`} className="text-xs text-gray-600">
                Quantidade
              </Label>
              <Input
                id={`quantidade-${index}`}
                type="number"
                min="1"
                value={item.quantidade}
                onChange={(e) => {
                  recalcularEAtualizarItem({ quantidade: parseInt(e.target.value) || 1 });
                }}
              />
            </div>
            <div>
              <Label htmlFor={`preco-${index}`} className="text-xs text-gray-600">
                Preço unitário
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-gray-500">R$</span>
                <Input
                  id={`preco-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-8"
                  value={item.preco_unitario}
                  onChange={(e) => {
                    recalcularEAtualizarItem({ preco_unitario: parseFloat(e.target.value) || 0 });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Descontos em cascata */}
        <div className="mt-4">
          <Label className="text-xs text-gray-600 flex items-center mb-2">
            <PercentIcon className="h-3 w-3 mr-1" />
            Descontos em cascata
          </Label>
          <div className="grid grid-cols-5 gap-2">
            {[
              item.desconto_percentual_1 || 0,
              item.desconto_percentual_2 || 0,
              item.desconto_percentual_3 || 0,
              item.desconto_percentual_4 || 0,
              item.desconto_percentual_5 || 0
            ].map((desconto, idx) => (
              <div key={idx}>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={desconto}
                  onChange={(e) => atualizarDesconto(idx, e.target.value)}
                  className="text-center"
                  placeholder={`${idx + 1}º`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desconto em R$ */}
        <div className="mt-4">
          <Label className="text-xs text-gray-600 flex items-center mb-2">
            <DollarSign className="h-3 w-3 mr-1" />
            Desconto em R$
          </Label>
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-gray-500">R$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              className="pl-8"
              value={item.desconto_valor || 0}
              onChange={(e) => atualizarDescontoValor(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>
          
        {/* Valores finais e Infos Admin */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
          <div className="text-sm text-gray-600 flex items-center">
            <Calculator className="h-4 w-4 mr-1" />
            Desconto efetivo: 
            <span className="font-semibold ml-1">
              {(item.desconto_efetivo || 0).toFixed(2)}%
            </span>
          </div>

          <div>
            <Label className="text-xs text-gray-600">
              Valor final do Item
            </Label>
            <div className="h-10 bg-gray-100 rounded-md flex items-center px-3 font-semibold">
              R$ {(item.valor_final || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {isAdmin && (
            <>
              <div>
                <Label className="text-xs text-gray-600">
                  Custo MP Unitário (Produto)
                </Label>
                <div className="h-10 bg-blue-50 rounded-md flex items-center px-3 font-semibold text-blue-700">
                  R$ {(custoMpUnitarioDisplay || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-600">
                  Custo MP Total do Item
                </Label>
                {/* Esta exibição busca do item.custo_mp_item_total, que agora deve estar sempre calculado */}
                <div className="h-10 bg-blue-50 rounded-md flex items-center px-3 font-semibold text-blue-700">
                  R$ {(item.custo_mp_item_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
               <div className="md:col-span-2"> {/* Ocupa duas colunas no desktop */}
                <Label className="text-xs text-gray-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    MC1 do Item (Estimada)
                </Label>
                <div className="h-10 bg-green-50 rounded-md flex items-center px-3 font-semibold text-green-700">
                    {mc1Display}
                </div>
                <p className="text-xs text-gray-500 italic mt-1">Fórmula: (((Custo MP Total Item) / (Valor Final Item * 0,9)) - 1) * -1</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
