// Firebase configuration (from your Firebase console)
const firebaseConfig = {
    apiKey: "AIzaSyD6JgE7sP4MFKgDz4DyX7QUQpKH8oZNKOQ",
    authDomain: "fire-reporting-app.firebaseapp.com",
    databaseURL: "https://fire-reporting-app-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "fire-reporting-app",
    storageBucket: "fire-reporting-app.appspot.com",
    messagingSenderId: "17110938256",
    appId: "1:17110938256:web:311ddb9cd088e161f09e15",
    measurementId: "G-9KHJ6Y4ZFZ"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Reference to Firebase Realtime Database
  const db = firebase.database();
  
  // Initialize the Leaflet map
  var map = L.map('map').setView([41.1579, -8.6291], 13); // Centered on Porto
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  // Helper function to check if the user has clicked in the last hour
  function canUserClick() {
    const lastClickTime = localStorage.getItem('lastClickTime');
    if (!lastClickTime) {
      return true; // If no previous click is recorded, allow the click
    }
  
    const oneHour = 60 * 60 * 1000; // One hour in milliseconds
    const currentTime = new Date().getTime();
    return currentTime - lastClickTime >= oneHour;
  }
  
  // Save the current time in localStorage
  function setUserClickTime() {
    const currentTime = new Date().getTime();
    localStorage.setItem('lastClickTime', currentTime);
  }
  
  // Open modal for adding help details
  function showModal() {
    document.getElementById("addHelpModal").style.display = "block";
  }
  
  // Close the modal
  function hideModal() {
    document.getElementById("addHelpModal").style.display = "none";
  }
  
  // Add marker to the database (with details like name, needs, and WhatsApp number)
  function confirmHelpLocation(lat, lng, name, needs, whatsapp) {
    var newLocation = db.ref('help-locations').push();
    newLocation.set({
      lat: lat,
      lng: lng,
      name: name,
      needs: needs,
      whatsapp: whatsapp,
      lastUpdated: new Date().toISOString()
    });
  
    // Set the time of the click
    setUserClickTime();
  }
  
  // Delete the temporary marker
  function removeTempMarker(marker) {
    if (marker) {
      map.removeLayer(marker);
    }
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
          <b>${location.name}</b><br>
          O que precisam: ${location.needs}<br>
          WhatsApp: <a href="https://wa.me/${location.whatsapp}" target="_blank">${location.whatsapp}</a><br>
          Última atualização: ${location.lastUpdated || 'Nunca'}.
        `);
      });
    });
  }
  
  // Event listener for clicking on the map to add a temporary marker
  let tempMarker;
  map.on('click', function(e) {
    if (!canUserClick()) {
      alert('Só pode adicionar um ponto de ajuda por hora.');
      return;
    }
  
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
  
    // Add a temporary marker to the map
    tempMarker = L.marker([lat, lng]).addTo(map);
  
    // Show the modal for adding help details
    showModal();
  
    // Handle form submission inside the modal
    document.getElementById("submitHelp").onclick = function() {
      const name = document.getElementById("helpName").value;
      const needs = document.getElementById("helpNeeds").value;
      const whatsapp = document.getElementById("helpWhatsApp").value;
  
      if (name && needs && whatsapp) {
        // Confirm and add the help location to Firebase
        confirmHelpLocation(lat, lng, name, needs, whatsapp);
        hideModal();
      } else {
        alert('Por favor, preencha todos os campos.');
      }
    };
  
    // Handle form cancellation
    document.getElementById("cancelHelp").onclick = function() {
      removeTempMarker(tempMarker);
      hideModal();
    };
  });
  
  // Load existing help locations when the page loads
  loadExistingHelpLocations();
  