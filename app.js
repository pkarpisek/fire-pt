// Firebase configuration using the correct databaseURL
const firebaseConfig = {
  apiKey: "AIzaSyD6JgE7sP4MFKgDz4DyX7QUQpKH8oZNKOQ",
  authDomain: "fire-reporting-app.firebaseapp.com",
  databaseURL: "https://fire-reporting-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fire-reporting-app",
  storageBucket: "fire-reporting-app.appspot.com",
  messagingSenderId: "17110938256",
  appId: "1:17110938256:web:311ddb9cd088e161f09e15",
  measurementId: "G-9KHJ6Y4ZFZ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Initialize the Leaflet map
var map = L.map('map').setView([41.1579, -8.6291], 13); // Centered on Porto

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let tempMarker; // Temporary marker for the selected location

// Function to add a help marker
function addMarker(lat, lng, helpId, name, needs, whatsapp) {
  var marker = L.marker([lat, lng]).addTo(map);
  marker.bindPopup(`
    <b>${name}</b><br>
    Precisamos de: ${needs}<br>
    WhatsApp: <a href="https://wa.me/${whatsapp}" target="_blank">${whatsapp}</a><br>
    <br><button onclick="confirmHelp('${helpId}')">Confirmar ajuda ainda necessária</button>
  `);
}

// Show the modal to add help location
map.on('click', function(e) {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;

  tempMarker = L.marker([lat, lng]).addTo(map); // Add a temporary marker on the map
  document.getElementById('helpModal').style.display = 'block'; // Show modal
  
  // Save the help location when the user clicks "Salvar"
  document.getElementById('submitHelp').onclick = function() {
    const name = document.getElementById('nameInput').value;
    const needs = document.getElementById('needsInput').value;
    const whatsapp = document.getElementById('whatsappInput').value;
    
    if (name && needs && whatsapp) {
      var newHelpLocation = db.ref('help-locations').push();
      newHelpLocation.set({
        lat: lat,
        lng: lng,
        name: name,
        needs: needs,
        whatsapp: whatsapp,
        lastUpdated: new Date().toISOString()
      });
      document.getElementById('helpModal').style.display = 'none'; // Hide modal
    } else {
      alert('Por favor, preencha todos os campos.');
    }
  };
//
  // Cancel adding help location
  document.getElementById('cancelHelp').onclick = function() {
    map.removeLayer(tempMarker); // Remove the temporary marker if cancelled
    document.getElementById('helpModal').style.display = 'none'; // Hide modal
  };
});

// Load existing help locations from Firebase
db.ref('help-locations').on('child_added', function(snapshot) {
  var location = snapshot.val();
  addMarker(location.lat, location.lng, snapshot.key, location.name, location.needs, location.whatsapp);
});

// Function to confirm the help location is still needed
function confirmHelp(helpId) {
  var helpRef = db.ref('help-locations/' + helpId);
  helpRef.once('value').then(function(snapshot) {
    var help = snapshot.val();
    helpRef.update({
      lastUpdated: new Date().toISOString()
    });
    alert("Ajuda confirmada como ainda necessária.");
  });
}
