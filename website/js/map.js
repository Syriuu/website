(function () { // Use an IIFE to avoid polluting global scope
    "use strict"; // Enable strict mode

    // --- Application State ---
    const state = {
        currentUser: "You",
        avatars: { "You": "😀" }, // Default user avatar
        friends: [],
    };

    // --- Map & Marker Variables (Initialized to null) ---
    let map = null;
    let userMarker = null;
    let fixedMarkerB = null;
    let fixedMarkerC = null;
    let randomMarker = null;
    let routingControl = null;
    let locationIntervalId = null;

    // --- Icon Definitions (Initialized to null) ---
    let playerMarkerIcon = null;
    let destinationMarkerIcon = null;
    let randomMarkerIcon = null;

    // --- DOM Element References ---
    let sidebar, menuToggle, avatarList, locationElement, avatarPicker, friendPopup,
        addFriendBtn, emojiSpans, closeAvatarBtn, addFriendPopupBtn, cancelFriendBtn,
        cusmapHolder, addRandomMarkerBtn;

    // --- Configuration ---
    const HCMC_COORDS = [10.7769, 106.7009];
    const DEFAULT_ZOOM = 13;
    const LOCATION_UPDATE_INTERVAL = 15000;
    const GEOLOCATION_OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 };
    const RANDOM_MARKER_RADIUS_DEGREES = 0.05;

    // =========================================================================
    // Initialization Flow
    // =========================================================================

    document.addEventListener('DOMContentLoaded', initializeApp);

    function initializeApp() {
        if (!getAndCheckDOMElements()) return;
        loadUserData();
        defineIcons();
        renderAvatars();
        if (!initializeMapAndDependencies()) return;
        setupEventListeners();
        startLocationUpdates();
    }

    function getAndCheckDOMElements() {
        sidebar = document.querySelector('.sidebar');
        menuToggle = document.querySelector('.menu-toggle');
        avatarList = document.getElementById('avatarList');
        locationElement = document.getElementById('location');
        avatarPicker = document.getElementById('avatarPicker');
        friendPopup = document.getElementById('friendPopup');
        addFriendBtn = sidebar.querySelector('.add-friend-btn');
        closeAvatarBtn = avatarPicker.querySelector('.close-btn');
        addFriendPopupBtn = friendPopup.querySelector('.add-btn');
        cancelFriendBtn = friendPopup.querySelector('.cancel-btn');
        cusmapHolder = document.getElementById('cusmap-holder');
        addRandomMarkerBtn = document.getElementById('addRandomMarkerBtn');

        if (!sidebar || !menuToggle || !avatarList || !locationElement || !avatarPicker || !friendPopup || !addFriendBtn || !closeAvatarBtn || !addFriendPopupBtn || !cancelFriendBtn || !cusmapHolder || !addRandomMarkerBtn) {
            document.body.innerHTML = '<p style="padding:20px;color:red;">Error: Essential UI elements missing.</p>';
            return false;
        }
        return true;
    }

    function defineIcons() {
        playerMarkerIcon = L.divIcon({
            className: 'player-marker',
            html: state.avatars[state.currentUser],
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        destinationMarkerIcon = L.divIcon({
            className: 'destination-marker',
            html: '📍',
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        randomMarkerIcon = L.divIcon({
            className: 'player-marker',
            html: '🎯',
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
    }

    // ─── 1. MAP INITIALIZATION ────────────────────────────────────────────────
    function initializeMapAndDependencies() {
        try {
            // 1. Create map centered on HCMC by default
            map = L.map(cusmapHolder).setView(HCMC_COORDS, DEFAULT_ZOOM);

            // 2. Add tile layer
            L.tileLayer(
                'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                { maxZoom: 19, minZoom: 3 }
            ).addTo(map);

            // 3. Fixed markers with titles
            const iconB = L.divIcon({ ...destinationMarkerIcon.options, html: '🏢' });
            fixedMarkerB = L.marker([10.7716, 106.7046], {
                icon: iconB,
                title: 'Bitexco Financial Tower'
            }).addTo(map);

            const iconC = L.divIcon({ ...destinationMarkerIcon.options, html: '⛪' });
            fixedMarkerC = L.marker([10.7797, 106.6991], {
                icon: iconC,
                title: 'Notre Dame Cathedral'
            }).addTo(map);

            // 4. Routing control (panel hidden by CSS, not .hide())
            routingControl = L.Routing.control({
                waypoints: [],
                routeWhileDragging: false,
                addWaypoints: false,
                draggableWaypoints: false,
                show: true,            // ensure Machine doesn’t auto‑show
                position: 'topright',
                fitSelectedRoutes: true,
                createMarker: () => null,
                lineOptions: {
                    styles: [{ color: '#ff8c00', opacity: 0.8, weight: 6 }]
                }
            })
                .on('routingerror', handleRoutingError)
                .addTo(map);

            // grab the panel container and hide it via CSS
            const instrContainer = routingControl.getContainer();
            instrContainer.style.display = 'none';

            // inject close‑× button into that panel
            const closeBtn = L.DomUtil.create('button', 'close-instructions-btn', instrContainer);
            closeBtn.innerHTML = 'Close';
            // maximize the button size
            closeBtn.style.width = '100%';
            L.DomEvent.on(closeBtn, 'click', () => {
                instrContainer.style.display = 'none';
            });

            // clicking the map anywhere also hides the panel
            map.on('click', () => {
                console.log("Map click detected!");
                if(instrContainer){
                console.log("Attempting to hide instructions panel.");
                instrContainer.style.display = 'none';
                }else{
                    console.log("instrContainer variable not found!");
                }
                if (routingControl){
                    console.log("Attempting to clear waypoints.");
                    routingControl.setWaypoints([]);
                }else{
                    console.log("routingControl variable not found!");
                }
                console.log("Attempting to close popups.");
                map.closePopup()
            });

            return true;
        } catch (e) {
            cusmapHolder.innerHTML = `<p style="color:red; padding:20px;">
        Map init error: ${e.message}
    </p>`;
            return false;
        }
    }



    function setupEventListeners() {
        menuToggle.addEventListener('click', toggleSidebar);
        addFriendBtn.addEventListener('click', () => togglePopup(friendPopup, true));
        closeAvatarBtn.addEventListener('click', () => togglePopup(avatarPicker, false));
        addFriendPopupBtn.addEventListener('click', addFriend);
        cancelFriendBtn.addEventListener('click', () => togglePopup(friendPopup, false));
        emojiSpans = avatarPicker.querySelectorAll('.emoji-grid span');
        emojiSpans.forEach(span => span.addEventListener('click', () => changeAvatar(span.textContent)));
        avatarList.addEventListener('click', event => {
            const item = event.target.closest('.avatar-item');
            if (item && item.dataset.isCurrentUser === 'true') togglePopup(avatarPicker, true);
        });
        addRandomMarkerBtn.addEventListener('click', handleAddRandomMarker);
        if (fixedMarkerB) fixedMarkerB.on('click', e => { L.DomEvent.stopPropagation(e); handleRouteToMarker(fixedMarkerB); });
        if (fixedMarkerC) fixedMarkerC.on('click', e => { L.DomEvent.stopPropagation(e); handleRouteToMarker(fixedMarkerC); });
    }

    // ─── 2. LOCATION UPDATES ────────────────────────────────────────────────
    function startLocationUpdates() {
        if (locationIntervalId) clearInterval(locationIntervalId);
        fetchAndUpdateLocation();
        locationIntervalId = setInterval(fetchAndUpdateLocation, LOCATION_UPDATE_INTERVAL);
    }

    // Fetch location and update marker
    function fetchAndUpdateLocation() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError, GEOLOCATION_OPTIONS);
    }


    // Geolocation success and error handlers
    function geolocationSuccess(pos) {
        const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
        const firstFix = !userMarker;

        if (firstFix) {
            map.setView(latlng, 16);
        }

        updateUserMarkerAndPopup(latlng);
        updateActiveRouteStart(latlng);
    }

    // Update the first waypoint of the active route to the user's new position
    function updateActiveRouteStart(latlng) {
        // If we have an active route, update the first waypoint to user's new position
        if (routingControl && routingControl.getWaypoints().length > 1) {
            const waypoints = routingControl.getWaypoints();
            waypoints[0] = latlng;
            routingControl.setWaypoints(waypoints);
        }
    }

    // Update user marker and popup content
    async function updateUserMarkerAndPopup(location) {
        const coordsText = `Lat: ${location.lat.toFixed(5)}, Lon: ${location.lng.toFixed(5)}`;
        let displayAddress=coordsText;
        try{
            displayAddress = await reverseGeocode(location);
        }catch(error){
            console.warn("Could not update user marker address display.");
        }
        const popupContent = `You are here!<br>${displayAddress}`;
        if (!userMarker) {
            userMarker = L.marker(location, { icon: playerMarkerIcon }).addTo(map).bindPopup(popupContent);
        } else {
            userMarker.setLatLng(location).setPopupContent(popupContent);
        }
        locationElement.textContent = displayAddress;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.lat}&lon=${location.lng}`);
            const data = await res.json();
            if (data.display_name) locationElement.textContent = data.display_name;
        } catch { }
    }

    // Geolocation error handler
    function geolocationError(err) { if (locationIntervalId) clearInterval(locationIntervalId); locationElement.textContent = `Location error: ${err.message}`; }

    // ─── 3. MARKER HANDLERS ────────────────────────────────────────────────
    function handleAddRandomMarker() {
        if (!map || !userMarker) return alert("Location not ready.");
        const userLatLng = userMarker.getLatLng();
        const rand = getRandomLatLng(userLatLng.lat, userLatLng.lng, RANDOM_MARKER_RADIUS_DEGREES);
        if (!rand) return;
        if (randomMarker) map.removeLayer(randomMarker);
        randomMarker = L.marker(rand, { icon: randomMarkerIcon })
            .addTo(map)
            .bindPopup("Random Destination<br><small>Click me to route here!</small>");
        randomMarker.on('click', e => {
            L.DomEvent.stopPropagation(e); handleRouteToMarker(randomMarker);
            console.log(randomMarker)
        });
    }
    
    // Route to the selected marker
    async function handleRouteToMarker(destinationMarker) {
        if (!userMarker || !userMarker.getLatLng()) {
            alert("Your location is needed to calculate a route.");
            return;
        }

        const userLatLng = userMarker.getLatLng();
        const destLatLng = destinationMarker.getLatLng();

        // --- Fetch Address Asynchronously ---
        let destinationAddress = "Fetching address..."; // Placeholder
        try {
            destinationAddress = await reverseGeocode(destLatLng);
        } catch (error) {
            // Error logged in reverseGeocode, use fallback already returned
            destinationAddress = `${destLatLng.lat.toFixed(5)}, ${destLatLng.lng.toFixed(5)}`; // Ensure fallback
            console.warn("Could not get address for destination marker popup.");
        }

        // 1) Draw the route immediately
        routingControl.setWaypoints([userLatLng, destLatLng]);

        // 2) Build the popup (avatar + name + distance + button)
        const markerAvatar = destinationMarker.options.icon.options.html;
        const markerName = destinationMarker.options.title || 'Destination';
        const distanceKm = (userLatLng.distanceTo(destLatLng) / 1000).toFixed(2);

        // Create unique ID for this button
        const buttonId = 'open-instructions-btn-' + Math.floor(Math.random() * 10000);

        const popupHtml = `
  <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
    <tr>
      <td style="text-align:center;font-size:1.2rem;padding:4px;">
        ${markerAvatar}
      </td>
      <td style="font-weight:600;padding:4px;">
        ${markerName}
      </td>
    </tr>
     <tr>
        <td colspan="2" style="font-size:0.85rem; color:#555; padding-top: 4px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
          ${destinationAddress} 
        </td>
      </tr>
  </table>
  <div style="text-align:center;margin-bottom:6px;">
    Distance: <strong>${distanceKm} km</strong>
  </div>
  <div style="text-align:center;">
    <button id="${buttonId}" class="open-instructions-btn">
      Open Instructions
    </button>
  </div>
`;
        destinationMarker.unbindPopup(); // Remove old popup instance first
        destinationMarker.bindPopup(popupHtml).openPopup();

        setTimeout(() => {
            const btn = document.getElementById(buttonId);

            if (btn) {
                btn.addEventListener('click', function () {
                    const instrContainer = routingControl.getContainer();
                    instrContainer.style.display = 'block';
                    console.log(instrContainer.style.display);
                });
            }
        }, 1500);
    }

    // ─── 4. MISC HANDLERS ─────────────────────────────────────────────────
    function handleMapClick(e) {
        if (routingControl.getWaypoints().length) routingControl.setWaypoints([]);
    }

    // Handle routing errors
    function handleRoutingError(e) { alert(`Routing error: ${e.error.message}`); routingControl.setWaypoints([]); }

    // ─── 5. USER DATA HANDLING ──────────────────────────────────────────────
    function loadUserData() {
        try {
            const av = localStorage.getItem('mapApp_userAvatar');
            const fr = JSON.parse(localStorage.getItem('mapApp_friends') || '[]');
            const all = JSON.parse(localStorage.getItem('mapApp_allAvatars') || '{}');
            state.avatars = all;
            state.avatars[state.currentUser] = av || state.avatars[state.currentUser] || '😀';
            state.friends = Array.isArray(fr) ? fr : [];
            state.friends.forEach(f => { if (!state.avatars[f]) state.avatars[f] = '😀'; });
        } catch { state.avatars = { "You": "😀" }; state.friends = []; }
    }

    // Save user data to localStorage
    function saveUserData() {
        localStorage.setItem('mapApp_userAvatar', state.avatars[state.currentUser]);
        localStorage.setItem('mapApp_friends', JSON.stringify(state.friends));
        localStorage.setItem('mapApp_allAvatars', JSON.stringify(state.avatars));
    }

    // ─── 6. UI TOGGLE FUNCTIONS ──────────────────────────────────────────────
    function toggleSidebar() { sidebar.classList.toggle('active'); menuToggle.classList.toggle('active'); }
    function togglePopup(el, show) { el.classList[show ? 'add' : 'remove']('active'); if (show && el === friendPopup) el.querySelector('input').focus(); }
    function changeAvatar(emoji) { state.avatars[state.currentUser] = emoji; playerMarkerIcon.options.html = emoji; if (userMarker) userMarker.setIcon(playerMarkerIcon); saveUserData(); renderAvatars(); togglePopup(avatarPicker, false); }
    function renderAvatars() {
        avatarList.innerHTML = '';
        renderAvatarItem(state.currentUser, true);
        state.friends.forEach(f => renderAvatarItem(f, false));
    }

    // Render avatar items in the sidebar
    function renderAvatarItem(name, isYou) {
        const item = document.createElement('div');
        item.className = 'avatar-item';
        item.dataset.userName = name;
        item.dataset.isCurrentUser = isYou;
        const circ = document.createElement('div'); circ.className = 'avatar-circle'; circ.textContent = state.avatars[name]; circ.style.backgroundColor = getRandomColor(name);
        const nm = document.createElement('div'); nm.className = 'avatar-name'; nm.textContent = isYou ? name + ' (You)' : name;
        item.append(circ, nm); avatarList.append(item);
    }

    // Add a new friend
    function addFriend() {
        const inp = document.getElementById('friendName'); const name = inp.value.trim(); if (!name || name === state.currentUser || state.friends.includes(name)) { inp.focus(); return; } state.friends.push(name); state.avatars[name] = '😀'; saveUserData(); renderAvatars(); togglePopup(friendPopup, false);
    }

    // Close the avatar picker
    function getRandomColor(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = s.charCodeAt(i) + ((h << 5) - h); } return ['#e57373', '#f06292', '#ba68c8', '#9575cd', '#7986cb', '#64b5f6', '#4fc3f7', '#4dd0e1', '#4db6ac', '#81c784', '#aed581', '#ff8a65', '#d4e157', '#ffd54f', '#ffb74d', '#a1887f', '#90a4ae'][Math.abs(h) % 17]; }

    // --- NEW FUNCTION: Helper for Reverse Geocoding ---
    async function reverseGeocode(latlng) {
        // Public Nominatim Usage Policy: Max 1 request/second.
        // Consider adding headers like User-Agent in real applications.
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}&accept-language=en`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Nominatim request failed: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            if (data && data.display_name) {
                return data.display_name; // Return the full address string
            } else if (data && data.error) {
                throw new Error(`Nominatim error: ${data.error}`);
            } else {
                // Fallback if display_name is missing but no specific error
                return `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
            }
        } catch (error) {
            console.error("Reverse Geocoding Error:", error);
            // Return coordinates as fallback on any fetch/processing error
            return `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
        }
    }

    
    // Toggle the sidebar
    function getRandomLatLng(lat, lng, r) { const rr = r * Math.sqrt(Math.random()), θ = Math.random() * 2 * Math.PI, dl = rr * Math.cos(θ), dln = rr * Math.sin(θ) / Math.cos(lat * Math.PI / 180); return L.latLng(lat + dl, lng + dln); }
})();
