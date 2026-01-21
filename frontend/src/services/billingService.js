import axios from 'axios';

const API_URL = 'http://localhost:8080/api/billing';

// Obtener la cuenta buscando por ID de Reserva
export const getFolioByReservation = async (reservationId) => {
  try {
    const response = await axios.get(`${API_URL}/reservation/${reservationId}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo folio:", error);
    throw error;
  }
};
//Crear Cuenta
export const createFolio = async (reservationId) => {
  try {
    const response = await axios.post(API_URL, { reservationId });
    return response.data;
  } catch (error) {
    console.error("Error creando folio:", error);
    throw error;
  }
};

// Agregar un cargo a la cuenta
export const addCharge = async (folioId, description, amount) => {
  try {
    const response = await axios.post(`${API_URL}/${folioId}/charges`, {
      description,
      amount
    });
    return response.data;
  } catch (error) {
    console.error("Error agregando cargo:", error);
    throw error;
  }
};
export const payFolio = async (folioId) => {
  const response = await axios.post(`${API_URL}/${folioId}/pay`);
  return response.data;
};

export const getRevenue = async () => {
  const response = await axios.get(`${API_URL}/reports/revenue`);
  return response.data;
};
export const getRevenueReport = async (start, end) => {
  // Si no hay fechas, busca todo
  const query = start && end ? `?startDate=${start}&endDate=${end}` : '';
  const response = await axios.get(`${API_URL}/reports/revenue${query}`);
  return response.data;
};