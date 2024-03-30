require([
  "sarrett/gltfPointSymbol",
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer"
], (
  gltfPointSymbol,
  Map,
  SceneView,
  FeatureLayer
) => {
  /**
   * A custom 3DPointSymbol Object
   * @typedef gltfPointSymbol
   */

  /**
   * Function that creates a garbage bin 3D model symbol using color as input
   * @param {string|Object|Array} color - The value of the color object to multiply the 3D model textures by
   * @returns {gltfPointSymbol}
   */
  function makeGarbageSymbol(color = "white"){
    return new gltfPointSymbol({
      symbolLayers: [{ //autocasts each object in collection as sarrett/gltfObjectSymbol
        height: 2,
        url: "/static/G863/lesson5/garbagebin/scene.gltf",
        material: { color: color },
      }] 
    })
  };

  /**
   * Function that creates a basic 3D model symbol with url as input
   * @param {string} url - The url to a valid gltf model file
   * @returns {gltfPointSymbol}
   */
  function makeTreeSymbol(url = "/static/G863/lesson5/Tree5/scene.gltf"){
    return new gltfPointSymbol({
      symbolLayers: [{ //autocasts each object in collection as sarrett/gltfObjectSymbol
        height: 3,
        url: url
      }] 
    })
  };

  const map = new Map({
    basemap: "dark-gray-vector"
  });

  const scene = new SceneView({
    container: "viewDiv",
    map: map,
    camera: { //Autocasts as new Camera
      position: { //Autocasts as new Point
        longitude: -117.328,
        latitude: 33.973,
        z: 100
      },
      tilt: 45
    }
  });

  //Layer for Recycling Bins
  let garbageLayer = new FeatureLayer({
    url: "https://services2.arcgis.com/gEkdGxewdPuR5Nso/arcgis/rest/services/Recycling_Bins_CampusMap/FeatureServer",
    renderer: {
      type: "unique-value", //autocasts as esri/renderers/UniqueValuesRenderer
      field: "RecycleTyp",
      defaultSymbol: makeGarbageSymbol(),
      uniqueValueInfos: [
        {
          label: "Styrofoam",
          value: "Styrofoam Bin",
          symbol: makeGarbageSymbol("pink")
        }, {
          label: "Plastic",
          value: "Plastic Recyling Bins",
          symbol: makeGarbageSymbol("blue")
        }, {
          label: "Metal",
          value: "Metal Recyling Bins",
          symbol: makeGarbageSymbol("lightsteelblue")
        }, {
          label: "Converted",
          value: "Converted Recyling Bins",
          symbol: makeGarbageSymbol("purple")
        }, {
          label: "Bottles & Cans",
          value: "Bottles and Cans '2 Holed Bins'",
          symbol: makeGarbageSymbol("green")
        }
      ]
    },
    minScale: 15000,
    popupEnabled: true,
    popupTemplate: {
      title: "{RecycleTyp}",
      content: [{
        type: "text", //Autocasts as TextContent
        text: `{expression/notes}<br />
        {expression/building}<br />
        {expression/floor}`
      }],
      expressionInfos: [ //Autocasts as collection of ExpressionInfo
        {
          name: "notes",
          expression: "IIf( $feature.Notes == ' ', '', Concatenate(['Notes: ', $feature.Notes]) )"
        },
        {
          name: "building",
          expression: "IIf( $feature.Notes == ' ', '', Concatenate(['Building: ', $feature.Building]) )"
        },
        {
          name: "floor",
          expression: "IIf( $feature.Notes == ' ', '', Concatenate(['Flr/Rm: ', $feature.Floor, '/', $feature.Room]) )"
        },
      ]
    }
  });

  //Layer for trees
  let treeLayer = new FeatureLayer({
    url: "https://services2.arcgis.com/gEkdGxewdPuR5Nso/arcgis/rest/services/Trees_Survey_2019/FeatureServer",
    renderer: {
      type: "unique-value", //autocasts as esri/renderers/UniqueValuesRenderer
      field: "COMMON",
      defaultSymbol: makeTreeSymbol(),
      uniqueValueInfos: [
        {
          label: "Chinese Flame Tree",
          value: "Chinese Flame Tree",
          symbol: makeTreeSymbol("/static/G863/lesson5/Tree1/scene.gltf")
        }, {
          label: "California Sycamore",
          value: "California Sycamore",
          symbol: makeTreeSymbol("/static/G863/lesson5/Tree2/scene.gltf")
        }, {
          label: "Lemon-Scented Gum",
          value: "Lemon-Scented Gum",
          symbol: makeTreeSymbol("/static/G863/lesson5/Tree3/scene.gltf")
        }, {
          label: "Evergreen Pear",
          value: "Evergreen Pear",
          symbol: makeTreeSymbol("/static/G863/lesson5/Tree4/scene.gltf")
        }
      ],
      visualVariables: [
        {
          type: "size", //Autocasts as SizeVisualVariable
          axis: "height",
          valueExpression: "IIf(IsNan(Number( $feature.HEIGHT, '## ft' ) ), 20, Number( $feature.HEIGHT, '## ft' ))",
          valueUnit: "feet"
        }
      ]
    },
    minScale: 15000,
    popupEnabled: true,
    popupTemplate: {
      title: "{BOTANICAL}",
      content: [{
        type: "attachments", //Autocasts as AttachmentsContent
        displayType: "preview"
      }],
    }
  });


  map.addMany([garbageLayer,treeLayer])
  
});