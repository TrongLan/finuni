/**
 * Country and city data comes from countries.dev.
 * The assistant request below calls the local backend endpoint.
 */
import { getTabSessionId } from "../utils/helpers.js";

const COUNTRIES_API_URL = "https://countries.dev/countries";
const CITIES_API_URL = "https://countries.dev/cities";

export async function apiFetchCountries(limit = 20, offset = 0) {
  const params = new URLSearchParams({
    fields: "name,alpha2Code,currencies",
    sort: "name",
    limit: String(limit),
    offset: String(offset),
  });
  const response = await fetch(`${COUNTRIES_API_URL}?${params}`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Country list request failed (${response.status}).`);
  }

  const countries = await response.json();
  if (!Array.isArray(countries)) {
    throw new Error("The country list API returned an unsupported response.");
  }

  return countries.map((country) => {
    if (!country || typeof country !== "object") {
      throw new Error("The country list API returned an invalid country entry.");
    }

    const name = typeof country.name === "string"
      ? country.name
      : country.name?.common;
    const capital = Array.isArray(country.capital)
      ? country.capital[0] || ""
      : country.capital || "";

    if (typeof name !== "string" || !name.trim()) {
      throw new Error("The country list API returned a country without a name.");
    }
    if (typeof capital !== "string" || (country.flag != null && typeof country.flag !== "string")) {
      throw new Error(`The country list API returned invalid data for ${name}.`);
    }

    const currencyEntries = Array.isArray(country.currencies)
      ? country.currencies.map((currency) => [undefined, currency])
      : country.currencies && typeof country.currencies === "object"
        ? Object.entries(country.currencies)
        : [];
    const currencies = currencyEntries.map(([currencyCode, currency]) => {
      if (!currency || typeof currency !== "object") {
        throw new Error(`The country list API returned invalid currency data for ${name}.`);
      }
      const code = currency.code || currencyCode;
      if (
        typeof code !== "string" ||
        typeof currency.name !== "string" ||
        typeof currency.symbol !== "string" ||
        !currency.symbol.trim()
      ) {
        throw new Error(`The country list API returned incomplete currency data for ${name}.`);
      }
      return {
        code,
        name: currency.name,
        symbol: currency.symbol,
      };
    });

    return {
      code: country.alpha2Code || country.code || country.cca2 || name,
      name,
      capital,
      flag: country.flag || "",
      currencies,
    };
  });
}

export async function apiFetchCities(countryAlpha2Code, { signal } = {}) {
  if (!/^[A-Za-z]{2}$/.test(countryAlpha2Code)) {
    throw new Error("A valid country alpha-2 code is required to load cities.");
  }

  const params = new URLSearchParams({ country: countryAlpha2Code.toUpperCase() });
  const response = await fetch(`${CITIES_API_URL}?${params}`, { method: "GET", signal });
  if (!response.ok) {
    throw new Error(`City list request failed (${response.status}).`);
  }

  const body = await response.json();
  const cities = Array.isArray(body) ? body : body?.cities;
  if (!Array.isArray(cities)) {
    throw new Error("The city list API returned an unsupported response.");
  }

  return cities.map((city) => {
    const name = typeof city === "string"
      ? city
      : city?.name || city?.city;
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("The city list API returned an invalid city entry.");
    }
    return name.trim();
  });
}

export async function apiSendChatMessage(history, profile, currentSpreadSheet) {
  const last = history[history.length - 1]?.text || "";
  const incomeValue = profile?.monthlyIncome;
  const requiredFields = [
    ["nationality", profile?.nationalityName || profile?.nationality],
    ["host country", profile?.hostCountryName || profile?.hostCountry],
    ["host city", profile?.hostCityName || profile?.hostCity],
    ["monthly income", incomeValue],
    ["currency", profile?.currency],
  ];
  const missingFields = requiredFields
    .filter(([, value]) => value == null || String(value).trim() === "")
    .map(([field]) => field);
  if (missingFields.length > 0) {
    throw new Error(`Please complete the required profile fields: ${missingFields.join(", ")}.`);
  }
  const incomeAmount = String(incomeValue).trim();
  if (!Number.isFinite(Number(incomeAmount))) {
    throw new Error("Monthly income must be a valid number.");
  }
  const monthlyIncome = `${incomeAmount}${profile.currency}`;

  const response = await fetch("http://localhost:8080/api/v1/ai-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: getTabSessionId(),
      countryName: profile?.nationalityName || "",
      hostCountryName: profile?.hostCountryName || "",
      hostCityName: profile?.hostCityName || "",
      monthlyIncome,
      fixedCost: profile?.fixedCost || "",
      moreInfo: profile?.context || "",
      userPrompt: last,
      currentSpreadSheet: currentSpreadSheet || "",
      spreadSheetTemplate: "",
      reviewOnly: false,
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    const fieldErrors = body.errors && typeof body.errors === "object"
      ? Object.entries(body.errors).map(([field, message]) => `${field}: ${message}`).join("; ")
      : "";
    throw new Error([body.message || body.error || `Request failed (${response.status})`, fieldErrors]
      .filter(Boolean)
      .join(" — "));
  }

  if (typeof body.reply !== "string" || !body.spreadSheet || typeof body.spreadSheet !== "object") {
    throw new Error("The API response is missing reply or spreadSheet.");
  }

  const { headers, data } = body.spreadSheet;
  if (
    !Array.isArray(headers) ||
    !headers.every((header) => typeof header === "string") ||
    !Array.isArray(data) ||
    !data.every((row) => Array.isArray(row) && row.every((value) => typeof value === "string"))
  ) {
    throw new Error("The API returned spreadsheet data in an unsupported format.");
  }
  return { reply: body.reply, spreadsheet: { columns: headers, data } };
}
