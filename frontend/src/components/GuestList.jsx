import { useEffect, useState } from 'react';
import { getGuests } from '../services/guestService';

function GuestList() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Este efecto se ejecuta cuando la página carga
  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      const data = await getGuests();
      setGuests(data);
    } catch (error) {
      alert("Error cargando los datos. Revisa que el Backend esté encendido.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div>
      <h2>Listado de Huéspedes</h2>
      <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Documento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((guest) => (
            <tr key={guest.id}>
              <td>{guest.id}</td>
              <td>{guest.firstName} {guest.lastName}</td>
              <td>{guest.email}</td>
              <td>{guest.documentId}</td>
              <td>
                <button>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {guests.length === 0 && <p>No hay huéspedes registrados aún.</p>}
    </div>
  );
}

export default GuestList;