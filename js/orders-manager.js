const ordersListContainer = document.getElementById('orders-list');
const ordersTbody = document.getElementById('orders-tbody');
const statsGrid = document.getElementById('stats-grid');
const offersGrid = document.getElementById('offers-grid');

const statusNames = {
  pending: 'In behandeling',
  accepted: 'Geaccepteerd',
  rejected: 'Afgewezen',
  completed: 'Voltooid'
};

const formatDate = date => (date ? new Date(date).toLocaleDateString('nl-NL') : 'Niet ingesteld');

function renderCustomerOrders(orders) {
  if (!orders?.length) {
    ordersListContainer.innerHTML = '<div class="order-placeholder"><p>Geen bestellingen gevonden.</p></div>';
    return;
  }

  ordersListContainer.innerHTML = orders.map(order => {
    const details = [
      order.grassM2 && `${order.grassM2}m² gras`,
      order.tilesM2 && `${order.tilesM2}m² tegels`,
      order.hedgeMeters && `${order.hedgeMeters}m heg`
    ].filter(Boolean).join(', ');

    const extras = order.extraOptions?.length ? `, +${order.extraOptions.length} opties` : '';

    return `
      <div class="order-item">
        <div class="order-header">
          <h4>Offerte #${order.id}</h4>
          <span class="order-status status-${order.status}">${statusNames[order.status] || order.status}</span>
        </div>

        <div class="order-details">
          <p><strong>Aanvraagdatum:</strong> ${formatDate(order.timestamp)}</p>
          <p><strong>Werkdatum:</strong> ${formatDate(order.workDate)}</p>
          <p><strong>Gegevens:</strong> ${details}${extras}</p>
          <p><strong>Klant:</strong> ${order.customerName}</p>
          <p><strong>E-mail:</strong> ${order.customerEmail}</p>
          ${order.customerPhone ? `<p><strong>Telefoon:</strong> ${order.customerPhone}</p>` : ''}
          ${order.description ? `<p><strong>Beschrijving:</strong> ${order.description}</p>` : ''}
        </div>

        <div class="order-footer">
          <span class="order-price">€ ${Number(order.quotedPrice || 0).toFixed(2)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderAdminTable(orders) {
  if (!orders?.length) {
    ordersTbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Geen bestellingen gevonden.</td></tr>';
    return;
  }

  ordersTbody.innerHTML = orders.map(order => `
    <tr data-order-id="${order.id}">
      <td>${order.id}</td>
      <td>${order.customerName}</td>
      <td>${order.description || '-'}</td>
      <td>€ ${Number(order.quotedPrice || 0).toFixed(2)}</td>
      <td>${formatDate(order.timestamp)}</td>
      <td>
        <select class="status-dropdown">
          ${Object.entries(statusNames).map(([value,label]) => `<option value="${value}" ${order.status===value?'selected':''}>${label}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn btn-secondary btn-small status-update-btn">Opslaan</button></td>
    </tr>
  `).join('');

  ordersTbody.querySelectorAll('.status-update-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('tr');
      const orderId = row.dataset.orderId;
      const newStatus = row.querySelector('.status-dropdown').value;

      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        const result = await res.json();

        if (!result.success) {
          alert('Status update mislukt: ' + (result.error || 'onbekende fout'));
          return;
        }

        alert('Status geüpdatet naar ' + statusNames[newStatus]);
        loadOrders();
      } catch (error) {
        console.error('Fout bij status update', error);
        alert('Fout bij status update');
      }
    });
  });
}

function renderAdminStats(stats, orders) {
  if (!stats) return;

  if (statsGrid) {
    statsGrid.innerHTML = `
      <article class="stat-card"><div class="stat-content"><h3>Totaal aantal orders</h3><p class="stat-number">${stats.totalOrders}</p></div></article>
      <article class="stat-card"><div class="stat-content"><h3>Totaal omzet</h3><p class="stat-number">€ ${stats.totalRevenue.toFixed(2)}</p></div></article>
      <article class="stat-card"><div class="stat-content"><h3>Status verdeling</h3><p>${Object.entries(stats.byStatus).map(([k,v]) => `${statusNames[k]||k}: ${v}`).join(', ')}</p></div></article>
    `;
  }

  if (offersGrid) {
    const pendingOffers = orders.filter(o => o.status === 'pending').slice(0,3);
    if (!pendingOffers.length) {
      offersGrid.innerHTML = '<p>Geen openstaande offertes.</p>';
      return;
    }

    offersGrid.innerHTML = pendingOffers.map(order => `
      <article class="offer-card">
        <div class="offer-header"><h3>#${order.id}</h3><span class="offer-date">${formatDate(order.timestamp)}</span></div>
        <div class="offer-info"><p>€ ${Number(order.quotedPrice).toFixed(2)}</p><p>${order.customerName} - ${order.description || '-'}</p></div>
      </article>
    `).join('');
  }
}

let ordersGlobal = [];

const loadOrders = async () => {
  try {
    const res = await fetch('/api/orders');
    const orders = await res.json();
    ordersGlobal = orders;

    if (ordersTbody) {
      renderAdminTable(orders);
      const statsRes = await fetch('/api/stats');
      const stats = await statsRes.json();
      renderAdminStats(stats, orders);
      return;
    }

    if (ordersListContainer) {
      renderCustomerOrders(orders);
      return;
    }
  } catch (err) {
    console.error('Error loading orders:', err);
    if (ordersListContainer) {
      ordersListContainer.innerHTML = '<div class="order-placeholder"><p>Fout bij laden van bestellingen.</p></div>';
    }
    if (ordersTbody) {
      ordersTbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Fout bij laden van bestellingen.</td></tr>';
    }
  }
};

// Admin filters
const filterControls = document.querySelectorAll('.filter-controls .btn-filter');
filterControls.forEach(btn => {
  btn.addEventListener('click', () => {
    filterControls.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.textContent.trim().toLowerCase();
    let filtered = ordersGlobal;

    if (filter === 'in behandeling') filtered = ordersGlobal.filter(o => o.status === 'pending');
    if (filter === 'goedgekeurd') filtered = ordersGlobal.filter(o => o.status === 'accepted');
    if (filter === 'afgekeurd') filtered = ordersGlobal.filter(o => o.status === 'rejected');

    if (ordersTbody) {
      renderAdminTable(filtered);
    }
  });
});

loadOrders();
setInterval(loadOrders, 30000);

window.ordersManager = { loadOrders };