const inputBox = document.querySelector<HTMLInputElement>("#amount");
const fromCurrency = document.querySelector<HTMLSelectElement>(".from-currency");
const toCurrency = document.querySelector<HTMLSelectElement>(".to-currency");
const convertButton = document.querySelector<HTMLButtonElement>(".convert-button");
const output = document.querySelector<HTMLParagraphElement>(".output");
const error = document.querySelector<HTMLParagraphElement>(".error");

if (!inputBox || !fromCurrency || !toCurrency || !convertButton || !output || !error) {
    throw new Error("One or more elements were not found in the DOM.");
}


error.style.display = "none";

function showErrorMessage(message: string): void {
    if (!error) return;

    error.style.display = "block";
    error.textContent = message;

    setTimeout(() => {
        error.style.display = "none"
    }, 3000)
}

interface Country {
    name: { common: string; };
    currencies: Record<string, { name: string; symbol: string }>;
    flags: { png: string; svg: string; alt?: string; };
}

const getCountries = async (): Promise<Country[]> => {
    try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name,currencies,flags");
        // console.log("API Response Status:", response.status);


        if (!response.ok) {
            throw new Error("Error fetching country data.");
        }

        const data: unknown = await response.json();
        // console.log("Raw API Response:", data)

        if (!Array.isArray(data)) {
            throw new Error("Invalid response format");
        }

        return data
            .map(
                (country) => {
                    if (
                        typeof country === "object" &&
                        country !== null &&
                        "name" in country &&
                        "currencies" in country &&
                        "flags" in country
                    ) {
                        return {
                            name: (country as any).name,
                            currencies: (country as any).currencies,
                            flags: (country as any).flags,
                        } as Country;
                    }
                    return null;
                }
            ).filter((country): country is Country => country !== null);

    } catch (error) {
        console.error("Error:", (error as Error).message);
        return [];
    }
}


const updateCurrencyDropdown = (selectElement: HTMLSelectElement, countries: Country[]): void => {

    selectElement.innerHTML = "";

    const defaultOption: HTMLOptionElement = document.createElement("option");
    defaultOption.textContent = "Select Currency";
    defaultOption.value = "";
    selectElement.appendChild(defaultOption)


    countries.sort((a, b) => {
        const nameA = a.name?.common || '';
        const nameB = b.name?.common || '';
        return nameA.localeCompare(nameB);
    })

    countries.forEach((country: Country) => {
        const currencyCode = Object.keys(country.currencies || {})[0];

        if (currencyCode && country.name?.common) {
            const option: HTMLOptionElement = document.createElement("option");
            option.textContent = `${currencyCode} - ${country.name.common}`;
            option.setAttribute("value", currencyCode);
            selectElement.appendChild(option);
        }
    })
}

getCountries().then((countries) => {
    // console.log("Fetched countries:", countries); // Debugging line
    if (countries.length > 0) {
        updateCurrencyDropdown(fromCurrency, countries);
        updateCurrencyDropdown(toCurrency, countries);
    } else {
        showErrorMessage("No countries found!");
    }
});


function updateTheOutput(message: string): void {
    if (output) {
        output.textContent = message;
    }
}

interface ExchangeRateResponse {
    conversion_rates: Record<string, number>;
}

async function exchangeRateValue(fromCurr: string): Promise<ExchangeRateResponse | null> {
    try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/6c5047172064cd75edafa34f/latest/${fromCurr}`);
        if (!response.ok) {
            throw new Error("Error fetching the Exchange Rate.");
        }
        const data: ExchangeRateResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Error: ", (error as Error).message);
        return null;
    }
}

convertButton.addEventListener("click", async (event: Event) => {
    event.preventDefault();

    const selectedFromCurrency = fromCurrency.value;
    const selectedToCurrency = toCurrency.value;
    const inputValue = inputBox.value;

    if (!inputValue) {
        showErrorMessage("Please enter an amount.");
        inputBox.focus();
        return;
    }

    if (!selectedFromCurrency) {
        showErrorMessage("Please select the first currency.");
        fromCurrency.focus();
        return;
    }

    if (!selectedToCurrency) {
        showErrorMessage("Please select the second currency.");
        toCurrency.focus();
        return;
    }

    console.log(`From Currency: ${selectedFromCurrency}`);
    console.log(`To Currency: ${selectedToCurrency}`);
    console.log(`Input Value: ${inputValue}`);

    const response = await exchangeRateValue(selectedFromCurrency);

    if (response && response.conversion_rates) {
        const rate = response.conversion_rates[selectedToCurrency];

        if (rate) {
            const resultString = `${inputValue} ${selectedFromCurrency} = ${(rate * parseFloat(inputValue)).toFixed(2)} ${selectedToCurrency}`;
            updateTheOutput(resultString);
        } else {
            showErrorMessage("Exchange rate not found for selected currency.");
        }
    } else {
        showErrorMessage("Failed to fetch exchange rate data.");
    }
});
