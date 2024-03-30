define([
    "esri/symbols/ObjectSymbol3DLayer"
], function(ObjectSymbol3DLayer){
    var gltfSymbol = ObjectSymbol3DLayer.createSubclass({
        declaredClass: "sarrett.symbols.gltfObjectSymbol",

        constructor: function() {
            this.url = "";
            this.width = undefined;
            this.depth = undefined;
        },

        type: "gltf-object",

        properties: {
            url: {
                get: function() {
                    return this.url
                },
                set: function(value) {
                    this._set("url", value)
                    this.resource = {href: value}
                }
            },
            type: {
                readOnly: true
            }
        },
    });
    return gltfSymbol
});
