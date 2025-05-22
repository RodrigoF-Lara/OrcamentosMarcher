import React, { useEffect } from "react";
import { User } from "@/api/entities";
import { base44 } from "@/api/base44Client";
import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"

function App() {
  useEffect(() => {
    // Tenta buscar o usuário, se não estiver logado, chama o login Google
    User.me().catch(() => {
      if (base44?.auth?.loginWithGoogle) {
        base44.auth.loginWithGoogle();
      } else {
        alert("Não foi possível iniciar o login Google. Verifique a configuração do SDK.");
      }
    });
  }, []);

  return (
    <>
      <Pages />
      <Toaster />
    </>
  )
}

export default App