(function() { // Use an IIFE to avoid polluting global scope
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
                show: false,            // ensure Machine doesn’t auto‑show
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
            closeBtn.innerHTML = '×';
            L.DomEvent.on(closeBtn, 'click', () => {
              instrContainer.style.display = 'none';
            });
    
            // clicking the map anywhere also hides the panel
            map.on('click', () => {
              instrContainer.style.display = 'none';
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
  
    function startLocationUpdates() {
        if (locationIntervalId) clearInterval(locationIntervalId);
        fetchAndUpdateLocation();
        locationIntervalId = setInterval(fetchAndUpdateLocation, LOCATION_UPDATE_INTERVAL);
    }
  
    function fetchAndUpdateLocation() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError, GEOLOCATION_OPTIONS);
    }
  
    function geolocationSuccess(pos) {
        const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
        const firstFix = !userMarker;
    
        if (firstFix) {
            map.setView(latlng, 16);
        }
    
        updateUserMarkerAndPopup(latlng);
        updateActiveRouteStart(latlng);
    }
    async function updateUserMarkerAndPopup(location) {
        const coordsText = `Lat: ${location.lat.toFixed(5)}, Lon: ${location.lng.toFixed(5)}`;
        if (!userMarker) {
            userMarker = L.marker(location, { icon: playerMarkerIcon }).addTo(map).bindPopup(`You are here!<br>${coordsText}`);
        } else {
            userMarker.setLatLng(location).setPopupContent(`You are here!<br>${coordsText}`);
        }
        locationElement.textContent = coordsText;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.lat}&lon=${location.lng}`);
            const data = await res.json();
            if (data.display_name) locationElement.textContent = data.display_name;
        } catch {}
    }
  
    function geolocationError(err) { if (locationIntervalId) clearInterval(locationIntervalId); locationElement.textContent = `Location error: ${err.message}`; }
  
    function handleAddRandomMarker() {
        if (!map || !userMarker) return alert("Location not ready.");
        const userLatLng = userMarker.getLatLng();
        const rand = getRandomLatLng(userLatLng.lat, userLatLng.lng, RANDOM_MARKER_RADIUS_DEGREES);
        if (!rand) return;
        if (randomMarker) map.removeLayer(randomMarker);
        randomMarker = L.marker(rand, { icon: randomMarkerIcon })
          .addTo(map)
          .bindPopup("Random Destination<br><small>Click me to route here!</small>");
        randomMarker.on('click', e => { L.DomEvent.stopPropagation(e); handleRouteToMarker(randomMarker); });
    }
  
    // ─── 2. MARKER‑CLICK HANDLER ────────────────────────────────────────────────
    function handleRouteToMarker(destinationMarker) {
        if (!ensureRoutingPrerequisites()) return;
    
        const userLatLng = userMarker.getLatLng();
        const destLatLng = destinationMarker.getLatLng();
    
        // 1) Draw the route immediately
        routingControl.setWaypoints([ userLatLng, destLatLng ]);
    
        // 2) Build the popup (avatar + name + distance + button)
        const markerAvatar = destinationMarker.options.icon.options.html;
        const markerName   = destinationMarker.options.title || 'Destination';
        const distanceKm   = (userLatLng.distanceTo(destLatLng) / 1000).toFixed(2);
    
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
          </table>
          <div style="text-align:center;margin-bottom:6px;">
            Distance: <strong>${distanceKm} km</strong>
          </div>
          <div style="text-align:center;">
            <button id="open-instructions-btn" class="open-instructions-btn">
              Open Instructions
            </button>
          </div>
        `;
    
        destinationMarker
          .bindPopup(popupHtml)
          .openPopup();
    
        // 3) Wire up the “Open Instructions” button **via the map’s popupopen**
        map.once('popupopen', (e) => {
          // ensure it's *this* marker’s popup
          if (e.popup._source !== destinationMarker) return;
          const instrContainer = routingControl.getContainer();
          const btn = document.getElementById('open-instructions-btn');
          if (btn) {
            btn.addEventListener('click', () => {
              instrContainer.style.display = 'block';
            });
          }
        });
    }
    
    
    
    
  
    function handleMapClick(e) {
        if (routingControl.getWaypoints().length) routingControl.setWaypoints([]);
    }
  
    function handleRoutingError(e) { alert(`Routing error: ${e.error.message}`); routingControl.setWaypoints([]); }
  
    function ensureRoutingPrerequisites() {
        if (!map) return alert("Map not ready.");
        if (!userMarker) return alert("Your location not available.");
        if (!routingControl) return alert("Routing system not ready.");
        return true;
    }
  
    function loadUserData() {
        try {
            const av = localStorage.getItem('mapApp_userAvatar');
            const fr = JSON.parse(localStorage.getItem('mapApp_friends') || '[]');
            const all = JSON.parse(localStorage.getItem('mapApp_allAvatars') || '{}');
            state.avatars = all;
            state.avatars[state.currentUser] = av || state.avatars[state.currentUser] || '😀';
            state.friends = Array.isArray(fr) ? fr : [];
            state.friends.forEach(f => { if (!state.avatars[f]) state.avatars[f] = '😀'; });
        } catch { state.avatars = {"You":"😀"}; state.friends = []; }
    }
  
    function saveUserData() {
        localStorage.setItem('mapApp_userAvatar', state.avatars[state.currentUser]);
        localStorage.setItem('mapApp_friends', JSON.stringify(state.friends));
        localStorage.setItem('mapApp_allAvatars', JSON.stringify(state.avatars));
    }
  
    function toggleSidebar() { sidebar.classList.toggle('active'); menuToggle.classList.toggle('active'); }
    function togglePopup(el, show) { el.classList[show ? 'add' : 'remove']('active'); if (show && el===friendPopup) el.querySelector('input').focus(); }
    function changeAvatar(emoji) { state.avatars[state.currentUser]=emoji; playerMarkerIcon.options.html=emoji; if(userMarker) userMarker.setIcon(playerMarkerIcon); saveUserData(); renderAvatars(); togglePopup(avatarPicker,false); }
    function renderAvatars() {
        avatarList.innerHTML='';
        renderAvatarItem(state.currentUser,true);
        state.friends.forEach(f => renderAvatarItem(f,false));
    }
    function renderAvatarItem(name,isYou) {
        const item=document.createElement('div');
        item.className='avatar-item';
        item.dataset.userName=name;
        item.dataset.isCurrentUser=isYou;
        const circ=document.createElement('div'); circ.className='avatar-circle'; circ.textContent=state.avatars[name]; circ.style.backgroundColor=getRandomColor(name);
        const nm=document.createElement('div'); nm.className='avatar-name'; nm.textContent=isYou?name+' (You)':name;
        item.append(circ,nm); avatarList.append(item);
    }
    function addFriend() {
        const inp=document.getElementById('friendName'); const name=inp.value.trim(); if(!name||name===state.currentUser||state.friends.includes(name)){inp.focus();return;} state.friends.push(name); state.avatars[name]='😀'; saveUserData(); renderAvatars(); togglePopup(friendPopup,false);
    }
    function getRandomColor(s) { let h=0; for(let i=0;i<s.length;i++){h= s.charCodeAt(i)+((h<<5)-h);}return ['#e57373','#f06292','#ba68c8','#9575cd','#7986cb','#64b5f6','#4fc3f7','#4dd0e1','#4db6ac','#81c784','#aed581','#ff8a65','#d4e157','#ffd54f','#ffb74d','#a1887f','#90a4ae'][Math.abs(h)%17]; }
    function getRandomLatLng(lat,lng,r){const rr=r*Math.sqrt(Math.random()),θ=Math.random()*2*Math.PI,dl=rr*Math.cos(θ),dln=rr*Math.sin(θ)/Math.cos(lat*Math.PI/180);return L.latLng(lat+dl,lng+dln);}  
  })();
  