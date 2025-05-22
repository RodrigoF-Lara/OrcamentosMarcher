
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Empresa } from "@/api/entities";
import { Building, ChevronRight, Image, Shield, UserCircle, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InstrucoesIniciais from "../components/manual/InstrucoesIniciais";
import { User } from "@/api/entities"; // Adicionado

export default function Configuracoes() {
  const [empresa, setEmpresa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mostrarInstrucoes, setMostrarInstrucoes] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    carregarEmpresa();
    verificarUsuario();
  }, []);

  const verificarUsuario = async () => {
    try {
      const user = await User.me();
      setIsAdmin(user.role === 'admin');
      
      // Mostrar instruções automaticamente para admins em primeira visita
      if (user.role === 'admin') {
        // Você pode implementar uma lógica mais sofisticada aqui,
        // como verificar se é a primeira vez que o admin acessa o sistema
        setMostrarInstrucoes(true); 
      }
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
    }
  };

  const carregarEmpresa = async () => {
    try {
      const empresas = await Empresa.list();
      if (empresas.length > 0) {
        setEmpresa(empresas[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar empresa:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 pb-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>
      
      {/* Mostrar badge de admin */}
      {isAdmin && (
        <div className="bg-purple-50 text-purple-800 px-4 py-2 rounded-md mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          <span>Você tem acesso de administrador</span>
        </div>
      )}
      
      {isAdmin && (
        <Button 
          variant="outline" 
          className="mb-4 w-full"
          onClick={() => setMostrarInstrucoes(!mostrarInstrucoes)}
        >
          {mostrarInstrucoes ? "Esconder instruções" : "Ver instruções para administradores"}
        </Button>
      )}
      
      {mostrarInstrucoes && isAdmin && (
        <div className="mb-4">
          <InstrucoesIniciais onClose={() => setMostrarInstrucoes(false)} />
        </div>
      )}
      
      <div className="space-y-4">
        <Link to={createPageUrl("ConfigurarEmpresa")}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {empresa?.logo_url ? (
                    <img 
                      src={empresa.logo_url}
                      alt="Logo da empresa"
                      className="w-12 h-12 rounded object-contain bg-gray-50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-blue-50 flex items-center justify-center">
                      <Building className="w-6 h-6 text-blue-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {empresa ? empresa.nome : "Configurar Empresa"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {empresa ? "Editar informações da empresa" : "Configure os dados da sua empresa"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
        
        {/* Link para HubSpot */}
        <Link to={createPageUrl("HubSpotConfig")}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-orange-50 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Integração HubSpot</p>
                    <p className="text-sm text-gray-500">
                      Configurar e testar a integração com HubSpot CRM
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
        
        {isAdmin && (
          <Link to={createPageUrl("Vendedores")}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-purple-50 flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Gerenciar Vendedores</p>
                      <p className="text-sm text-gray-500">
                        Cadastrar e administrar vendedores do sistema
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
