test_surface = {
    Create: function() {
        var P = [[
            new THREE.Vector4(0.3, 1.7, 0, 1),
            new THREE.Vector4(0.7, 1.7, 0, 1), 
            new THREE.Vector4(0.9, 1.2, 0, 1),
            new THREE.Vector4(1.3, 1.2, 0, 1)
        ], [
            new THREE.Vector4(0.3, 1.7, 0.8, 1), 
            new THREE.Vector4(0.7, 1.7, 0.8, 1), 
            new THREE.Vector4(0.9, 1.2, 0.8, 1),
            new THREE.Vector4(1.3, 1.2, 0.8, 1)
        ], [
            new THREE.Vector4(0.3, 1.2, 1.1, 1), 
            new THREE.Vector4(0.7, 1.2, 1.1, 1), 
            new THREE.Vector4(0.9, 0.5, 1.1, 1), 
            new THREE.Vector4(1.3, 0.5, 1.1, 1)
        ],[
            new THREE.Vector4(0.3, 1.2, 1.8, 1), 
            new THREE.Vector4(0.7, 1.2, 1.8, 1), 
            new THREE.Vector4(0.9, 0.5, 1.8, 1),
            new THREE.Vector4(1.3, 0.5, 1.8, 1)
        ]];

        var U = [0, 0, 0, 0, 1, 1, 1, 1];
        var V = [0, 0, 0, 0.5, 1, 1, 1];

        return surfaces.CreateSurf(4, 3, U, 4, 2, V, P);
    },
}