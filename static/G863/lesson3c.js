class City {
  constructor(name, coordinates, pop, walkScore, transitScore, bikeScore, elev) {
    this.name = name,
    this.coordinates = coordinates,
    this.pop = pop,
    this.walkScore = walkScore,
    this.transitScore = transitScore
    this.bikeScore = bikeScore,
    this.elev = elev
  }
};

var cityList = [
  new City("Cleveland, OH", [-81.6944, 41.4993], 372624, 60, 45, 55, 653),
  new City("Portland, OR", [-122.6750, 45.5051], 652503, 67, 52, 82, 50),
  new City("Redmond, OR", [-121.173920, 44.272621], 26215, 30, 0, 0, 3077),
  new City("Indio, CA", [-116.215561, 33.720577], 89469, 31, 0, 0, -13),
  new City("Keithsburg, IL", [-90.935662924, 41.0999996 ], 609, 0, 0, 0, 533),
  new City("Cedar Rapids, IA", [-91.665627, 41.977879], 137710, 34, 20, 41, 810),
  new City("Madison, WI", [-89.401230, 43.073051], 269840, 48, 39, 65, 873),
];

var citySymbol = {
  type: "simple-marker",
  style: "diamond",
  size: "18px",
  color: "teal"
};

function getExtent() {

  let xmin, xmax, ymin, ymax;
  xmin = xmax = cityList[0].coordinates[0]
  ymin = ymax = cityList[0].coordinates[1]

  cityList.slice(1).forEach( (city) => {
    if (city.coordinates[0] > xmax) {
      xmax = city.coordinates[0]
    } else if (city.coordinates[0] < xmin) {
      xmin = city.coordinates[0]
    };

    if (city.coordinates[1] > ymax) {
      ymax = city.coordinates[1]
    } else if (city.coordinates[1] < ymin) {
      ymin = city.coordinates[1]
    };
  });

  let extent = {
    type: "extent",
    xmin: xmin,
    xmax: xmax,
    ymin: ymin,
    ymax: ymax
  };

  return extent;
};

function createGraphic(city) {
  let cityPoint = {
    type: "point",
    longitude: city.coordinates[0],
    latitude: city.coordinates[1]
  };

  let cityGraphic = {
    geometry: cityPoint,
    symbol: citySymbol,
    attributes: {
      "Name": city.name,
      "Pop": city.pop,
      "WalkScore": city.walkScore,
      "TransitScore": city.transitScore,
      "BikeScore": city.bikeScore,
      "Elevation": city.elev,
    },
    popupTemplate: {
      title: "{Name}",
      content: [{
        type: "fields",
        fieldInfos: [
          {fieldName: "Pop", label: "Population"},
          {fieldName: "WalkScore", label: "Walkability Score"},
          {fieldName: "TransitScore", label: "Public Transit Score"},
          {fieldName: "BikeScore", label: "Bike Score"},
          {fieldName: "Elevation"},
        ]
      }]
    }
  };

  return cityGraphic
};

require(["esri/Map",
  "esri/views/MapView",
  "esri/Graphic",
  "esri/geometry/Extent"
  ], (Map,
    MapView,
    Graphic,
    Extent
  ) => {     
    let extent = new Extent(getExtent())

    //Add some padding to the extent so cities will not be directly on the edge of the view
    extent.expand(1.1)

    const map = new Map({
        basemap: "osm"
      });

    const view = new MapView({
      container: "viewDiv",
      map: map,
      extent: extent
    });
    
    cityList.forEach((city) => {
      let graphic = new Graphic(createGraphic(city));

      view.graphics.add(graphic);
    });
    
  });