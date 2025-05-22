import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, FileText, Package, Users, Menu, X, Building, UserCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navigation = [
    { name: "Início", icon: Home, path: "Dashboard" },
    { name: "Orçamentos", icon: FileText, path: "Orcamentos" },
    { name: "Produtos", icon: Package, path: "Produtos" },
    { name: "Clientes", icon: Users, path: "Clientes" },
    { name: "Vendedores", icon: UserCircle, path: "Vendedores" },
    { name: "Configurações", icon: Settings, path: "Configuracoes" }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header para celular */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-500 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="ml-3 text-lg font-bold text-gray-900">
            {currentPageName === "Dashboard" ? "Início" :
             currentPageName === "NovoOrcamento" ? "Novo Orçamento" :
             currentPageName === "EditarOrcamento" ? "Editar Orçamento" :
             currentPageName === "DetalhesOrcamento" ? "Detalhes do Orçamento" :
             currentPageName === "Produtos" ? "Produtos" :
             currentPageName === "NovoProduto" ? "Novo Produto" :
             currentPageName === "EditarProduto" ? "Editar Produto" :
             currentPageName === "Clientes" ? "Clientes" :
             currentPageName === "NovoCliente" ? "Novo Cliente" :
             currentPageName === "EditarCliente" ? "Editar Cliente" :
             currentPageName === "Vendedores" ? "Vendedores" :
             currentPageName === "NovoVendedor" ? "Novo Vendedor" :
             currentPageName === "EditarVendedor" ? "Editar Vendedor" :
             currentPageName === "Configuracoes" ? "Configurações" :
             currentPageName === "ConfigurarEmpresa" ? "Dados da Empresa" :
             currentPageName}
          </h1>
        </div>
      </header>

      {/* Menu lateral para celular */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="px-4 pt-5 pb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">OrçaFácil</h2>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={createPageUrl(item.path)}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-base font-medium rounded-md",
                    currentPageName === item.path
                      ? "bg-blue-100 text-blue-800"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto pb-safe">
        {children}
      </main>

      {/* Menu inferior para celular */}
      <nav className="bg-white border-t grid grid-cols-6 py-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={createPageUrl(item.path)}
            className={cn(
              "flex flex-col items-center justify-center px-2 py-1 text-xs font-medium",
              currentPageName === item.path
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            <item.icon className="h-6 w-6 mb-1" />
            <span className="truncate w-full text-center">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}