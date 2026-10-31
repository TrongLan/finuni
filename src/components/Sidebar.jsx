import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { apiFetchCountries, apiFetchCities } from "../api/mockApi.js";
import { loadLocal, saveLocal } from "../utils/helpers.js";

const COUNTRY_PAGE_SIZE = 10;
const CITY_ROW_HEIGHT = 38;
const CITY_VIEWPORT_HEIGHT = 230;
const CITY_OVERSCAN = 4;

const EMPTY_FORM = {
  nationality: "",
  nationalityCode: "",
  hostCountry: "",
  hostCountryCode: "",
  hostCity: "",
  currency: "",
  currencies: [],
  monthlyIncome: "",
  fixedCost: "",
  context: "",
};

function getEnglishCountryName(countryValue, countries) {
  const country = findCountry(countryValue, countries);
  if (country) return country.name;
  if (!countryValue) return "";
  if (!/^[A-Za-z]{2}$/.test(countryValue)) return countryValue;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(countryValue) || countryValue;
  } catch {
    return countryValue;
  }
}

function findCountry(countryValue, countries) {
  return countries.find(
    (country) =>
      country.name === countryValue ||
      country.code.toLowerCase() === countryValue?.toLowerCase(),
  );
}

function getCurrencyOptions(countries, nationality, hostCountry) {
  const selectedCountries = [hostCountry, nationality]
    .map((value) => findCountry(value, countries))
    .filter(Boolean);
  const currenciesBySymbol = new Map();

  selectedCountries.forEach((country) => {
    country.currencies.forEach((currency) => {
      if (!currenciesBySymbol.has(currency.symbol)) {
        currenciesBySymbol.set(currency.symbol, currency);
      }
    });
  });

  return [...currenciesBySymbol.values()];
}

function mergeCurrencies(...currencyGroups) {
  const currenciesBySymbol = new Map();
  currencyGroups.flat().forEach((currency) => {
    if (
      currency &&
      typeof currency.code === "string" &&
      typeof currency.name === "string" &&
      typeof currency.symbol === "string" &&
      currency.symbol.trim() &&
      !currenciesBySymbol.has(currency.symbol)
    ) {
      currenciesBySymbol.set(currency.symbol, {
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
      });
    }
  });
  return [...currenciesBySymbol.values()];
}

function haveSameCurrencies(first, second) {
  return first.length === second.length && first.every(
    (currency, index) =>
      currency.code === second[index].code &&
      currency.name === second[index].name &&
      currency.symbol === second[index].symbol,
  );
}

function CountrySelect({
  label,
  placeholder,
  required = false,
  value,
  countries,
  disabled,
  loadingMore,
  hasMore,
  error,
  invalid,
  fieldRef,
  onChange,
  onLoadMore,
}) {
  const [open, setOpen] = useState(false);
  const selectedCountry = findCountry(value, countries);

  const handleScroll = (event) => {
    const list = event.currentTarget;
    if (list.scrollHeight - list.scrollTop - list.clientHeight < 48) {
      onLoadMore();
    }
  };

  return (
    <div className={"field" + (invalid ? " field-invalid" : "")}>
      <label>{label}{required ? " *" : ""}</label>
      <div
        className="country-picker"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <button
          className="country-picker-trigger"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-required={required}
          aria-invalid={invalid || undefined}
          ref={fieldRef}
          disabled={disabled}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
        >
          <span className={!value ? "country-picker-placeholder" : ""}>
            {selectedCountry?.flag ? `${selectedCountry.flag} ` : ""}
            {selectedCountry?.name || value || placeholder}
          </span>
          <span className={"country-picker-arrow" + (open ? " open" : "")} aria-hidden="true" />
        </button>
        {open && (
          <div className="country-picker-menu" role="listbox" aria-label={label} onScroll={handleScroll}>
            <button
              className={"country-picker-option" + (!value ? " selected" : "")}
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {placeholder}
            </button>
            {countries.map((country) => (
              <button
                className={"country-picker-option" + (country.name === selectedCountry?.name ? " selected" : "")}
                key={country.code}
                type="button"
                role="option"
                aria-selected={country.name === selectedCountry?.name}
                onClick={() => {
                  onChange(country.name);
                  setOpen(false);
                }}
              >
                {country.flag ? `${country.flag} ` : ""}{country.name}
              </button>
            ))}
            {loadingMore && (
              <div className="country-picker-status" role="status">Loading more countries…</div>
            )}
            {error && (
              <div className="country-picker-status country-picker-error" role="alert">
                <span>{error}</span>
                <button type="button" onClick={onLoadMore}>Retry</button>
              </div>
            )}
            {!hasMore && !loadingMore && countries.length > 0 && (
              <div className="country-picker-status">All countries loaded</div>
            )}
          </div>
        )}
      </div>
      {invalid && <div className="field-validation-message" role="alert">Required</div>}
    </div>
  );
}

function CitySelect({ cities, value, disabled, loading, required, invalid, fieldRef, onChange }) {
  const [open, setOpen] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const startIndex = Math.max(0, Math.floor(scrollTop / CITY_ROW_HEIGHT) - CITY_OVERSCAN);
  const visibleCount = Math.ceil(CITY_VIEWPORT_HEIGHT / CITY_ROW_HEIGHT) + CITY_OVERSCAN * 2;
  const endIndex = Math.min(cities.length, startIndex + visibleCount);
  const visibleCities = cities.slice(startIndex, endIndex);

  useEffect(() => {
    setScrollTop(0);
  }, [cities]);

  return (
    <div className={"field" + (invalid ? " field-invalid" : "")}>
      <label>Host City *</label>
      <div
        className="city-picker"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <button
          className="country-picker-trigger"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-required={required}
          aria-invalid={invalid || undefined}
          ref={fieldRef}
          disabled={disabled}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
        >
          <span className={!value ? "country-picker-placeholder" : ""}>
            {value || (loading ? "Loading cities..." : disabled ? "Select country first" : "Select city")}
          </span>
          <span className={"country-picker-arrow" + (open ? " open" : "")} aria-hidden="true" />
        </button>
        {open && (
          <div
            className="city-picker-menu"
            role="listbox"
            aria-label="Host City"
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          >
            {cities.length === 0 ? (
              <div className="country-picker-status" role="status">
                {loading ? "Loading cities..." : "No cities available"}
              </div>
            ) : (
              <div className="city-picker-virtual-list" style={{ height: cities.length * CITY_ROW_HEIGHT }}>
                <div aria-hidden="true" style={{ height: startIndex * CITY_ROW_HEIGHT }} />
                {visibleCities.map((city) => (
                  <button
                    className={"country-picker-option city-picker-option" + (city === value ? " selected" : "")}
                    key={city}
                    type="button"
                    role="option"
                    aria-selected={city === value}
                    onClick={() => {
                      onChange(city);
                      setOpen(false);
                    }}
                  >
                    {city}
                  </button>
                ))}
                <div aria-hidden="true" style={{ height: (cities.length - endIndex) * CITY_ROW_HEIGHT }} />
              </div>
            )}
          </div>
        )}
      </div>
      {invalid && <div className="field-validation-message" role="alert">Required</div>}
    </div>
  );
}

function CurrencySelect({ currencies, value, required, invalid, fieldRef, onChange }) {
  const [open, setOpen] = useState(false);
  const selectedCurrency = currencies.find((currency) => currency.symbol === value);

  return (
    <div
      className={"currency-picker" + (invalid ? " field-invalid" : "")}
      ref={fieldRef}
      tabIndex={currencies.length === 0 ? -1 : undefined}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        className="country-picker-trigger currency-picker-trigger"
        type="button"
        aria-label="Currency"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        aria-invalid={invalid || undefined}
        disabled={currencies.length === 0}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <span className={!value ? "country-picker-placeholder" : ""}>
          {value || "Currency"}
        </span>
        <span className={"country-picker-arrow" + (open ? " open" : "")} aria-hidden="true" />
      </button>
      {open && (
        <div className="currency-picker-menu" role="listbox" aria-label="Currency">
          {currencies.map((currency) => (
            <button
              className={"country-picker-option" + (currency.symbol === value ? " selected" : "")}
              key={`${currency.code}-${currency.symbol}`}
              type="button"
              role="option"
              aria-selected={currency.symbol === value}
              onClick={() => {
                onChange(currency.symbol);
                setOpen(false);
              }}
            >
              {currency.symbol} ({currency.name})
            </button>
          ))}
        </div>
      )}
      {invalid && <div className="field-validation-message" role="alert">Required</div>}
    </div>
  );
}

export default function Sidebar({ open, onToggle, onProfileChange, onRegisterValidation }) {
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [countryError, setCountryError] = useState("");
  const [loadingMoreCountries, setLoadingMoreCountries] = useState(false);
  const [hasMoreCountries, setHasMoreCountries] = useState(true);
  const countryOffset = useRef(0);
  const countryRequestInProgress = useRef(false);

  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityError, setCityError] = useState("");
  const [cityRetry, setCityRetry] = useState(0);

  const [form, setForm] = useState(() => {
    const storedForm = loadLocal("sg_profile_form", EMPTY_FORM);
    return {
      ...EMPTY_FORM,
      ...storedForm,
      currencies: Array.isArray(storedForm?.currencies) ? mergeCurrencies(storedForm.currencies) : [],
    };
  });
  const [saved, setSaved] = useState(false);
  const [invalidFields, setInvalidFields] = useState({});
  const fieldRefs = useRef({});
  const selectedHostCountryCode =
    form.hostCountryCode ||
    findCountry(form.hostCountry, countries)?.code ||
    (/^[A-Za-z]{2}$/.test(form.hostCountry) ? form.hostCountry : "");
  const selectedCountryCurrencies = useMemo(
    () =>
      getCurrencyOptions(
        countries,
        form.nationalityCode || form.nationality,
        form.hostCountryCode || form.hostCountry,
      ),
    [countries, form.nationalityCode, form.nationality, form.hostCountryCode, form.hostCountry],
  );
  const selectedCountriesResolved = [form.nationalityCode || form.nationality, form.hostCountryCode || form.hostCountry]
    .every((value) => !value || findCountry(value, countries));
  const currencyOptions = useMemo(
    () => selectedCountriesResolved ? selectedCountryCurrencies : [],
    [selectedCountriesResolved, selectedCountryCurrencies],
  );

  const loadMoreCountries = async () => {
    if (countryRequestInProgress.current || !hasMoreCountries) return;
    countryRequestInProgress.current = true;
    const isInitialPage = countryOffset.current === 0;
    if (isInitialPage) setLoadingCountries(true);
    else setLoadingMoreCountries(true);
    setCountryError("");

    try {
      const page = await apiFetchCountries(COUNTRY_PAGE_SIZE, countryOffset.current);
      setCountries((current) => {
        const existingCodes = new Set(current.map((country) => country.code));
        return [...current, ...page.filter((country) => !existingCodes.has(country.code))];
      });
      countryOffset.current += page.length;
      setHasMoreCountries(page.length === COUNTRY_PAGE_SIZE);
    } catch (error) {
      setCountryError(error.message || "Unable to load the country list.");
    } finally {
      countryRequestInProgress.current = false;
      setLoadingCountries(false);
      setLoadingMoreCountries(false);
    }
  };

  useEffect(() => {
    loadMoreCountries();
  }, []);

  useEffect(() => {
    setForm((current) => {
      const nationalityCountry = findCountry(current.nationalityCode || current.nationality, countries);
      const hostCountry = findCountry(current.hostCountryCode || current.hostCountry, countries);
      const nationality = nationalityCountry?.name || current.nationality;
      const nationalityCode = nationalityCountry?.code || current.nationalityCode ||
        (/^[A-Za-z]{2}$/.test(current.nationality) ? current.nationality.toUpperCase() : "");
      const hostCountryName = hostCountry?.name || current.hostCountry;
      const hostCountryCode = hostCountry?.code || current.hostCountryCode ||
        (/^[A-Za-z]{2}$/.test(current.hostCountry) ? current.hostCountry.toUpperCase() : "");
      if (
        nationality === current.nationality &&
        nationalityCode === current.nationalityCode &&
        hostCountryName === current.hostCountry &&
        hostCountryCode === current.hostCountryCode
      ) return current;
      return { ...current, nationality, nationalityCode, hostCountry: hostCountryName, hostCountryCode };
    });
  }, [countries, form.nationalityCode, form.nationality, form.hostCountryCode, form.hostCountry]);

  useEffect(() => {
    if (
      selectedCountriesResolved ||
      !hasMoreCountries ||
      loadingCountries ||
      loadingMoreCountries ||
      countryError
    ) return;
    loadMoreCountries();
  }, [
    selectedCountriesResolved,
    hasMoreCountries,
    loadingCountries,
    loadingMoreCountries,
    countryError,
  ]);

  useEffect(() => {
    let alive = true;
    if (!selectedHostCountryCode) {
      setCities([]);
      setCityError("");
      setLoadingCities(false);
      return;
    }
    const controller = new AbortController();
    setCities([]);
    setCityError("");
    setLoadingCities(true);
    apiFetchCities(selectedHostCountryCode, { signal: controller.signal })
      .then((list) => {
        if (alive) setCities(list);
      })
      .catch((error) => {
        if (alive && error.name !== "AbortError") {
          setCityError(error.message || "Unable to load the city list.");
        }
      })
      .finally(() => {
        if (alive) setLoadingCities(false);
      });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [selectedHostCountryCode, cityRetry]);

  useEffect(() => {
    saveLocal("sg_profile_form", form);
  }, [form]);

  useEffect(() => {
    if (!selectedCountriesResolved) return;
    setForm((current) => {
      const currencies = mergeCurrencies(selectedCountryCurrencies);
      return haveSameCurrencies(current.currencies, currencies)
        ? current
        : { ...current, currencies };
    });
  }, [selectedCountryCurrencies, selectedCountriesResolved]);

  useEffect(() => {
    if (!selectedCountriesResolved) return;
    const selectedCurrencyIsAvailable = currencyOptions.some(
      (currency) => currency.symbol === form.currency,
    );
    if (!selectedCurrencyIsAvailable) {
      setForm((current) => ({
        ...current,
        currency: currencyOptions[0]?.symbol || "",
      }));
    }
  }, [selectedCountriesResolved, form.currency, currencyOptions]);

  useEffect(() => {
    const nationalityName = getEnglishCountryName(form.nationality, countries);
    const countryName = getEnglishCountryName(form.hostCountry, countries);
    onProfileChange({
      ...form,
      nationalityName,
      hostCountryName: countryName,
      hostCityName: form.hostCity,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, countries]);

  const validateRequiredFields = useCallback(() => {
    const requiredFields = [
      ["nationality", form.nationality],
      ["hostCountry", form.hostCountry],
      ["hostCity", form.hostCity],
      ["monthlyIncome", form.monthlyIncome],
      ["currency", form.currency],
    ];
    const missingFields = requiredFields
      .filter(([, value]) => value == null || String(value).trim() === "")
      .map(([field]) => field);
    setInvalidFields(Object.fromEntries(missingFields.map((field) => [field, true])));
    if (missingFields.length === 0) return true;

    requestAnimationFrame(() => {
      const firstInvalidField = fieldRefs.current[missingFields[0]];
      firstInvalidField?.focus();
      firstInvalidField?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return false;
  }, [form]);

  useEffect(() => {
    onRegisterValidation?.(validateRequiredFields);
  }, [onRegisterValidation, validateRequiredFields]);

  const clearInvalidField = (field) => {
    setInvalidFields((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const update = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "hostCountry") next.hostCity = "";
      return next;
    });
    clearInvalidField(key);
    setSaved(false);
  };

  const updateCountry = (key) => (value) => {
    setForm((prev) => {
      const country = key === "nationality" || key === "hostCountry"
        ? findCountry(value, countries)
        : null;
      const next = { ...prev, [key]: country?.name || value };
      if (key === "nationality") next.nationalityCode = country?.code || "";
      if (key === "hostCountry") next.hostCountryCode = country?.code || "";
      if (key === "hostCountry") next.hostCity = "";
      if (key === "hostCountry") {
        const hostCountry = country;
        next.currency = hostCountry?.currencies[0]?.symbol || "";
      } else if (key === "nationality") {
        const nextCurrencyOptions = getCurrencyOptions(countries, next.nationality, prev.hostCountry);
        if (!nextCurrencyOptions.some((currency) => currency.symbol === prev.currency)) {
          const hostCountry = findCountry(prev.hostCountry, countries);
          next.currency = hostCountry?.currencies[0]?.symbol || "";
        }
      }
      return next;
    });
    clearInvalidField(key);
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className={"sidebar-wrap" + (open ? " open" : "")}>
      <div className="sidebar-inner">
        <p className="sidebar-title">User Information</p>
        <p className="sidebar-subtitle">
          Please fill in your information.
        </p>

        <CountrySelect
          label="Nationality"
          required
          invalid={invalidFields.nationality}
          fieldRef={(element) => { fieldRefs.current.nationality = element; }}
          placeholder={loadingCountries ? "Loading..." : "Select nationality"}
          value={form.nationality}
          countries={countries}
          disabled={loadingCountries}
          loadingMore={loadingMoreCountries}
          hasMore={hasMoreCountries}
          error={countryOffset.current === 0 ? "" : countryError}
          onChange={updateCountry("nationality")}
          onLoadMore={loadMoreCountries}
        />
        {loadingCountries && (
          <div className="loading-row">
            <span className="spinner"></span> Loading country list…
          </div>
        )}
        {countryError && countryOffset.current === 0 && (
          <div className="field-hint country-load-error" role="alert">
            {countryError}
            <button type="button" onClick={loadMoreCountries}>Retry</button>
          </div>
        )}

        <CountrySelect
          label="Host Country"
          required
          invalid={invalidFields.hostCountry}
          fieldRef={(element) => { fieldRefs.current.hostCountry = element; }}
          placeholder={loadingCountries ? "Loading..." : "Select country"}
          value={form.hostCountry}
          countries={countries}
          disabled={loadingCountries}
          loadingMore={loadingMoreCountries}
          hasMore={hasMoreCountries}
          error={countryOffset.current === 0 ? "" : countryError}
          onChange={updateCountry("hostCountry")}
          onLoadMore={loadMoreCountries}
        />

        <CitySelect
          cities={cities}
          value={form.hostCity}
          disabled={!selectedHostCountryCode}
          loading={loadingCities}
          required
          invalid={invalidFields.hostCity}
          fieldRef={(element) => { fieldRefs.current.hostCity = element; }}
          onChange={updateCountry("hostCity")}
        />
        {loadingCities && (
          <div className="loading-row">
            <span className="spinner"></span> Loading city list…
          </div>
        )}
        {cityError && (
          <div className="field-hint country-load-error" role="alert">
            {cityError}
            <button type="button" onClick={() => setCityRetry((retry) => retry + 1)}>Retry</button>
          </div>
        )}
        {!loadingCountries && form.hostCountry && !selectedHostCountryCode && (
          <div className="field-hint">Select the host country again to load its cities.</div>
        )}
        {!loadingCities && !cityError && form.hostCountry && selectedHostCountryCode && cities.length === 0 && (
          <div className="field-hint">This country has no available cities.</div>
        )}

        <div className="income-currency-row">
          <div className={"field income-field" + (invalidFields.monthlyIncome ? " field-invalid" : "")}>
            <label htmlFor="monthly-income">Monthly Income *</label>
            <input
              id="monthly-income"
              type="number"
              required
              aria-invalid={invalidFields.monthlyIncome || undefined}
              ref={(element) => { fieldRefs.current.monthlyIncome = element; }}
              placeholder="Type your monthly income"
              value={form.monthlyIncome}
              onChange={update("monthlyIncome")}
            />
            {invalidFields.monthlyIncome && (
              <div className="field-validation-message" role="alert">Required</div>
            )}
          </div>

          <div className="field currency-field">
            <label>Currency *</label>
            <CurrencySelect
              currencies={currencyOptions}
              value={form.currency}
              required
              invalid={invalidFields.currency}
              fieldRef={(element) => { fieldRefs.current.currency = element; }}
              onChange={(value) => updateCountry("currency")(value)}
            />
          </div>
        </div>

        <div className="field" style={{ flex: 1 }}>
          <label>User Context</label>
          <textarea
            className="ta"
            placeholder="Example: saving goals, financial situation, etc."
            value={form.context}
            onChange={update("context")}
          />
        </div>

        {/* <div className="sidebar-actions">
          <button className="btn primary" onClick={handleSave}>
            Lưu thông tin
          </button>
          <button className="btn" onClick={onToggle}>
            Thu gọn
          </button>
        </div> */}
        {/* {saved && <div className="toast">Đã lưu thông tin hồ sơ (demo, lưu cục bộ trên trình duyệt).</div>} */}
      </div>
    </div>
  );
}
