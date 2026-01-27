import axios from 'axios';
const API_URL = 'http://localhost:8080/api/hotels';

export const createHotel = async (hotelData) => {
  const response = await axios.post(API_URL, hotelData);
  return response.data;
};

export const getMyHotels = async (user, tenantId = null) => {
  // Construimos la query string con todos los datos necesarios
  let query = `?userId=${user.id}&role=${user.role}`;
  
  if (tenantId) {
    query += `&tenantId=${tenantId}`;
  }

  const response = await axios.get(`${API_URL}${query}`);
  return response.data;
};