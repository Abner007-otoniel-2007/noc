let mapSender;
let markerSender;
let envioIntervalId = null;
let watchId = null;
let ultimaUbicacion = null;

// Identificador único por emisor (persistido en este navegador)
const SENDER_KEY = "senderId";
let senderId = localStorage.getItem(SENDER_KEY);
if (!senderId) {
    senderId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
    localStorage.setItem(SENDER_KEY, senderId);
}

// Inicializa el mapa
document.addEventListener('DOMContentLoaded', () => {
    const initialCoords = [13.973749415309564, -89.69582714516869];
    mapSender = L.map('map_sender').setView(initialCoords, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapSender);

    markerSender = L.marker(initialCoords).addTo(mapSender)
        .bindPopup("Tu ubicación")
        .openPopup();
});

function enviarUbicacionEnTiempoReal() {
    const ubicacionTexto = document.getElementById("ubicacion_actual_texto");

    if (!navigator.geolocation) {
        ubicacionTexto.innerHTML = "<p>Tu navegador no soporta la geolocalización.</p>";
        alert("Tu navegador no soporta la geolocalización.");
        return;
    }

    ubicacionTexto.innerHTML = "<p>Estado: Compartiendo ubicación...</p>";

    const options = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
    };

    // Comenzamos a rastrear ubicación y guardar la última conocida
    watchId = navigator.geolocation.watchPosition((position) => {
        ultimaUbicacion = position;
        actualizarUbicacion(position, ubicacionTexto); // para mostrar en pantalla
    }, (error) => {
        mostrarError(error, ubicacionTexto);
    }, options);

    // Cada 10 segundos, enviamos la última ubicación conocida
    envioIntervalId = setInterval(() => {
        if (ultimaUbicacion) {
            enviarAFirestore(ultimaUbicacion);
        }
    }, 10000); // Cada 10 segundos
}

function actualizarUbicacion(position, ubicacionTexto) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const newCoords = [lat, lng];

    markerSender.setLatLng(newCoords);
    mapSender.setView(newCoords, 15);

    ubicacionTexto.innerHTML = `<p>Estado: Compartiendo ubicación.</p>
                                <p>Latitud: ${lat.toFixed(6)}</p>
                                <p>Longitud: ${lng.toFixed(6)}</p>`;
}

function enviarAFirestore(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // Escribe/actualiza este emisor en su propio documento
    db.collection("ubicaciones").doc(senderId).set({
        latitude: lat,
        longitude: lng,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log("Ubicación enviada a Firestore:", senderId);
    })
    .catch((error) => {
        console.error("Error al enviar la ubicación a Firestore:", error);
    });
}

function mostrarError(error, ubicacionTexto) {
    console.error("Error al obtener la ubicación:", error);
    ubicacionTexto.innerHTML = `<p>Error: ${error.message}. Por favor, permite el acceso a la ubicación.</p>`;
    alert(`Error al obtener la ubicación: ${error.message}`);
}

function detenerEnvioUbicacion() {
    if (envioIntervalId !== null) {
        clearInterval(envioIntervalId);
        envioIntervalId = null;
    }
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    document.getElementById("ubicacion_actual_texto").innerHTML = "<p>Estado: Envío de ubicación detenido.</p>";
    console.log("Envío de ubicación detenido.");
    alert("Envío de ubicación detenido.");
}