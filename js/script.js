const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data/data.json');

async function ensureFileExists() {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({ lastId: 0, items: [] }, null, 2)
    );
    console.log("File created.");
  }
}

async function readFileContent() {
  await ensureFileExists();
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function saveFileContent(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function writeFileContent(value) {
  const data = await readFileContent();

  const newItem = {
    id: ++data.lastId,
    value
  };

  data.items.push(newItem);
  saveFileContent(data);

  console.log("Item added:", newItem);
  return newItem.id;
}

async function deleteById(id) {
  const data = await readFileContent();
  const initialLength = data.items.length;

  data.items = data.items.filter(item => item.id !== id);

  if (data.items.length === initialLength) {
    console.log(`No item found with id ${id}`);
    return false;
  }

  saveFileContent(data);
  console.log(`Item with id ${id} deleted`);
  return true;
}

async function deletall(){
  const data = await readFileContent();

  if (data.items == {}) {return false}

  data.items = [];
  saveFileContent(data);
  console.log("All items deleted");
}

// Function to populate packages in dropdown and section
function populatePackages() {
    const packages = {
        "1": {"name": "Example Package", "version": "1.0.0", "description": "This is an example package.", "price": 9.99},
        "2": {"name": "Advanced Package", "version": "2.0.0", "description": "This is an advanced package with more features.", "price": 19.99}
    };

    const dropdown = document.getElementById('package-dropdown');
    const packageList = document.getElementById('package-list');

    for (const key in packages) {
        const pkg = packages[key];

        // Populate dropdown
        const dropdownItem = document.createElement('a');
        dropdownItem.textContent = pkg.name;
        dropdownItem.href = '#'; // Add functionality as needed
        dropdown.appendChild(dropdownItem);

        // Populate package list
        const packageItem = document.createElement('div');
        packageItem.innerHTML = `<strong>${pkg.name}</strong> - ${pkg.description} (€${pkg.price})`;
        packageList.appendChild(packageItem);
    }
}

// Call the function to populate packages on page load
window.onload = populatePackages;

(async () => {
  const data = await readFileContent();
  console.log(data);
})();
