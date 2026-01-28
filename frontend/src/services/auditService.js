import axios from 'axios';

// Apuntamos al Gateway
const API_URL = 'http://localhost:8080/api/audit';

export const getAuditLogs = async (hotelId) => {
  try {
    const response = await axios.get(`${API_URL}?hotelId=${hotelId}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo logs de auditoría:", error);
    throw error;
  }
};