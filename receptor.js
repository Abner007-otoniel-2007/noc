// receptor.js

let mapReceiver;
// Diccionario de marcadores por emisor
const markers = {};

// Función de inicialización del mapa
document.addEventListener('DOMContentLoaded', () => {
    // Coordenadas iniciales (ej. centro de San Salvador, El Salvador)
    const initialCoords = [13.6929, -89.2182]; // Leaflet usa [lat, lng]

    mapReceiver = L.map('map_receiver').setView(initialCoords, 12); // 'map_receiver' es el ID del div

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapReceiver);

    // Una vez que el mapa esté listo, empieza a escuchar las ubicaciones
    escucharUbicacionEnTiempoReal();
});

// Función para escuchar las ubicaciones en tiempo real
function escucharUbicacionEnTiempoReal() {
  const ubicacionDisplay = document.getElementById("ubicacion_texto");

  db.collection("ubicaciones").onSnapshot((snapshot) => {
    let count = 0;
    snapshot.docChanges().forEach((change) => {
      const id = change.doc.id;
      const data = change.doc.data();
      const lat = data && typeof data.latitude === 'number' ? data.latitude : null;
      const lng = data && typeof data.longitude === 'number' ? data.longitude : null;

      if (change.type === 'removed') {
        if (markers[id]) {
          mapReceiver.removeLayer(markers[id]);
          delete markers[id];
        }
        return;
      }

      if (lat == null || lng == null) return;
      const coords = [lat, lng];
      count += 1;

      if (markers[id]) {
        markers[id].setLatLng(coords);
      } else {
        markers[id] = L.marker(coords).addTo(mapReceiver).bindPopup(`Unidad: ${id}`);
      }
    });

    if (ubicacionDisplay) {
      ubicacionDisplay.innerHTML = `<p>Unidades activas: ${Object.keys(markers).length}</p>`;
    }
  }, (error) => {
    console.error("Error al escuchar ubicaciones:", error);
    if (ubicacionDisplay) {
      ubicacionDisplay.innerHTML = "<p>Error al cargar ubicaciones.</p>";
    }
  });
}