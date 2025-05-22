import React from 'react';
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle, ArrowRight, Mail, UserPlus } from "lucide-react";

export default function InstrucoesIniciais({ onClose }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Bem-vindo ao Sistema de Orçamentos</h2>
      
      <div className="space-y-6">
        <section className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center text-blue-700">
            <CheckCircle className="h-5 w-5 mr-2" />
            Configuração Inicial
          </h3>
          <p className="text-gray-700">
            Para começar a usar o sistema, siga os passos abaixo:
          </p>
          <ol className="list-decimal ml-6 space-y-2 text-gray-700">
            <li>
              <span className="font-medium">Configurar sua empresa</span><br/>
              Adicione os dados da sua empresa em Configurações. Estas informações aparecerão nos orçamentos.
            </li>
            <li>
              <span className="font-medium">Cadastrar vendedores</span><br/>
              Como administrador, você pode cadastrar vendedores associando-os aos emails dos usuários que terão acesso ao sistema.
            </li>
            <li>
              <span className="font-medium">Convidar usuários</span><br/>
              Envie convites pelo painel de workspace para que os vendedores possam acessar o sistema.
            </li>
          </ol>
        </section>
        
        <section className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center text-blue-700">
            <CheckCircle className="h-5 w-5 mr-2" />
            Fluxo de Trabalho
          </h3>
          <p className="text-gray-700">
            O sistema funciona com os seguintes níveis de acesso:
          </p>
          <ul className="ml-6 space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="font-medium mr-2">Administrador:</span>
              <span>Acesso completo a todos os orçamentos, clientes, produtos e vendedores.</span>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">Vendedor:</span>
              <span>Acesso apenas aos próprios orçamentos. Pode cadastrar clientes e produtos.</span>
            </li>
          </ul>
        </section>
        
        <section className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center text-blue-700">
            <CheckCircle className="h-5 w-5 mr-2" />
            Como Convidar Novos Usuários
          </h3>
          <p className="text-gray-700">
            Para adicionar novos vendedores ao sistema:
          </p>
          <ol className="list-decimal ml-6 space-y-2 text-gray-700">
            <li>
              <span className="font-medium">Acesse "Workspace" no painel lateral</span>
            </li>
            <li>
              <span className="font-medium">Clique em "Usuários"</span>
            </li>
            <li>
              <span className="font-medium">Clique em "Convidar Usuário"</span>
            </li>
            <li>
              <span className="font-medium">Digite o email do vendedor</span>
            </li>
            <li>
              <span className="font-medium">Pré-cadastre o vendedor na seção Vendedores com o mesmo email</span>
            </li>
          </ol>
          <p className="text-gray-700 text-sm mt-2">
            <strong>Nota:</strong> Quando o vendedor aceitar o convite e fizer login pela primeira vez, 
            ele deverá completar seu cadastro como vendedor usando o mesmo email.
          </p>
        </section>
      </div>
      
      <div className="mt-8 flex justify-between">
        <Link to={createPageUrl("Configuracoes")}>
          <Button variant="outline" className="flex items-center">
            <ArrowRight className="h-4 w-4 mr-2" />
            Configurar Empresa
          </Button>
        </Link>
        <Link to={createPageUrl("Vendedores")}>
          <Button className="flex items-center">
            <UserPlus className="h-4 w-4 mr-2" />
            Gerenciar Vendedores
          </Button>
        </Link>
      </div>
    </div>
  );
}