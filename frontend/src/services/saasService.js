import axios from 'axios';

// Apuntamos al Gateway (que redirige al 3006)
const API_URL = 'http://localhost:8080/api/saas';

export const getPlans = async () => {
  const response = await axios.get(`${API_URL}/plans`);
  return response.data;
};

export const registerManager = async (data) => {
  // data: { username, password, fullName, companyName, planId }
  const response = await axios.post(`${API_URL}/register`, data);
  return response.data;
};

export const processPayment = async (tenantId, cardNumber) => {
  const response = await axios.post(`${API_URL}/pay`, { tenantId, cardNumber });
  return response.data;
};

export const getTenantByUser = async (userId) => {
  const response = await axios.get(`${API_URL}/user/${userId}`);
  return response.data;
};