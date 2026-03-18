const fs = require('fs');
const path = require('path');
const http = require('http');

const dataFilePath = path.join(__dirname, 'data/data.json');
const ipFilePath = path.join(__dirname, 'data/dankjevoorjeip.json');

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

async function ensureIpFileExists() {
  if (!fs.existsSync(ipFilePath)) {
    fs.mkdirSync(path.dirname(ipFilePath), { recursive: true });
    fs.writeFileSync(ipFilePath, JSON.stringify([], null, 2));
    console.log("IP file created.");
  }
}

async function readIpFileContent() {
  await ensureIpFileExists();
  return JSON.parse(fs.readFileSync(ipFilePath, 'utf-8'));
}

async function saveIpFileContent(data) {
  fs.writeFileSync(ipFilePath, JSON.stringify(data, null, 2));
}

async function addIp(ip) {
  const ips = await readIpFileContent();
  ips.push({ ip, timestamp: new Date().toISOString() });
  saveIpFileContent(ips);
  console.log("IP added:", ip);
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

// HTTP Server voor IP opslaan
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/save-ip') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { ip } = JSON.parse(body);
        await addIp(ip);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('Error saving IP:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Call the function to populate packages on page load
// window.onload = populatePackages; // Dit is client-side, verwijder voor server

(async () => {
  const data = await readFileContent();
  console.log(data);
})();
