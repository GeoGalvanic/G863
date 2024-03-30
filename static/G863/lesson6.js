var citiesURL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer"
var continentsURL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Continents/FeatureServer"
var relationship = "contains"
var continentField = "CONTINENT"
var citySymbolField = "POP_RANK"

/**
 * Returns an object which can be autocast as a SimpleMarkerSymbol. Sets a default white outline.
 * @param {*} color The color of the symbol
 * @param {*} size The size of the symbol
 * @returns {Object}
 */
function getResultSymbol(color,size) {
  return {
    type: "simple-marker", //Autocasts as SimpleMarkerSymbol
    color: color,
    size: size,
    outline: {
      width: 1,
      color: [255,255,255]
    }
  }
}

const resultLayerRenderer = {
  type: "unique-value", //Autocasts as UniqueValueRenderer
  defaultSymbol: getResultSymbol([255,255,255], 5),
  field: citySymbolField,
  uniqueValueInfos: [
    { value: 1, symbol: getResultSymbol([0,0,0], 18) },
    { value: 2, symbol: getResultSymbol([37,37,37], 16) },
    { value: 3, symbol: getResultSymbol([82,82,82], 14) },
    { value: 4, symbol: getResultSymbol([115,115,115], 12) },
    { value: 5, symbol: getResultSymbol([150,150,150], 10) },
    { value: 6, symbol: getResultSymbol([189,189,189], 8) },
    { value: 7, symbol: getResultSymbol([217,217,217], 6) },
  ]
}

const continentQuery = { //autocasts as Query Object
  outFields: [continentField],
  returnGeometry: true,
  //where: property set after prompted by user for continent
}

const cityQuery = { //autocasts as Query Object
  spatialRelationship: relationship,
  returnGeometry: true,
  outFields: [citySymbolField, "CITY_NAME", "CNTRY_NAME", "STATUS", "POP"],
  //geometry: property set after continent has been queried
}

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer"
], (
  Map,
  MapView,
  FeatureLayer
) => {
  /**
   * Returns a layer created from the results of querying the citiesLayer
   * @param {FeatureSet} cities The cities feature set that was returned from a Query result
   * @returns {FeatureLayer}
   */
  function createResultLayer(cities) {
    const resultLayer = new FeatureLayer({
      source: cities.features,
      fields: [
        {type: "oid", name: "ObjectID", alias: "ObjectID"},
        {type: "double", name: citySymbolField, alias: citySymbolField},
        {type: "string", name: "CITY_NAME", alias: "City"},
        {type: "string", name: "CNTRY_NAME", alias: "Country"},
        {type: "string", name: "STATUS", alias: "Status"},
        {type: "double", name: "POP", alias: "Population"},
      ],
      renderer: resultLayerRenderer,
      popupEnabled: true,
      popupTemplate: { //Autocasts as PopupTemplate
        title: "{CITY_NAME}, {CNTRY_NAME}",
        expressionInfos: [ //Autocasts as array of ExpressionInfo
          {
            name: "POP_EXP",
            title: "Est. Population",
            expression: "IIF($feature.POP == 0 , 'N/A', $feature.POP)"
          }
        ],
        content: [{
          type: "fields", //Autocasts as FieldsContent
          fieldInfos: [ //Autocasts as array of FieldInfo
            {
              fieldName: 'STATUS',
              label: 'Capital Status'
            },
            {
              fieldName: 'expression/POP_EXP',
              label: 'Est. Population',
              format: {
                digitSeparator: true,
                places: 0
              }
            }
          ]
        }]
      }
    })

    return resultLayer
  }

  /**
   * Function which uses the result from the continent query to perform a subsequent query on the citiesLayer
   * @param {*} geometry The geometry object returned from the continent query, used in city query
   * @returns {FeatureSet}
   */
  function queryCityLayer(geometry) {
    cityQuery.geometry = geometry

    return citiesLayer.queryFeatures(cityQuery)
  }

  /**
   * This function returns an array of the names of all the continents in the continentsLayer
   * @returns {Array}
   */
  function createValidContinents() {
    return continentsLayer.queryFeatures(continentsLayer.createQuery()).then( (contFeatures) => {
      let validContinents = []
      contFeatures.features.forEach( function(graphic) {
        validContinents.push(graphic.attributes[continentField])
      })
      return validContinents
    })
  }

  /**
   * Prompts the user to enter the name of a continent and then queries it from the continent layer.
   * @returns {FeatureSet} FeatureSet that include the geometry matching the prompted user input
   */
  function getPromptedContinent() {
    //First create list of valid continents to check against user input
    return createValidContinents().then( (validContinents) => {
      //Get user input
      var continent = prompt("Enter the name of a continent to display the cities of", "North America")
  
      //Keep propmpting user for input until it is valid
      while (!validContinents.includes(continent)) {
        alert(`${continent} is not a continent!\nValid values are:\n${validContinents.join('\n')}`)
  
        continent = prompt("Enter the name of a continent to display the cities of", "North America")
      }
  
      //Update query object based on valid user input
      continentQuery.where = `${continentField} = '${continent}'`
  
      return continentsLayer.queryFeatures(continentQuery)
    })
  }

  /**
   * This function runs the main query chain to select and symbolize cities in a new feature layer that are contained
   * by a continent which the user is prompted for.
   * This function should only be called after the continentsLayer has been loaded.
   */
  function runQuery(){
    getPromptedContinent()

    //Ensure the cities layer has been loaded before querying cities within returned geometry
    .then( (continentResult) => {
      return citiesLayer.when( () => {
        return queryCityLayer(continentResult.features[0].geometry)
      })
    })
  
    //Using the returned geometry, create a new layer 
    .then( cities => createResultLayer(cities) )
  
    //Final processing by adding the new layer to the map and using the view's goTo animation
    .then( (resultLayer) => {
      map.add(resultLayer)
      view.goTo(resultLayer.source)
  
      //Discard query layers when they are no longer needed in order to free up client memory
      continentsLayer.destroy()
      citiesLayer.destroy()
    })
  
    //Catch errors, display message in console then restart this function
    .catch( (error) => {
      console.error("Error occured while querying cities: ", error.message)
      
      runQuery()
    })
  }

  const map = new Map({
    basemap: "satellite"
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    zoom: 3,
    center: [0,0]// longitude, latitude
  });

  const citiesLayer = new FeatureLayer({
    url: citiesURL,
    outFields: [citySymbolField]
  })

  const continentsLayer = new FeatureLayer({
    url: continentsURL
  })
  
  //Start the main query chain once the continentsLayer has been loaded
  continentsLayer.when(runQuery)
  
  /** 
   * Use the layer load methods to trigger the query/prompt process. Since these layers are
   * only used for querying and won't be displayed on the final map, it's better to use the load methods
   * instead of adding them to a map so that resources won't be utilized on drawing/removing the layers from
   * the map view.
   */
  continentsLayer.load()
  citiesLayer.load()

});