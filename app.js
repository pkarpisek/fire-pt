// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Initialize the Leaflet map
var map = L.map('map').setView([41.1579, -8.6291], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Initialize Google Places Autocomplete
var autocomplete;
function initAutocomplete() {
  autocomplete = new google.maps.places.Autocomplete(document.getElementById('addressInput'));
  autocomplete.addListener('place_changed', onPlaceSelected);
}

let tempMarker; // Temporary marker for selected location
let selectedLatLng; // Stores the selected lat/lng from the address
let selectedAddress; // Stores the selected address

function onPlaceSelected() {
  const place = autocomplete.getPlace();
  if (!place.geometry) {
    alert('Endereço inválido.');
    return;
  }

  // Get location of selected place
  selectedLatLng = place.geometry.location;
  selectedAddress = place.formatted_address;

  // Place a temporary marker at the selected location
  if (tempMarker) {
    map.removeLayer(tempMarker);
  }
  tempMarker = L.marker([selectedLatLng.lat(), selectedLatLng.lng()], { draggable: true }).addTo(map);

  // Center map on selected location
  map.setView([selectedLatLng.lat(), selectedLatLng.lng()], 15);
}

// Show modal for address input
document.getElementById('addLocationBtn').addEventListener('click', () => {
  document.getElementById('addAddressModal').style.display = 'block';
});

// Handle address confirmation
document.getElementById('confirmAddress').addEventListener('click', () => {
  if (selectedLatLng) {
    // Allow users to drag the marker to fine-tune the location
    tempMarker.on('dragend', function(event) {
      const position = event.target.getLatLng();
      selectedLatLng = L.latLng(position.lat, position.lng);
    });

    // Show save and publish options
    const confirmSave = window.confirm("Confirmar localização e salvar?");
    if (confirmSave) {
      saveLocationToFirebase(selectedLatLng.lat, selectedLatLng.lng, selectedAddress);
    }
    document.getElementById('addAddressModal').style.display = 'none';
  } else {
    alert('Por favor, selecione um endereço.');
  }
});

// Cancel the modal input
document.getElementById('cancelAddress').addEventListener('click', () => {
  if (tempMarker) {
    map.removeLayer(tempMarker);
  }
  document.getElementById('addAddressModal').style.display = 'none';
});

// Save location to Firebase
function saveLocationToFirebase(lat, lng, address) {
  const newLocation = db.ref('help-locations').push();
  newLocation.set({
    lat: lat,
    lng: lng,
    address: address,
    lastUpdated: new Date().toISOString()
  });
  alert('Localização salva!');
}

// Load existing help locations from Firebase and display them on the map
function loadExistingHelpLocations() {
  db.ref('help-locations').on('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      const location = childSnapshot.val();
      const lat = location.lat;
      const lng = location.lng;

      // Add existing help location markers to the map
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`
        <b>${location.address}</b><br>
        Última atualização: ${location.lastUpdated || 'Nunca'}.
      `);
    });
  });
}

// Load existing help locations when the page loads
loadExistingHelpLocations();
