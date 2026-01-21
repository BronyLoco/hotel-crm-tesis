import axios from 'axios';

// Nota que este apunta al puerto 3002
const API_URL = 'http://localhost:8080/api/rooms';

export const getRooms = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error al obtener habitaciones:", error);
    throw error;
  }
};
export const updateRoomStatus = async (roomNumber, status, occupancyChange = 0) => {
  const payload = {};
  if (status) payload.status = status;
  if (occupancyChange !== 0) payload.occupancyChange = occupancyChange;
  
  const response = await axios.patch(`${API_URL}/${roomNumber}/status`, payload);
  return response.data;
};
export const initializeRooms = async () => {
  const response = await axios.post(`${API_URL}/init`);
  return response.data;
};