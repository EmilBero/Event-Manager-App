// Create Map
var map = L.map('map').setView([20, -40], 2);
// Add Tiles
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Define Event Object
class Event {
    constructor(name, date, time, location, address="", note = "") {
        this.name = name;
        this.date = date;
        this.time = time;
        this.location = location;
        this.address = address; // Optional field for geocoding
        this.note = note;
        this.lat = null;
        this.lon = null;
        this.marker = null;
    }

    // Method for adding marker
    setMarker(marker) {
        this.marker = marker;
    }

    // Method for displaying the event
    displayEvent(index) {
        const eventList = document.getElementById('event-list');
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        let content = `
            <h3>${this.name}</h3>
            <p>Date: ${this.date}</p>
            <p>Time: ${this.time}</p>
            <p>Location: ${this.location}</p>
        `;
        // Add address if it exists
        if (this.address.trim()) {
            content += `<p>Address: ${this.address}</p>`;
        }
        // Add note if it exists
        if (this.note.trim()) {
            content += `<p>Note: ${this.note}</p>`;
        }
        // Add edit and delete buttons
        content += `
            <span class="edit-btn" data-index="${index}">&#9998;</span>
            <span class="delete-btn" data-index="${index}">&times;</span>
            <span class="share-btn" data-index="${index}">&#x1F517;</span>

        `;
        // Set the inner HTML and append to the list
        eventItem.innerHTML = content;
        eventList.appendChild(eventItem);
    }

    // Method for editing the event
    static editEvent(index) {
        let events = JSON.parse(localStorage.getItem('events')) || [];
        let eventData = events[index];
        let event = new Event(eventData.name, eventData.date, eventData.time, eventData.location, eventData.address, eventData.note);
        event.lat = eventData.lat;
        event.lon = eventData.lon;

        let newName = prompt("Enter new event name:", event.name);
        if (newName === null || newName.trim() === "") {
            alert("Event name cannot be empty. Edit canceled.");
            return;
        }
        let newDate = prompt("Enter new date:", event.date);
        if (newDate === null || newDate.trim() === "") {
            alert("Event date cannot be empty. Edit canceled.");
            return;
        }
        let newTime = prompt("Enter new time:", event.time);
        if (newTime === null || newTime.trim() === "") {
            alert("Event time cannot be empty. Edit canceled.");
            return;
        }
        let newLocation = prompt("Enter new location:", event.location);
        if (newLocation === null || newLocation.trim() === "") {
            alert("Event location cannot be empty. Edit canceled.");
            return;
        }
        let newAddress = prompt("Enter new address (optional):", event.address);
        if (newAddress === "") {
            newAddress = event.address;
        }
        let newNote = prompt("Enter new note:", event.note);
        if (newNote === null) {
            newNote = event.note;
        }

        // Geocode the new address and update the event
        if (newAddress.trim()) {
            geocodeAddress(newAddress, (coords) => {
                if (event.marker) {
                    map.removeLayer(event.marker);
                }

                event.name = newName;
                event.date = newDate;
                event.time = newTime;
                event.location = newLocation;
                event.address = newAddress;
                event.note = newNote;
                event.lat = coords.lat;
                event.lon = coords.lon;

                const newMarker = L.marker([event.lat, event.lon]).addTo(map);
                newMarker.bindPopup(`<b>${event.name}</b><br>${event.address}`);
                event.setMarker(newMarker);

                events[index] = {
                    name: event.name,
                    date: event.date,
                    time: event.time,
                    location: event.location,
                    address: event.address,
                    note: event.note,
                    lat: event.lat,
                    lon: event.lon
                }
                localStorage.setItem('events', JSON.stringify(events));
                displayAllEvents();
            });
        } else {
            // If no new address is provided, just update other details
            if (event.marker) {
                map.removeLayer(event.marker);
                event.marker = null;
            }
            // DONT CHANGE THIS LINE OR ELSE CIRCULAR ERROR
            events[index] = {
                name: event.name,
                date: event.date,
                time: event.time,
                location: event.location,
                address: event.address,
                note: event.note
            };
            localStorage.setItem('events', JSON.stringify(events));
            displayAllEvents();
        }
    }

    // Static method for removing the event
    static removeEvent(index) {
        let events = JSON.parse(localStorage.getItem('events')) || [];
        let event = events[index];

        // Remove the marker from the map if it exists
        if (event && event.marker) {
            map.removeLayer(event.marker);
        }
        events.splice(index, 1); // Remove event from the array
        localStorage.setItem('events', JSON.stringify(events)); // Update local storage
        displayAllEvents();
    }

    // Method for sharing the event
    static shareEvent(index) {
        let events = JSON.parse(localStorage.getItem('events')) || [];
        let event = events[index];

        // Prepare the event details for sharing
        const eventDetails = `Event: ${event.name}\nDate: ${event.date}\nTime: ${event.time}\nLocation: ${event.location}`;

        // Use the Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: 'Event Details',
                text: eventDetails,
            }).catch(console.error);
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(eventDetails).then(() => {
                alert('Event details copied to clipboard.');
            }, () => {
                alert('Failed to copy event details.');
            });
        }
    }
}

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Add Event Listener to the form
document.getElementById('event-form').addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page

    const name = document.getElementById('event-name').value;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const location = document.getElementById('event-location').value;
    const address = document.getElementById('event-address').value;
    const notes = document.getElementById('event-note').value;
    // Check for past dates
    const now = new Date();
    const eventDateTime = new Date(`${date}T${time}`);
    if (eventDateTime < now) {
        alert("The date and time cannot be in the past.");
        return;
    }

    // Geocode the address and create the event
    if (address.trim()) {
        geocodeAddress(address, (coords) => {
            const newEvent = new Event(name, date, time, location, address, notes);
            // Save coordinates with the event
            newEvent.lat = coords.lat;
            newEvent.lon = coords.lon;
            console.log(newEvent);
            notifyConflict(newEvent);
            saveEvent(newEvent);
            displayAllEvents();
            document.getElementById('event-form').reset();
        });
    } else {
        // Create the event without geocoding
        const newEvent = new Event(name, date, time, location, notes);
        notifyConflict(newEvent);
        saveEvent(newEvent);
        displayAllEvents();
        document.getElementById('event-form').reset();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const showFormBtn = document.getElementById('show-form-btn');
    const hideFormBtn = document.getElementById('hide-form-btn');
    const eventForm = document.getElementById('event-form');
    const showSearchFormBtn = document.getElementById('show-search-form-btn');
    const hideSearchFormBtn = document.getElementById('hide-search-form-btn');
    const searchForm = document.getElementById('search-form');

    // Toggle ADD event form visibility
    showFormBtn.addEventListener('click', () => {
        eventForm.style.display = 'block';
        showFormBtn.style.display = 'none';
        hideFormBtn.style.display = 'block';
    });

    hideFormBtn.addEventListener('click', () => {
        eventForm.style.display = 'none';
        showFormBtn.style.display = 'block';
        hideFormBtn.style.display = 'none';
        document.getElementById('event-form').reset(); // Clear User Input
    });

    // Handle submission 
    eventForm.addEventListener('submit', (event) => {
        event.preventDefault();
        eventForm.style.display = 'none';
        showFormBtn.style.display = 'block';
        hideFormBtn.style.display = 'none';
    });

    //Toggle SEARCH event form visibility
    showSearchFormBtn.addEventListener('click', () => {
        searchForm.style.display = 'block';
        showSearchFormBtn.style.display = 'none';
        hideSearchFormBtn.style.display = 'block';
    });

    hideSearchFormBtn.addEventListener('click', () => {
        searchForm.style.display = 'none';
        showSearchFormBtn.style.display = 'block';
        hideSearchFormBtn.style.display = 'none';
        displayAllEvents();
        searchForm.reset(); // Clear Search Input
    });

    // Handle submission
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const category = document.getElementById('search-category').value;
        const query = document.getElementById('search-query').value.toLowerCase();
        searchEvents(category, query);
    });

    // Load and display all events on page load
    displayAllEvents();
});
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Function to display all events from local storage
function displayAllEvents() {
    const eventList = document.getElementById('event-list');
    eventList.innerHTML = ''; // Clear current list
    // Clear all markers from the map before refreshing
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    //Load data from local storage
    let events = JSON.parse(localStorage.getItem('events')) || [];
    events.forEach((eventData, index) => {
        const event = new Event(eventData.name, eventData.date, eventData.time, eventData.location, eventData.address, eventData.note);
        event.displayEvent(index);
        // Place marker if coordinates exist
        if (eventData.lat && eventData.lon) {
            const marker = L.marker([eventData.lat, eventData.lon]).addTo(map);
            // Create a popup with event details excluding notes
            const popupContent = `
            <b>${event.name}</b><br>
            <b>Date:</b> ${event.date}<br>
            <b>Time:</b> ${event.time}<br>
            <b>Address:</b> ${event.address}<br>
            <b>Note:</b> ${event.note}
            `;
            marker.bindPopup(popupContent);
            event.setMarker(marker);
            // Add a click event listener to zoom in on marker click
            marker.on('click', () => {
                map.setView([eventData.lat, eventData.lon], 15); // Zoom in and center on the marker
            });
        }
    });

    // Event Listener to reload everything if an event is deleted
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            Event.removeEvent(index);
        });
    });
    // Event Listener to reload everything if an event is edited
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            Event.editEvent(index);
        });
    });
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            Event.shareEvent(index);
        });
    });
}

// Function to notify about conflicts
function notifyConflict(newEvent) {
    let events = JSON.parse(localStorage.getItem('events')) || [];
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (event.date === newEvent.date && event.time === newEvent.time) {
            alert(`Note: The event "${newEvent.name}" clashes with "${event.name}" at the same time.`);
            return;
        }
    }
}

// Function to search events
function searchEvents(category, query) {
    const eventList = document.getElementById('event-list');
    eventList.innerHTML = ''; // Clear current list

    let events = JSON.parse(localStorage.getItem('events')) || [];
    events.forEach((eventData, index) => {
        if (eventData[category].toLowerCase().includes(query)) {
            const event = new Event(eventData.name, eventData.date, eventData.time, eventData.location, eventData.note);
            event.displayEvent(index);
        }
    });
}

// Callback Function to geocode an address
function geocodeAddress(address, callback) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const { lat, lon } = data[0];
                callback({ lat, lon });
            } else {
                alert(`No results found for the address ${address}. Please Try Again`);
            }
        })
        .catch(error => console.error('Error with geocoding:', error));
}

// Function to save event to local storage
function saveEvent(event) {
    let events = JSON.parse(localStorage.getItem('events')) || [];
    events.push(event);
    localStorage.setItem('events', JSON.stringify(events));
}