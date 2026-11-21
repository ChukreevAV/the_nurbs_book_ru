AFRAME.registerComponent('surflines', {
    schema: {
        controlPoints: {
            type: 'array',
            default: [0, 0, 0, 1, 1, 1, 0, 1, 3, 1, 0, 1, 4, 0, 0, 1]
        },
        U: {
            type: 'array',
            default: [0, 0, 0, 0, 1, 1, 1, 1]
        },
        V: {
            type: 'array',
            default: [0, 0, 0, 0, 1, 1, 1, 1]
        },
        p: {
            type: 'int',
            default: 3
        },
        q: {
            type: 'int',
            default: 3
        },
        nx: {
            type: 'int',
            default: 3
        },
        ny: {
            type: 'int',
            default: 3
        },
        ustep : {
            type: 'int',
            default: 10
        },
        draw_u: {
            type: 'bool',
            default: true
        },
        draw_v: {
            type: 'bool',
            default: true
        }
    },

    subLineU: function (p, q, U, V, P, u, vstep) {
        var target = new THREE.Vector3(0, 0, 0);
        var vertices = new Float32Array((vstep + 1) * 3);
        var k = 0;
        for (var j = 0; j <= vstep; j++) {
            var v = j / vstep;
            NURBSUtils.calcSurfacePoint(p, q, U, V, P, u, v, target);
            vertices[k * 3] = target.x;
            vertices[k * 3 + 1] = target.y;
            vertices[k * 3 + 2] = target.z;
            k++;
        }
        return vertices;
    },

    subLineV: function (p, q, U, V, P, v, vstep) {
        var target = new THREE.Vector3(0, 0, 0);
        var vertices = new Float32Array((vstep + 1) * 3);
        var k = 0;
        for (var j = 0; j <= vstep; j++) {
            var u = j / vstep;
            NURBSUtils.calcSurfacePoint(p, q, U, V, P, u, v, target);
            vertices[k * 3] = target.x;
            vertices[k * 3 + 1] = target.y;
            vertices[k * 3 + 2] = target.z;
            k++;
        }
        return vertices;
    },

    makeMesh: function (vertices, material) {
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
        return new THREE.Line(geometry, material);
    },

    init: function () {
        var vertices, group = new THREE.Group();
        var P = [], k = 0;
        var cp = this.data.controlPoints;

        this.rendererSystem = this.el.sceneEl.systems.renderer;

        for (var x = 0; x < this.data.nx; x++) {
            P.push([]);
            for (var y = 0; y < this.data.ny; y++) {
                P[x].push(new THREE.Vector4(cp[k], cp[k + 1], cp[k + 2], cp[k + 3]));
                k += 4;
            }
        }

        material = new THREE.LineBasicMaterial({
            color: "#000000",
            opacity: 1,
            transparent: false,
            visible: true
        });

        var ustep = this.data.ustep, u, v;
        var p = this.data.p, q = this.data.q;
        var U = this.data.U, V = this.data.V;

        if (this.data.draw_u) {
            for (var i = 0; i <= ustep; i++) {
                u = i / ustep;
                vertices = this.subLineU(p, q, U, V, P, u, ustep);
                group.add(this.makeMesh(vertices, material));
            }
        }

        if (this.data.draw_v) {
            for (var i = 0; i <= ustep; i++) {
                v = i / ustep;
                vertices = this.subLineV(p, q, U, V, P, v, ustep);
                group.add(this.makeMesh(vertices, material));
            }
        }

        this.el.setObject3D(this.attrName, group);

    }

});