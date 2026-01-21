import axios from 'axios';

const API_URL = 'http://localhost:8080/api/reservations';

export const createReservation = async (reservationData) => {
  try {
    const response = await axios.post(API_URL, reservationData);
    return response.data;
  } catch (error) {
    // Si el backend responde con error (ej. "No hay disponibilidad"), lanzamos ese mensaje
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

export const getReservations = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};
export const doCheckIn = async (reservationId, roomNumber) => {
  // POST /api/reservations/1/checkin
  const response = await axios.post(`${API_URL}/${reservationId}/checkin`, { roomNumber });
  return response.data;
};
export const doCheckOut = async (reservationId) => {
  const response = await axios.post(`${API_URL}/${reservationId}/checkout`);
  return response.data;
};
export const extendStay = async (reservationId, newCheckOut) => {
  const response = await axios.patch(`${API_URL}/${reservationId}/extend`, { newCheckOut });
  return response.data;
};