// Formulier elementen
const form = document.getElementById('offer-form');
const priceDisplay = document.getElementById('estimated-price');

// Input velden voor berekening
const grassInput = document.getElementById('grass-m2');
const tilesInput = document.getElementById('tiles-m2');
const hedgeInput = document.getElementById('hedge-meters');
const optionCheckboxes = document.querySelectorAll('input[name="options"]');

// Hulpfuncties
function formatPrice(price) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}

function getInputValues() {
  return {
    grassM2: parseFloat(grassInput.value) || 0,
    tilesM2: parseFloat(tilesInput.value) || 0,
    hedgeMeters: parseFloat(hedgeInput.value) || 0
  };
}

function getSelectedOptions() {
  return Array.from(optionCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
}

function displayPrice(price) {
  priceDisplay.textContent = formatPrice(price);
}

// Prijs berekenen door naar server te sturen
async function calculateAndDisplayPrice() {
  const data = {
    ...getInputValues(),
    extraOptions: getSelectedOptions()
  };

  try {
    const response = await fetch('/api/calculate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    displayPrice(result.success ? result.quote : 0);
  } catch (error) {
    console.error('Fout bij berekenen prijs:', error);
    displayPrice(0);
  }
}

// Offerte opslaan
async function handleFormSubmit(e) {
  e.preventDefault();

  const data = {
    ...getInputValues(),
    extraOptions: getSelectedOptions(),
    description: document.getElementById('description').value,
    customerName: document.getElementById('customer-name').value,
    customerEmail: document.getElementById('customer-email').value,
    customerPhone: document.getElementById('customer-phone').value,
    workDate: document.getElementById('work-date').value
  };

  try {
    const response = await fetch('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      alert(`✓ Offerte opgeslagen!\nID: ${result.order.id}\nPrijs: €${result.order.quotedPrice.toFixed(2)}`);
      form.reset();
      calculateAndDisplayPrice();
      if (window.ordersManager) window.ordersManager.loadOrders();
    } else {
      alert(`✗ Fout: ${result.error}`);
    }
  } catch (error) {
    console.error('Fout bij opslaan:', error);
    alert('✗ Fout bij versturen van offerte');
  }
}

// Event listeners
grassInput.addEventListener('input', calculateAndDisplayPrice);
tilesInput.addEventListener('input', calculateAndDisplayPrice);
hedgeInput.addEventListener('input', calculateAndDisplayPrice);
optionCheckboxes.forEach(cb => cb.addEventListener('change', calculateAndDisplayPrice));
form.addEventListener('submit', handleFormSubmit);

// Initiële berekening
calculateAndDisplayPrice();