let map;
let platform; 
let ui; 
let origin;
let destination;
let originLocation;
let destinationLocation;
navigator.geolocation.getCurrentPosition(success, error);

function success(position) {
    //const latitude = position.coords.latitude;
    //const longitude = position.coords.longitude;
    const latitude = 10.067782206681201;
    const longitude = 76.32732722987745;
    
    platform = new H.service.Platform({
        apikey: config.API_KEY,
        app_id: config.APP_ID,
    });

    const defaultLayers = platform.createDefaultLayers();

    map = new H.Map(
        document.getElementById('mapContainer'),
        defaultLayers.vector.normal.map,
        {
            center: { lat: latitude, lng: longitude }, 
            zoom: 14, 
        }
    );
    const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    ui = H.ui.UI.createDefault(map);
    ui.getControl('zoom').setEnabled(true);
}
function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
}
function resizeMap() {
    map.getViewPort().resize();
}
window.addEventListener('resize', resizeMap); 
function findCoords() {
    origin = document.getElementById('originInput').value;
    destination = document.getElementById('destinationInput').value;

    // Ensure that the platform object is initialized
    if (!platform) {
        alert('Map platform not initialized. Please wait for map initialization.');
        return;
    }

    // Use the Geocoding and Search service to find places
    const geocodingService = platform.getSearchService();
    geocodingService.geocode(
        {
            q: origin,
        },
        (originResult) => {
            if (originResult.items.length === 0) {
                alert('Starting point not found.');
                return;
            }
            originLocation = originResult.items[0].position;
            geocodingService.geocode(
                {
                    q: destination,
                },
                (destinationResult) => {
                    if (destinationResult.items.length === 0) {
                        alert(String('destination not found')); 
                    } 
                    destinationLocation = destinationResult.items[0].position;
                    var destinationCoordinates = String(destinationLocation.lat)+","+String(destinationLocation.lng);
                    var originCoordinates = String(originLocation.lat)+","+String(originLocation.lng);
                    findRoute(originCoordinates, destinationCoordinates);
                },
                (error) => {
                    console.error('Error:', error.message);
                    alert(String(error.message));
                }
            );
        },
        (error) => {
            console.error('Error:', error.message);
            alert(String(error.message));
        }
    );
}       
function findRoute(originCoordinates, destinationCoordinates){
    const router = platform.getRoutingService(null, 8);
    const routeRequestParams = {
        'routingMode': 'fast',
        'transportMode': 'car',
        'origin': originCoordinates,
        'destination': destinationCoordinates, 
        //representation: 'display',
        //routeattributes: 'waypoints,summary,shape,legs',
        //maneuverattributes: 'direction,action',
        //language: 'en-us',
        return: 'polyline'
    };
    router.calculateRoute(routeRequestParams, onSuccess, onError);
}
function onSuccess(result) {
    // ensure that at least one route was found
    if (result.routes.length) {
        result.routes[0].sections.forEach((section) => {
            // Create a linestring to use as a point source for the route line
            let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);

            // Create a polyline to display the route:
            let routeLine = new H.map.Polyline(linestring, {
            style: { strokeColor: 'blue', lineWidth: 3 }
            });

            // Create a marker for the start point:
            let startMarker = new H.map.Marker(section.departure.place.location);

            // Create a marker for the end point:
            let endMarker = new H.map.Marker(section.arrival.place.location);

            // Add the route polyline and the two markers to the map:
            map.removeObjects(map.getObjects());
            map.addObjects([routeLine, startMarker, endMarker]);

            // Set the map's viewport to make the whole route visible:
            map.getViewModel().setLookAtData({bounds: routeLine.getBoundingBox()});
        });
    }
}
function onError(error) {
    console.error('Error calculating the route:', error);
    alert(String(error.message));
}
