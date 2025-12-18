import axios from 'axios';

// Nota que este apunta al puerto 3002
const API_URL = 'http://localhost:3002/api/rooms';

export const getRooms = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error al obtener habitaciones:", error);
    throw error;
  }
};