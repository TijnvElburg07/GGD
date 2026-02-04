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

(async () => {
  const data = await readFileContent();
  console.log(data);
  deletall()
})();