import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HubSpotEscopos() {
  const [copied, setCopied] = React.useState(false);
  
  const escopos = [
    {
      categoria: "CRM",
      scopes: [
        "crm.objects.contacts.read",
        "crm.objects.contacts.write",
        "crm.objects.companies.read",
        "crm.objects.companies.write",
        "crm.objects.deals.read",
        "crm.objects.deals.write",
        "crm.objects.line_items.read",
        "crm.objects.line_items.write",
        "crm.schemas.deals.read",
        "crm.schemas.contacts.read",
        "crm.schemas.companies.read",
        "crm.schemas.line_items.read"
      ]
    },
    {
      categoria: "Associações",
      scopes: [
        "crm.objects.deals.read",
        "crm.objects.contacts.read",
        "crm.objects.companies.read",
        "crm.objects.line_items.read",
        "crm.objects.quotes.read",
        "crm.associations.read"
      ]
    },
    {
      categoria: "Pipelines",
      scopes: [
        "crm.objects.deals.read",
        "crm.pipelines.read"
      ]
    }
  ];
  
  const allScopes = escopos.flatMap(cat => cat.scopes);
  const uniqueScopes = [...new Set(allScopes)];
  
  const copyToClipboard = () => {
    const text = uniqueScopes.join(" ");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Escopos Recomendados para API HubSpot</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-gray-600">
          Ao criar seu Private App Token no HubSpot, adicione os seguintes escopos para garantir acesso completo às funcionalidades necessárias:
        </p>
        
        <div className="space-y-4">
          {escopos.map((categoria, idx) => (
            <div key={idx}>
              <h3 className="font-medium text-gray-800 mb-2">{categoria.categoria}</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {categoria.scopes.map((scope, i) => (
                  <li key={i} className="text-gray-600">{scope}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Total: <span className="font-medium">{uniqueScopes.length} escopos distintos</span>
            </p>
            <Button 
              onClick={copyToClipboard} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copiar todos</span>
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs font-mono overflow-x-auto max-h-32">
            {uniqueScopes.join(" ")}
          </div>
        </div>
        
        <div className="mt-4 bg-blue-50 p-3 rounded-md text-sm">
          <p className="text-blue-800">
            <strong>Dica:</strong> Se você copiar o texto acima e colar na seção de escopos ao criar seu Private App Token no HubSpot, todos os escopos necessários serão adicionados de uma vez.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}