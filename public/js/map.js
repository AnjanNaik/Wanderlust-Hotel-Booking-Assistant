const mapElement = document.getElementById('map');
const coordinates = JSON.parse(mapElement.getAttribute('data-coordinates'));
const title = mapElement.getAttribute('data-title');

const map = new maplibregl.Map({
  container: 'map', 
  style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', // style URL
  center: coordinates, 
  zoom: 9 
});


map.addControl(new maplibregl.NavigationControl());


const el = document.createElement('div');
el.className = 'custom-marker';
el.innerHTML = '<i class="fa-solid fa-house"></i>';


const popup = new maplibregl.Popup({ offset: 25 })
  .setHTML(`<h4>${title}</h4><p>Exact location will be provided after booking</p>`);

const marker1 = new maplibregl.Marker({ element: el, anchor: 'bottom' })
  .setLngLat(coordinates)
  .setPopup(popup)
  .addTo(map);
