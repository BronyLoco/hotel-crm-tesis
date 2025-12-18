import axios from 'axios';

// La URL de tu backend (Guests Service)
const API_URL = 'http://localhost:3001/api/guests';

export const getGuests = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error al obtener huéspedes:", error);
    throw error;
  }
};

export const createGuest = async (guestData) => {
  try {
    const response = await axios.post(API_URL, guestData);
    return response.data;
  } catch (error) {
    console.error("Error al crear huésped:", error);
    throw error;
  }
};