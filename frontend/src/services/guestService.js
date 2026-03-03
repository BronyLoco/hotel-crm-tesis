import axios from 'axios';

// La URL de tu backend (Guests Service)
const API_URL = 'http://localhost:8080/api/guests';

export const getGuests = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error al obtener huéspedes:", error);
    throw error;
  }
};

export const createGuest = async (data, customHeaders = null) => {
  const config = {};
  if (customHeaders) {
    config.headers = customHeaders;
  }

  const response = await axios.post(`${API_URL}`, data, config);
  return response.data;
};

export const createGroupEvent = async (data) => {
  // data: { name, code, expectedGuests... }
  const response = await axios.post(`${API_URL}/groups`, data);
  return response.data;
};

export const getGroupEvents = async () => {
  const response = await axios.get(`${API_URL}/groups`);
  return response.data;
};

export const getGuestsByGroup = async (code) => {
  const response = await axios.get(`${API_URL}?groupCode=${code}`);
  return response.data;
};

export const updateGuest = async (id, data) => {
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data;
};