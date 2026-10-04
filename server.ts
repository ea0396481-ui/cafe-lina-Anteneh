import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_RESERVATIONS,
  INITIAL_CUSTOMERS,
  INITIAL_EMPLOYEES,
  INITIAL_INVENTORY,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_RECIPE_COSTS,
  INITIAL_EPR_RECORDS,
} from './src/data/mockData.ts';
import { Order, MenuItem, Reservation, InventoryItem, Supplier, PurchaseOrder, Employee } from './src/types.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // In-memory data state
  let menuItems: MenuItem[] = [...INITIAL_MENU_ITEMS];
  let orders: Order[] = [...INITIAL_ORDERS];
  let reservations: Reservation[] = [...INITIAL_RESERVATIONS];
  let inventory: InventoryItem[] = [...INITIAL_INVENTORY];
  let suppliers: Supplier[] = [...INITIAL_SUPPLIERS];
  let purchaseOrders: PurchaseOrder[] = [...INITIAL_PURCHASE_ORDERS];
  let employees: Employee[] = [...INITIAL_EMPLOYEES];
  let recipeCosts = [...INITIAL_RECIPE_COSTS];
  let eprRecords = [...INITIAL_EPR_RECORDS];
  let customers = [...INITIAL_CUSTOMERS];

  // ===================== REST API ENDPOINTS ===================== //

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'Cafe Lina Full Stack Enterprise ERP', timestamp: new Date() });
  });

  // Authentication Mock (JWT Simulation with Roles)
  app.post('/api/auth/login', (req, res) => {
    const { email, password, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const assignedRole = role || (email.includes('admin') ? 'Admin' : email.includes('kitchen') ? 'Kitchen' : email.includes('cashier') ? 'Cashier' : 'Customer');
    const token = `jwt_mock_token_${Date.now()}_${assignedRole.toLowerCase()}`;

    res.json({
      token,
      user: {
        id: `usr_${Date.now()}`,
        name: email.split('@')[0].toUpperCase(),
        email,
        role: assignedRole,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, phone, address } = req.body;
    const newCust = {
      id: `CUST-${Date.now()}`,
      name: name || 'Guest User',
      email: email || 'guest@cafelina.com',
      phone: phone || '+251 900 000 000',
      address: address || 'Addis Ababa',
      tier: 'Bronze' as const,
      rewardPoints: 100,
      totalSpent: 0,
      wishlistIds: [],
      ordersCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    customers.push(newCust);
    res.json({ success: true, customer: newCust });
  });

  // MENU API
  app.get('/api/menu', (req, res) => {
    const { category, search } = req.query;
    let filtered = [...menuItems];

    if (category && category !== 'All') {
      filtered = filtered.filter((item) => item.category === category || item.subcategory === category);
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        (item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  });

  app.post('/api/menu', (req, res) => {
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      ...req.body,
      rating: 5.0,
      reviewsCount: 1,
      isAvailable: req.body.isAvailable ?? true,
    };
    menuItems.unshift(newItem);
    res.status(201).json(newItem);
  });

  app.put('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    const index = menuItems.findIndex((i) => i.id === id);
    if (index === -1) return res.status(404).json({ error: 'Item not found' });

    menuItems[index] = { ...menuItems[index], ...req.body };
    res.json(menuItems[index]);
  });

  app.delete('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    menuItems = menuItems.filter((i) => i.id !== id);
    res.json({ success: true, message: 'Item deleted' });
  });

  // ORDERS API
  app.get('/api/orders', (_req, res) => {
    res.json(orders);
  });

  app.post('/api/orders', (req, res) => {
    const { customerName, customerEmail, customerPhone, deliveryType, deliveryAddress, items, paymentMethod, couponCode, notes } = req.body;

    const subtotal = items.reduce((acc: number, item: any) => acc + item.menuItem.price * item.quantity, 0);
    const discount = couponCode === 'LINA10' ? Math.round(subtotal * 0.1) : 0;
    const deliveryFee = deliveryType === 'Delivery' ? 50 : 0;
    const total = subtotal - discount + deliveryFee;

    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName || 'Valued Guest',
      customerEmail: customerEmail || 'guest@cafelina.com',
      customerPhone: customerPhone || '+251 900 123 456',
      deliveryType: deliveryType || 'Delivery',
      deliveryAddress: deliveryAddress || 'Bole Road, Addis Ababa',
      items: items || [],
      subtotal,
      discount,
      tax: Math.round(subtotal * 0.05),
      deliveryFee,
      total,
      currency: 'ETB',
      paymentMethod: paymentMethod || 'Stripe',
      paymentStatus: 'Paid',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      estimatedDeliveryMinutes: 25,
      couponCode,
      notes,
    };

    orders.unshift(newOrder);
    res.status(201).json(newOrder);
  });

  app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = orders.find((o) => o.id === id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    res.json(order);
  });

  // RESERVATIONS API
  app.get('/api/reservations', (_req, res) => {
    res.json(reservations);
  });

  app.post('/api/reservations', (req, res) => {
    const newRes: Reservation = {
      id: `RES-${Math.floor(300 + Math.random() * 700)}`,
      customerName: req.body.customerName || 'Guest',
      email: req.body.email || 'guest@cafelina.com',
      phone: req.body.phone || '+251 900 000 000',
      date: req.body.date || new Date().toISOString().split('T')[0],
      time: req.body.time || '19:00',
      guests: req.body.guests || 2,
      seatingPreference: req.body.seatingPreference || 'Terrace',
      specialRequests: req.body.specialRequests || '',
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
    };
    reservations.unshift(newRes);
    res.status(201).json(newRes);
  });

  // INVENTORY API
  app.get('/api/inventory', (_req, res) => {
    res.json(inventory);
  });

  app.put('/api/inventory/:id/stock', (req, res) => {
    const { id } = req.params;
    const { change, action } = req.body; // action: 'add' | 'subtract'
    const item = inventory.find((i) => i.id === id);
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });

    if (action === 'subtract') {
      item.stockQty = Math.max(0, item.stockQty - Number(change));
    } else {
      item.stockQty += Number(change);
      item.lastRestocked = new Date().toISOString().split('T')[0];
    }

    res.json(item);
  });

  // SUPPLIERS & PURCHASE ORDERS
  app.get('/api/suppliers', (_req, res) => res.json(suppliers));
  app.get('/api/purchase-orders', (_req, res) => res.json(purchaseOrders));

  app.post('/api/purchase-orders', (req, res) => {
    const newPo: PurchaseOrder = {
      id: `PO-${Math.floor(9000 + Math.random() * 1000)}`,
      ...req.body,
      status: 'Sent',
      orderDate: new Date().toISOString().split('T')[0],
    };
    purchaseOrders.unshift(newPo);
    res.status(201).json(newPo);
  });

  // HR & EMPLOYEES API
  app.get('/api/employees', (_req, res) => res.json(employees));

  // RECIPE COSTING
  app.get('/api/recipes', (_req, res) => res.json(recipeCosts));

  // EPR COMPLIANCE API
  app.get('/api/epr', (_req, res) => res.json(eprRecords));

  // ANALYTICS & DASHBOARD METRICS API
  app.get('/api/analytics', (_req, res) => {
    const todayOrdersCount = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const customersCount = customers.length;
    const pendingOrdersCount = orders.filter((o) => o.status === 'Pending' || o.status === 'Preparing').length;

    const monthlySales = [
      { month: 'Jan', revenue: 145000, orders: 320 },
      { month: 'Feb', revenue: 162000, orders: 380 },
      { month: 'Mar', revenue: 178000, orders: 410 },
      { month: 'Apr', revenue: 155000, orders: 350 },
      { month: 'May', revenue: 195000, orders: 460 },
      { month: 'Jun', revenue: 210000, orders: 500 },
      { month: 'Jul', revenue: 245000, orders: 580 },
      { month: 'Aug', revenue: totalRevenue + 18750, orders: todayOrdersCount + 45 },
    ];

    res.json({
      metrics: {
        todayOrders: todayOrdersCount + 45,
        totalRevenue: totalRevenue + 18750,
        customers: customersCount + 320,
        pendingOrders: pendingOrdersCount + 8,
      },
      monthlySales,
    });
  });

  // Mount Vite or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cafe Lina Express & ERP Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
