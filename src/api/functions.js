https://orcamentos-marcher.vercel.app
const APP_ID = "681abf384445610e1ee1321d";

// Sincronizar cliente com HubSpot
export async function hubspotSyncCliente({ clienteId, forcarAtualizacao = false }) {
  const response = await fetch(
    `https://app.base44.com/api/apps/${APP_ID}/functions/hubspotSyncCliente`,
    {
      method: "POST",
      headers: {
        "api_key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        clienteId,
        forcarAtualizacao
      })
    }
  );
  if (!response.ok) throw new Error("Erro ao sincronizar cliente com HubSpot");
  return await response.json();
}

// Teste de integração com HubSpot
export async function hubspotTest(payload = {}) {
  const response = await fetch(
    `https://app.base44.com/api/apps/${APP_ID}/functions/hubspotTest`,
    {
      method: "POST",
      headers: {
        "api_key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );
  if (!response.ok) throw new Error("Erro ao testar integração com HubSpot");
  return await response.json();
}

// Buscar empresa no HubSpot
export async function hubspotGetCompany({ companyId }) {
  const response = await fetch(
    `https://app.base44.com/api/apps/${APP_ID}/functions/hubspotGetCompany`,
    {
      method: "POST",
      headers: {
        "api_key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ companyId })
    }
  );
  if (!response.ok) throw new Error("Erro ao buscar empresa no HubSpot");
  return await response.json();
}

// Buscar negócio (deal) no HubSpot
export async function hubspotGetDeal({ dealId }) {
  const response = await fetch(
    `https://app.base44.com/api/apps/${APP_ID}/functions/hubspotGetDeal`,
    {
      method: "POST",
      headers: {
        "api_key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ dealId })
    }
  );
  if (!response.ok) throw new Error("Erro ao buscar negócio no HubSpot");
  return await response.json();
}

// Buscar propriedades do negócio (deal) no HubSpot
export async function hubspotGetDealProperties({ dealId }) {
  const response = await fetch(
    `https://app.base44.com/api/apps/${APP_ID}/functions/hubspotGetDealProperties`,
    {
      method: "POST",
      headers: {
        "api_key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ dealId })
    }
  );
  if (!response.ok) throw new Error("Erro ao buscar propriedades do negócio no HubSpot");
  return await response.json();
}

// Criar negócio (deal) no HubSpot
export async function hubspotCreateDeal(payload) {
  const response = await fetch(
    `https://app.base44.com/api/apps/${APP_ID}/functions/hubspotCreateDeal`,
    {
      method: "POST",
      headers: {
        "api_key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );
  if (!response.ok) throw new Error("Erro ao criar negócio no HubSpot");
  return await response.json();
}

// Deletar negócio (deal) no HubSpot
export async function hubspotDeleteDeal({ dealId }) {
  const response = await fetch(
    `https://app.base44.com/api/apps/${APP_ID}/functions/hubspotDeleteDeal`,
    {
      method: "POST",
      headers: {
        "api_key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ dealId })
    }
  );
  if (!response.ok) throw new Error("Erro ao deletar negócio no HubSpot");
  return await response.json();
}

// Baixar PDF
export async function downloadPDF({ orcamentoId }) {
  const response = await fetch(
    `https://app.base44.com/api/apps/${APP_ID}/functions/downloadPDF`,
    {
      method: "POST",
      headers: {
        "api_key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orcamentoId })
    }
  );
  if (!response.ok) throw new Error("Erro ao baixar PDF");
  return await response.blob(); // PDF geralmente é retornado como blob
}

// Baixar PDF2 (caso exista outra função)
export async function downloadPDF2({ orcamentoId }) {
  const response = await fetch(
    `https://app.base44.com/api/apps/${APP_ID}/functions/downloadPDF2`,
    {
      method: "POST",
      headers: {
        "api_key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orcamentoId })
    }
  );
  if (!response.ok) throw new Error("Erro ao baixar PDF2");
  return await response.blob();
}
