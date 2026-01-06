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
export const updateRoomStatus = async (roomNumber, status) => {
  try {
    const response = await axios.patch(`${API_URL}/${roomNumber}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error actualizando habitación:", error);
    throw error;
  }
};