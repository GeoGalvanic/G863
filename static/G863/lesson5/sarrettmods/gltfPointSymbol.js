define([
    "sarrett/gltfObjectSymbol",
    "esri/symbols/PointSymbol3D",
    "esri/core/Collection"
], function(gltfObjectSymbol, PointSymbol3D, Collection){

    var gltfSymbol = PointSymbol3D.createSubclass({
        declaredClass: "sarrett.symbols.gltfPointSymbol",

        constructor: function() {
        },

        properties: {
            symbolLayers: {
                type: Collection.ofType(gltfObjectSymbol),
            },
        },
    });
    return gltfSymbol
});
