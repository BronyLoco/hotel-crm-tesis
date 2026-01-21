import axios from 'axios';
const API_URL = 'http://localhost:8080/api/hotels';

export const createHotel = async (hotelData) => {
  const response = await axios.post(API_URL, hotelData);
  return response.data;
};

export const getMyHotels = async (tenantId) => {
  const response = await axios.get(`${API_URL}?tenantId=${tenantId}`);
  return response.data;
};