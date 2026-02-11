function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function populatePackages(packages) {
  const dropdown = document.getElementById('package-dropdown');
  const packageList = document.getElementById('package-list');
  const servicesList = document.getElementById('services-list');

  if (!packageList || !servicesList) return;

  if (dropdown) dropdown.innerHTML = '';
  packageList.innerHTML = '';
  servicesList.innerHTML = '';

  for (const id in packages) {
    const pkg = packages[id];

    if (dropdown) {
      const dropdownItem = document.createElement('a');
      dropdownItem.textContent = pkg.name;
      dropdownItem.href = '#';
      dropdownItem.dataset.packageId = id;
      dropdown.appendChild(dropdownItem);
    }

    const packageItem = document.createElement('div');
    packageItem.className = 'package-item';
    packageItem.innerHTML = `<strong>${escapeHtml(pkg.name)}</strong> - ${escapeHtml(pkg.description)} (€${Number(pkg.price).toFixed(2)})`;
    packageList.appendChild(packageItem);

    const serviceItem = document.createElement('div');
    serviceItem.className = 'service-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `service-${id}`;
    checkbox.name = 'services';
    checkbox.value = id;

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = `${pkg.name} — €${Number(pkg.price).toFixed(2)}`;

    serviceItem.appendChild(checkbox);
    serviceItem.appendChild(label);
    servicesList.appendChild(serviceItem);
  }
}

async function loadPackagesJson() {
  try {
    const resp = await fetch('js/data/packages.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const packages = await resp.json();
    populatePackages(packages);
    console.log('Packages loaded', packages);
  } catch (err) {
    console.error('Failed to load packages.json', err);
    const servicesList = document.getElementById('services-list');
    if (servicesList) {
      servicesList.innerHTML = '<div class="service-item">Kon pakketten niet laden.</div>';
    }
    const packageList = document.getElementById('package-list');
    if (packageList) packageList.innerHTML = '<p>Kon pakketten niet laden.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPackagesJson();
});
