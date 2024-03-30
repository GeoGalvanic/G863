var citiesURL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer"
var continentsURL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Continents/FeatureServer"
var relationship = "contains"
var continentField = "CONTINENT"
var citySymbolField = "POP_RANK"
var openSidebarFeature //variable that will hold the currently open feature in the sidebar

/**
 * This function creates an HTML select element that stores continent values. The selector is used in the UI to
 * trigger a query on world cities within the continent.
 * @returns {HTMLSelectElement} 
 */
function createContinentSelector() {
  const selector = document.createElement('select')
  selector.setAttribute('id', 'continentSelector')
  selector.setAttribute('name', 'continentSelector')

  const placeholder = document.createElement('OPTION')
  placeholder.text = 'Select a Continent'
  placeholder.setAttribute('disabled', true)
  placeholder.setAttribute('selected', true)

  selector.appendChild(placeholder)

  return selector
}

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
  defaultLabel: "Unknown Population",
  field: citySymbolField,
  uniqueValueInfos: [
    { label: "Largest", value: 1, symbol: getResultSymbol([0,0,0], 18) },
    { label: "Larger", value: 2, symbol: getResultSymbol([37,37,37], 16) },
    { label: "Large", value: 3, symbol: getResultSymbol([82,82,82], 14) },
    { label: "Medium", value: 4, symbol: getResultSymbol([115,115,115], 12) },
    { label: "Small", value: 5, symbol: getResultSymbol([150,150,150], 10) },
    { label: "Smaller", value: 6, symbol: getResultSymbol([189,189,189], 8) },
    { label: "Smallest", value: 7, symbol: getResultSymbol([217,217,217], 6) },
  ],
  legendOptions: {title: "Population Size"}
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
  "esri/layers/FeatureLayer",
  "esri/widgets/Legend",
  "esri/widgets/DistanceMeasurement2D",
  "esri/widgets/BasemapGallery"
], (
  Map,
  MapView,
  FeatureLayer,
  Legend,
  Measure2D,
  BasemapGallery
) => {

  /**
   * Class that represents a feature and it's associated elements that are loaded in the sidebar UI.
   * Using a class based approach rather than an array based approach simplifies the code greatly and makes it possible
   * to maintain feature/element relationships if features or elements are deleted or moved within their order.
   */
  class sidebarFeature{
    /**
     * 
     * @param {Graphic} graphic An ESRI JS API Graphic that represents a world city 
     * @param {FeatureLayer} layer The FeatureLayer that contains the graphic
     */
    constructor(graphic, layer){
      this.layer = layer
      this.graphic = graphic
      this.name = graphic.attributes["CITY_NAME"]
      this.country = graphic.attributes["CNTRY_NAME"]
      this.status = graphic.attributes["STATUS"]
      this.pop = graphic.attributes["POP"]
  
      //Construct the HTML element for this feature that will be displayed in the sidebar
      const element = document.createElement("div")
      element.classList = "bubble-container site-button"
      element.innerHTML = `${this.name}, ${this.country}`
      element.style.width = "calc(100% - 2em)"
      element.addEventListener("click", () => this.elementClick() )

      const fieldInfo = document.createElement("div") //Container which displays field info when the feature is "open"
      fieldInfo.style.display = 'none'

      const fieldTable = document.createElement("table")
      fieldTable.style.border = 'thin solid var(--secondary-color)'
      fieldTable.style.color = 'var(--text-color)'
      fieldTable.style.width = "100%"

      const statusRow = document.createElement("tr")
      statusRow.style.backgroundColor = 'rgba(255,255,255,0.2)'
      const statusLabel = document.createElement("td")
      statusLabel.innerHTML = "Status"
      statusRow.appendChild(statusLabel)
      const statusValue = document.createElement("td")
      statusValue.innerHTML = this.status
      statusRow.appendChild(statusValue)

      const popRow = document.createElement("tr")
      popRow.style.backgroundColor = 'rgba(0,0,0,0.2)'
      const popLabel = document.createElement("td")
      popLabel.innerHTML = "Population"
      popRow.appendChild(popLabel)
      const popValue = document.createElement("td")
      popValue.innerHTML = this.pop
      popRow.appendChild(popValue)

      fieldTable.appendChild(statusRow)
      fieldTable.appendChild(popRow)
      fieldInfo.appendChild(fieldTable)
      element.appendChild(fieldInfo)
  
      this.element = element
      document.getElementById("ui-sidebar-content").appendChild(element)

      /**
       * Method that "closes" the sidebar feature by turning off the display for its children
       */
      this.closeElement = () => {
        Array.from(this.element.children).forEach( (child) => {
          child.style.display = 'none'
        })
      }
    }
  
    /**
     * This method calls the close method of any currently "open" sidebar features and then opens this sidebar feature
     * by turning on the display for its children.
     */
    elementClick() {
      view.popup.open({ features: [this.graphic], updateLocationEnabled: true })
      if (openSidebarFeature != undefined) {
        openSidebarFeature.closeElement()
      }
      Array.from(this.element.children).forEach( (child) => {
        child.style.display = 'block'
      })
      openSidebarFeature = this
    }
  }

  /**
   * Returns a layer created from the results of querying the citiesLayer
   * @param {FeatureSet} cities The cities feature set that was returned from a Query result
   * @returns {FeatureLayer}
   */
  function createResultLayer(cities, title) {
    const resultLayer = new FeatureLayer({
      source: cities.features,
      title: title + " Citites",
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
    .then((result) => {
      if (result.features < 1) {
        alert("There are no world cities in the selected continent... yet.")
        throw new Error("Not enough cities to create a layer.")
      } else {
        return result
      }
    })
    
  }

  /**
   * This function returns an array of the names of all the continents in the continentsLayer
   * @returns {Array}
   */
  function addValidContinents(selector) {
    continentsLayer.queryFeatures(continentsLayer.createQuery()).then( (contFeatures) => {
      contFeatures.features.forEach( function(graphic) {
        const contName = graphic.attributes[continentField]
        const contOpt = document.createElement('option')
        contOpt.text = contName
        contOpt.value = contName
        selector.appendChild(contOpt)
      })
    })
  }

  /**
   * Prompts the user to enter the name of a continent and then queries it from the continent layer.
   * @returns {FeatureSet} FeatureSet that include the geometry matching the prompted user input
   */
   function getSelectedContinent(selectedContinent) {
      //Update query object based on valid user input
      continentQuery.where = `${continentField} = '${selectedContinent}'`
  
      return continentsLayer.queryFeatures(continentQuery)
  }

  /**
   * This function runs the main query chain to select and symbolize cities in a new feature layer that are contained
   * by the continent the user has selected from the UI.
   * This function should only be called after the continentsLayer has been loaded.
   */
  function runQuery(selector){
    const selectedContinent = selector.value
    getSelectedContinent(selectedContinent)

    //Ensure the cities layer has been loaded before querying cities within returned geometry
    .then( (continentResult) => {
      return citiesLayer.when( () => {
        return queryCityLayer(continentResult.features[0].geometry)
      })
    })
  
    //Using the returned geometry, create a new layer 
    .then( cities => createResultLayer(cities, selectedContinent) )
  
    //Final processing by adding the new layer to the map and using the view's goTo animation
    .then( (resultLayer) => {
      map.add(resultLayer)
      view.goTo(resultLayer.source)

      //Add result features to map
      resultLayer.source.forEach((graphic) => { new sidebarFeature(graphic, resultLayer) })

      //disable the option so that duplicate layers are not created
      const selectedOpt = selector.options[selector.selectedIndex]
      selectedOpt.disabled = true
      selectedOpt.text += " (added)"
    })
  
    //Catch errors, and display message in console
    .catch( (error) => {
      console.error("Error occured while querying cities: ", error.message)
    })
  }

  /**
   * This function creates necessary UI elements and adds them to the main view. Function should be called once the view
   * has loaded.
   * @param {View} view The main view for the application where UI elements should be added
   */
  function addUIElements(view) {
    /**
     * Create a new UI container that will be the parent for the default ui container plus the new sidebar element.
     * New container structure prevents the sidebar from overlapping default ui elements while still placing it
     * "inside" of the view. 
     */
    const mainUI = document.querySelector(`#${view.container.id} .esri-ui`) //default UI container
    const viewRoot = document.querySelector(`#${view.container.id} .esri-view-root`) //parent of new UI container
    const uiCont = document.getElementById("ui-flex-container") //new UI container
    viewRoot.appendChild(uiCont)

    mainUI.style.position = "relative"
    mainUI.style.width = "100%"
    uiCont.appendChild(mainUI)

    const sideButton = document.getElementById("ui-sidebar-button")
    //set the default state of the sidebar to "closed" if the view container is too small
    if (view.container.clientWidth < 700){
      sideButton.innerHTML = "◀"
      sideButton.parentElement.style.gridTemplateColumns = "2em"
    }

    /**
     * Function that closes/opens the sidebar when the button is pressed
     */
    sideButton.addEventListener("click", function(){
      if (this.innerHTML == "▶") {
        this.parentElement.style.gridTemplateColumns = "2em"
        this.innerHTML = "◀"
        mainUI.style.display = "unset"
        
      } else {
        this.parentElement.style.gridTemplateColumns = "2em 1fr"
        this.innerHTML = "▶"
        if (view.container.clientWidth < 700){
          mainUI.style.display = "none"
        }
      }
    })

    //Add continent selector to the ui
    continentSelector = createContinentSelector()
    view.ui.add(continentSelector, "bottom-right")
    continentSelector.addEventListener("change", function(){runQuery(this)})
    continentsLayer.when(() => {addValidContinents(continentSelector)})

    //Add widget selector for legend, basemap and measure tool
    view.ui.add(legend, "top-right")
    const widgetSelector = document.createElement('select')
    widgetSelector.setAttribute('id', 'widgetSelector')
    widgetSelector.setAttribute('name', 'widgetSelector')

    //Legend
    const legendOpt = document.createElement('OPTION')
    legendOpt.text = 'Legend'
    legendOpt.value = 'legend'
    widgetSelector.appendChild(legendOpt)

    //Basemap Gallery
    const bmOpt = document.createElement('OPTION')
    bmOpt.text = 'Basemap Gallery'
    bmOpt.value = 'bmGal'
    widgetSelector.appendChild(bmOpt)

    //Measurement Tool
    const measureOpt = document.createElement('OPTION')
    measureOpt.text = 'Measuring Tool'
    measureOpt.value = 'measure'
    widgetSelector.appendChild(measureOpt)

    //None
    const noneOpt = document.createElement('OPTION')
    noneOpt.text = 'No Widgets'
    noneOpt.value = ''
    widgetSelector.appendChild(noneOpt)

    view.ui.add(widgetSelector, "bottom-left")
    /**
     * Function that changes the displayed widget based on the user selection
     */
    widgetSelector.addEventListener("change", function(){
      view.ui.empty("top-right")
      switch (this.value) {
        case 'legend':
          view.ui.add(legend, "top-right")
          break;
        case 'bmGal':
          view.ui.add(bmGal, "top-right")
          break;
        case 'measure':
          view.ui.add(measure, "top-right")
          break;
        default:
          break;
      }
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

  const legend = new Legend({
    view: view,
    basemapLegendVisible: false,
    hideLayersNotInCurrentView: true,
  })

  const measure = new Measure2D({
    view: view,
  })

  const bmGal = new BasemapGallery({
    view: view,
  })

  view.when( () => {
    /** 
     * Use the layer load methods to trigger the query/prompt process. Since these layers are
     * only used for querying and won't be displayed on the final map, it's better to use the load methods
     * instead of adding them to a map so that resources won't be utilized on drawing/removing the layers from
     * the map view.
     */
    continentsLayer.load()
    citiesLayer.load()

    addUIElements(view)

  })
  
});