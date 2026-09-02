// Proxies Companies House "search companies" so the API key never
// reaches the browser. Set COMPANIES_HOUSE_API_KEY in Netlify's
// Site settings -> Environment variables.

exports.handler = async (event) => {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    return json(500, { error: "Server is missing COMPANIES_HOUSE_API_KEY" });
  }

  const q = (event.queryStringParameters && event.queryStringParameters.q || "").trim();
  if (q.length < 2) {
    return json(200, { items: [] });
  }

  const auth = "Basic " + Buffer.from(apiKey + ":").toString("base64");
  const url = `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(q)}&items_per_page=6`;

  try {
    const resp = await fetch(url, { headers: { Authorization: auth } });

    if (resp.status === 401) {
      return json(500, { error: "Companies House rejected the API key" });
    }
    if (!resp.ok) {
      return json(resp.status, { error: "Companies House search failed" });
    }

    const data = await resp.json();
    const items = (data.items || [])
      .filter((i) => i.company_type !== "icvc-securities") // noise filter, harmless if it matches nothing
      .map((i) => ({
        title: i.title,
        company_number: i.company_number,
        status: i.company_status,
        date_of_creation: i.date_of_creation,
        address: i.address_snippet,
      }));

    return json(200, { items });
  } catch (err) {
    return json(500, { error: "Lookup failed", detail: String(err) });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  };
}
