const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Paths
const dataDir = path.join(__dirname, 'data');
const ordersFile = path.join(dataDir, 'orders.json');
const ratesFile = path.join(dataDir, 'rates.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load rates from rates.json
function loadRates() {
  try {
    const ratesData = fs.readFileSync(ratesFile, 'utf-8');
    return JSON.parse(ratesData);
  } catch (error) {
    console.error('Error loading rates:', error);
    return null;
  }
}

// Calculate quote based on input data
function calculateQuote(data) {
  const rates = loadRates();
  if (!rates) {
    throw new Error('Could not load rates');
  }

  let totalPrice = 0;

  // Calculate grass
  if (data.grassM2 && data.grassM2 > 0) {
    totalPrice += data.grassM2 * rates.grass.pricePerM2;
  }

  // Calculate tiles
  if (data.tilesM2 && data.tilesM2 > 0) {
    totalPrice += data.tilesM2 * rates.tiles.pricePerM2;
  }

  // Calculate hedge
  if (data.hedgeMeters && data.hedgeMeters > 0) {
    totalPrice += data.hedgeMeters * rates.hedge.pricePerMeter;
  }

  // Calculate extra options
  if (data.extraOptions && Array.isArray(data.extraOptions)) {
    data.extraOptions.forEach(optionKey => {
      if (rates.extraOptions[optionKey]) {
        totalPrice += rates.extraOptions[optionKey].price;
      }
    });
  }

  return totalPrice;
}

// Initialize orders file if it doesn't exist
function initializeOrdersFile() {
  if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(
      ordersFile,
      JSON.stringify({ orders: [], lastId: 0 }, null, 2)
    );
  }
}

// Read existing orders
function readOrders() {
  initializeOrdersFile();
  try {
    const ordersData = fs.readFileSync(ordersFile, 'utf-8');
    return JSON.parse(ordersData);
  } catch (error) {
    console.error('Error reading orders:', error);
    return { orders: [], lastId: 0 };
  }
}

// Save orders
function saveOrders(data) {
  fs.writeFileSync(ordersFile, JSON.stringify(data, null, 2));
}

// API Routes

// GET /api/rates - Get all rates
app.get('/api/rates', (req, res) => {
  const rates = loadRates();
  if (rates) {
    res.json(rates);
  } else {
    res.status(500).json({ error: 'Could not load rates' });
  }
});

// POST /api/calculate-quote - Calculate quote without saving
app.post('/api/calculate-quote', (req, res) => {
  try {
    const quote = calculateQuote(req.body);
    res.json({ 
      success: true, 
      quote: parseFloat(quote.toFixed(2))
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /orders - Save a new order
app.post('/orders', (req, res) => {
  try {
    const orderData = req.body;

    // Calculate quote for the order
    const quotePrice = calculateQuote(orderData);

    // Read existing orders
    const ordersData = readOrders();

    // Create new order
    const newOrder = {
      id: ++ordersData.lastId,
      timestamp: new Date().toISOString(),
      grassM2: orderData.grassM2 || 0,
      tilesM2: orderData.tilesM2 || 0,
      hedgeMeters: orderData.hedgeMeters || 0,
      extraOptions: orderData.extraOptions || [],
      description: orderData.description || '',
      workDate: orderData.workDate || null,
      customerName: orderData.customerName || '',
      customerEmail: orderData.customerEmail || '',
      customerPhone: orderData.customerPhone || '',
      quotedPrice: parseFloat(quotePrice.toFixed(2)),
      status: 'pending'
    };

    // Add order to list
    ordersData.orders.push(newOrder);

    // Save updated orders
    saveOrders(ordersData);

    console.log('Order saved:', newOrder);

    res.json({
      success: true,
      message: 'Order saved successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/orders - Get all orders (admin view)
app.get('/api/orders', (req, res) => {
  try {
    const ordersData = readOrders();
    res.json(ordersData.orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/status - Update order status
app.patch('/api/orders/:id/status', (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  const newStatus = req.body.status;
  const allowedStatuses = ['pending', 'accepted', 'rejected', 'completed'];

  if (!allowedStatuses.includes(newStatus)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  try {
    const ordersData = readOrders();
    const order = ordersData.orders.find(o => o.id === orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.status = newStatus;
    saveOrders(ordersData);

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/stats - Basic order statistics for admin
app.get('/api/stats', (req, res) => {
  try {
    const ordersData = readOrders();
    const orders = ordersData.orders;

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + (Number(o.quotedPrice) || 0), 0),
      byStatus: orders.reduce((map, o) => {
        map[o.status] = (map[o.status] || 0) + 1;
        return map;
      }, {})
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Rates loaded from data/rates.json');
});
