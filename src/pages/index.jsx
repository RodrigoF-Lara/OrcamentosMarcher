import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Orcamentos from "./Orcamentos";

import NovoOrcamento from "./NovoOrcamento";

import DetalhesOrcamento from "./DetalhesOrcamento";

import EditarOrcamento from "./EditarOrcamento";

import Produtos from "./Produtos";

import NovoProduto from "./NovoProduto";

import EditarProduto from "./EditarProduto";

import Clientes from "./Clientes";

import NovoCliente from "./NovoCliente";

import EditarCliente from "./EditarCliente";

//import Layout from "./Layout";

import Vendedores from "./Vendedores";

import NovoVendedor from "./NovoVendedor";

import EditarVendedor from "./EditarVendedor";

import Configuracoes from "./Configuracoes";

import ConfigurarEmpresa from "./ConfigurarEmpresa";

import HubSpotConfig from "./HubSpotConfig";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Orcamentos: Orcamentos,
    
    NovoOrcamento: NovoOrcamento,
    
    DetalhesOrcamento: DetalhesOrcamento,
    
    EditarOrcamento: EditarOrcamento,
    
    Produtos: Produtos,
    
    NovoProduto: NovoProduto,
    
    EditarProduto: EditarProduto,
    
    Clientes: Clientes,
    
    NovoCliente: NovoCliente,
    
    EditarCliente: EditarCliente,
    
    Layout: Layout,
    
    Vendedores: Vendedores,
    
    NovoVendedor: NovoVendedor,
    
    EditarVendedor: EditarVendedor,
    
    Configuracoes: Configuracoes,
    
    ConfigurarEmpresa: ConfigurarEmpresa,
    
    HubSpotConfig: HubSpotConfig,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Orcamentos" element={<Orcamentos />} />
                
                <Route path="/NovoOrcamento" element={<NovoOrcamento />} />
                
                <Route path="/DetalhesOrcamento" element={<DetalhesOrcamento />} />
                
                <Route path="/EditarOrcamento" element={<EditarOrcamento />} />
                
                <Route path="/Produtos" element={<Produtos />} />
                
                <Route path="/NovoProduto" element={<NovoProduto />} />
                
                <Route path="/EditarProduto" element={<EditarProduto />} />
                
                <Route path="/Clientes" element={<Clientes />} />
                
                <Route path="/NovoCliente" element={<NovoCliente />} />
                
                <Route path="/EditarCliente" element={<EditarCliente />} />
                
                <Route path="/Layout" element={<Layout />} />
                
                <Route path="/Vendedores" element={<Vendedores />} />
                
                <Route path="/NovoVendedor" element={<NovoVendedor />} />
                
                <Route path="/EditarVendedor" element={<EditarVendedor />} />
                
                <Route path="/Configuracoes" element={<Configuracoes />} />
                
                <Route path="/ConfigurarEmpresa" element={<ConfigurarEmpresa />} />
                
                <Route path="/HubSpotConfig" element={<HubSpotConfig />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}