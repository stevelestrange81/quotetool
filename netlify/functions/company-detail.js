// Fetches a company's profile, officers, PSCs and charges from
// Companies House, then reduces them to the fields the quote tool
// displays. Requires COMPANIES_HOUSE_API_KEY (see company-search.js).
//
// Known limitation: Companies House does not reliably expose full
// shareholder lists or share-class detail through this API (that
// detail mostly lives inside confirmation statement filings, which
// aren't practical to parse here). The frontend asks about share
// classes directly in the questionnaire instead of inferring it.

exports.handler = async (event) => {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    return json(500, { error: "Server is missing COMPANIES_HOUSE_API_KEY" });
  }

  const number = event.queryStringParameters && event.queryStringParameters.number;
  if (!number) {
    return json(400, { error: "Missing company number" });
  }

  const auth = "Basic " + Buffer.from(apiKey + ":").toString("base64");
  const base = "https://api.company-information.service.gov.uk";
  const headers = { Authorization: auth };

  const safeFetch = async (url) => {
    try {
      const r = await fetch(url, { headers });
      if (r.status === 404) return null;
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  };

  try {
    const [profile, officers, psc, charges] = await Promise.all([
      safeFetch(`${base}/company/${number}`),
      safeFetch(`${base}/company/${number}/officers`),
      safeFetch(`${base}/company/${number}/persons-with-significant-control`),
      safeFetch(`${base}/company/${number}/charges`),
    ]);

    if (!profile) {
      return json(404, { error: "Company not found" });
    }

    const activeDirectors = (officers?.items || []).filter(
      (o) => o.officer_role === "director" && !o.resigned_on
    ).length;

    const activePsc = (psc?.items || []).filter((p) => !p.ceased_on).length;

    const outstandingCharges = (charges?.items || []).filter(
      (c) => (c.status || "").toLowerCase() === "outstanding"
    ).length;

    const result = {
      name: profile.company_name,
      number: profile.company_number,
      status: profile.company_status,
      incorporated: profile.date_of_creation,
      sic: (profile.sic_codes || []).join(", ") || "Not specified",
      address: formatAddress(profile.registered_office_address),
      directors: activeDirectors,
      psc: activePsc,
      charges: outstandingCharges,
    };

    return json(200, result);
  } catch (err) {
    return json(500, { error: "Detail lookup failed", detail: String(err) });
  }
};

function formatAddress(a) {
  if (!a) return "Not available";
  return [a.premises, a.address_line_1, a.address_line_2, a.locality, a.region, a.postal_code]
    .filter(Boolean)
    .join(", ");
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  };
}
