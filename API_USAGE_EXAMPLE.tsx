// ตัวอย่างการใช้ API จากฝั่ง Frontend

// 1. Register & Login
async function register() {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'password123',
      role: 'shelter_staff',
      phone: '0812345678',
    }),
  });
  const data = await response.json();
  localStorage.setItem('token', data.data.token);
  return data;
}

async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  localStorage.setItem('token', data.data.token);
  return data;
}

// 2. Helper function เพื่อ fetch with auth
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  return response.json();
}

// 3. Submit Request (ศูนย์พักพิง ยื่นคำร้อง)
async function submitRequest(shelterId: string, items: any[]) {
  return apiCall('/api/requests', {
    method: 'POST',
    body: JSON.stringify({
      shelterId,
      items, // [{ itemId: '...', quantityRequested: 10 }]
    }),
  });
}

// 4. Get All Requests
async function getAllRequests(status?: string) {
  let url = '/api/requests';
  if (status) {
    url += `?status=${status}`;
  }
  return apiCall(url);
}

// 5. Get Request Detail
async function getRequestDetail(requestId: string) {
  return apiCall(`/api/requests/${requestId}`);
}

// 6. Approve Request (Warehouse Staff)
async function approveRequest(requestId: string, items: any[], warehouseId: string) {
  return apiCall(`/api/requests/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify({
      items, // [{ itemId: '...', quantityApproved: 8 }]
      warehouseId,
    }),
  });
}

// 7. Transfer Items & Cut Stock (Warehouse Staff)
async function transferItems(requestId: string, items: any[], warehouseId: string) {
  return apiCall(`/api/requests/${requestId}/transfer`, {
    method: 'POST',
    body: JSON.stringify({
      items, // [{ itemId: '...', quantityTransferred: 8 }]
      warehouseId,
    }),
  });
}

// 8. Check Availability
async function checkAvailability(itemId: string, quantity: number) {
  return apiCall('/api/stocks/check-availability', {
    method: 'POST',
    body: JSON.stringify({
      itemId,
      quantity,
    }),
  });
}

// 9. Get Low Stock Items
async function getLowStockItems() {
  return apiCall('/api/stocks/low-stock');
}

// 10. Get Shelters
async function getShelters(province?: string) {
  let url = '/api/shelters';
  if (province) {
    url += `?province=${province}`;
  }
  return apiCall(url);
}

// 11. Dashboard - Overview
async function getDashboardOverview() {
  return apiCall('/api/dashboard/overview');
}

// 12. Dashboard - Shelter Status
async function getShelterStatus() {
  return apiCall('/api/dashboard/shelter-status');
}

// 13. Dashboard - Stock Status
async function getStockStatus(warehouseId: string) {
  return apiCall(`/api/dashboard/stock-status?warehouseId=${warehouseId}`);
}

// ===== React Hook Example =====

import { useState, useEffect } from 'react';

function RequestList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const data = await getAllRequests();
      setRequests(data.data);
      setLoading(false);
    };

    fetchRequests();
  }, []);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {requests.map((request: any) => (
        <div key={request._id}>
          <h3>{request.shelterId.name}</h3>
          <p>Status: {request.status}</p>
          <p>Items: {request.items.length}</p>
        </div>
      ))}
    </div>
  );
}

// ===== Submit Form Example =====

function SubmitRequestForm() {
  const [formData, setFormData] = useState<{
    shelterId: string;
    items: { itemId: string; quantityRequested: number }[];
  }>({
    shelterId: '',
    items: [],
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Check availability ก่อน
    for (const item of formData.items) {
      const available = await checkAvailability(item.itemId, item.quantityRequested);
      if (!available.data.isAvailable) {
        alert('Item not available in required quantity');
        return;
      }
    }

    // Submit request
    const result = await submitRequest(formData.shelterId, formData.items);
    if (result.success) {
      alert('Request submitted successfully');
    } else {
      alert('Error: ' + result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}

export {
  register,
  login,
  apiCall,
  submitRequest,
  getAllRequests,
  getRequestDetail,
  approveRequest,
  transferItems,
  checkAvailability,
  getLowStockItems,
  getShelters,
  getDashboardOverview,
  getShelterStatus,
  getStockStatus,
};
