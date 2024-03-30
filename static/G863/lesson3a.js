require(["esri/Map", "esri/views/MapView", "esri/geometry/Point", "esri/symbols/SimpleMarkerSymbol", "esri/Graphic"], (Map, MapView, Point, SimpleMarkerSymbol, Graphic) => {
  let cleveland_coordinates = [-81.6944, 41.4993]
      
  const map = new Map({
    basemap: "osm"
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    zoom: 8,
    center: cleveland_coordinates // longitude, latitude
  });
  
  var cleveland_point = new Point(
    longitude = cleveland_coordinates[0],
    latitude = cleveland_coordinates[1]
  );
  
  var city_symbol = {
    type: "simple-marker",
    style: "diamond",
    size: "18px",
    color: "teal"
  };
  
  var cleveland_graphic = new Graphic(
    geometry = cleveland_point,
    symbol = city_symbol
  );
  
  view.graphics.add(cleveland_graphic);
});