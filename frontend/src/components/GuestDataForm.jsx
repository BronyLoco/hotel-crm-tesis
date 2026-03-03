import React, { useState, useEffect, useMemo } from 'react';
import { Country, City } from 'country-state-city';

function GuestDataForm({ guest, onChange, disabled = false }) {
  
  // 1. Configurar el traductor de países a Español
  const translator = useMemo(() => new Intl.DisplayNames(['es'], { type: 'region' }), []);

  // 2. Preparar lista de países en Español
  // Mapeamos la lista original y le agregamos el nombre traducido
  const allCountries = useMemo(() => {
    return Country.getAllCountries().map(c => ({
      ...c,
      // Intentamos traducir, si falla usamos el nombre original
      spanishName: translator.of(c.isoCode) || c.name 
    }));
  }, [translator]);
  
  const [availableCities, setAvailableCities] = useState([]);

  // --- EFECTO DE CASCADA (PAÍS -> CIUDAD) ---
  useEffect(() => {
    if (guest.country) {
      // AHORA BUSCAMOS POR EL NOMBRE EN ESPAÑOL
      // (Porque el input tendrá el valor en español seleccionado del datalist)
      const selectedCountry = allCountries.find(c => c.spanishName === guest.country);
      
      if (selectedCountry) {
        // Cargar ciudades usando el código ISO interno
        const cities = City.getCitiesOfCountry(selectedCountry.isoCode);
        setAvailableCities(cities);
      } else {
        setAvailableCities([]);
      }
    } else {
      setAvailableCities([]);
    }
  }, [guest.country, allCountries]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...guest, [name]: value });
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    // Permitir letras, espacios y tildes
    if (/^[a-zA-Z\u00C0-\u017F\s]*$/.test(val)) {
        onChange({ ...guest, [e.target.name]: val });
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '15px', backgroundColor: disabled ? '#e8f5e9' : '#fff', border: '1px solid #ddd', borderRadius: '8px' }}>
      
      {/* IDENTIDAD */}
      <div style={{display:'flex', flexDirection:'column'}}>
          <label style={{fontSize:'0.75em', color:'#666', marginBottom:'2px'}}>Nombres</label>
          <input 
            name="firstName" placeholder="Ej. Juan" required
            value={guest.firstName || ''} onChange={handleNameChange} disabled={disabled} 
            style={{padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}}
          />
      </div>
      <div style={{display:'flex', flexDirection:'column'}}>
          <label style={{fontSize:'0.75em', color:'#666', marginBottom:'2px'}}>Apellidos</label>
          <input 
            name="lastName" placeholder="Ej. Perez" required
            value={guest.lastName || ''} onChange={handleNameChange} disabled={disabled} 
            style={{padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}}
          />
      </div>
      
      <div style={{gridColumn: 'span 2', display:'flex', flexDirection:'column'}}>
        <label style={{fontSize:'0.8em', fontWeight:'bold', color:'#1565c0'}}>C.I. / Pasaporte (Documento):</label>
        <input 
            name="documentId" placeholder="Número de Documento" required
            value={guest.documentId || ''} onChange={handleChange} disabled={disabled} 
            style={{width:'100%', padding:'10px', border:'1px solid #1565c0', borderRadius:'4px', fontSize:'1.1em'}}
        />
      </div>

      {/* --- NACIONALIDAD --- */}
      <div style={{display:'flex', flexDirection:'column'}}>
        <label style={{fontSize:'0.75em', color:'#666'}}>Nacionalidad</label>
        <input 
            name="nationality" 
            list="country-list" // Reutilizamos la lista de países para sugerir nacionalidad
            placeholder="Escriba para buscar..."
            value={guest.nationality || ''}
            required
            onChange={handleNameChange} 
            disabled={disabled} 
            style={{padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}}
        />
      </div>

      {/* --- FECHA NACIMIENTO --- */}
      <div style={{display:'flex', flexDirection:'column'}}>
        <label style={{fontSize:'0.75em', color:'#666'}}>Fecha Nacimiento</label>
        <input 
            name="birthDate" type="date"
            required
            value={guest.birthDate || ''} onChange={handleChange} disabled={disabled} 
            style={{padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}}
        />
      </div>

      <div style={{display:'flex', flexDirection:'column'}}>
        <label style={{fontSize:'0.75em', color:'#666'}}>Estado Civil</label>
        <select 
            name="civilStatus" 
            value={guest.civilStatus || 'SOLTERO'} 
            required
            onChange={handleChange} 
            disabled={disabled}
            style={{padding:'9px', border:'1px solid #ccc', borderRadius:'4px', backgroundColor:'white'}}
        >
            <option value="SOLTERO">Soltero/a</option>
            <option value="CASADO">Casado/a</option>
            <option value="DIVORCIADO">Divorciado/a</option>
            <option value="VIUDO">Viudo/a</option>
        </select>
      </div>

      {/* --- PAÍS (EN ESPAÑOL) --- */}
      <div style={{display:'flex', flexDirection:'column'}}>
        <label style={{fontSize:'0.75em', color:'#666'}}>País de Origen</label>
        <input 
            name="country" 
            list="country-list"
            placeholder="Escriba país (ej. España)..."
            required
            value={guest.country || ''} 
            onChange={handleChange} 
            disabled={disabled} 
            style={{padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}}
        />
        {/* Aquí está la magia: Value es el nombre en Español */}
        <datalist id="country-list">
            {allCountries.map(c => <option key={c.isoCode} value={c.spanishName} />)}
        </datalist>
      </div>

      {/* --- CIUDAD --- */}
      <div style={{display:'flex', flexDirection:'column'}}>
        <label style={{fontSize:'0.75em', color:'#666'}}>Ciudad</label>
        <input 
            name="city" 
            list="city-list"
            placeholder={guest.country ? "Escriba ciudad..." : "Primero seleccione País"}
            value={guest.city || ''} 
            required
            onChange={handleChange} 
            disabled={disabled || !guest.country || !availableCities.length} 
            style={{padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}}
        />
        <datalist id="city-list">
            {availableCities.map((c, index) => <option key={`${c.name}-${index}`} value={c.name} />)}
        </datalist>
      </div>

      {/* CONTACTO */}
      <div style={{gridColumn: 'span 2', display:'flex', flexDirection:'column'}}>
        <label style={{fontSize:'0.75em', color:'#666'}}>Email (Opcional)</label>
        <input 
            name="email" placeholder="ejemplo@correo.com" type="email"
            value={guest.email || ''} onChange={handleChange} disabled={disabled} 
            style={{padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}}
        />
      </div>
    </div>
  );
}

export default GuestDataForm;