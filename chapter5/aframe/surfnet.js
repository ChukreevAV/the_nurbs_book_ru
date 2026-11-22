AFRAME.registerComponent('surfnet', {
    schema: {
        controlPoints: {
            type: 'array',
            default: [
                0, 0, 0, 1, //x, y, z, w
                1, 1, 0, 1, 
                3, 1, 0, 1,
                4, 0, 0, 1
            ]
        },
        points: {
            type: 'array'
        },
        U: {
            type: 'array',
            default: [0, 0, 0, 0, 1, 1, 1, 1]
        },
        V: {
            type: 'array',
            default: [0, 0, 0, 0, 1, 1, 1, 1]
        },
        u_degree: {
            type: 'int',
            default: 3
        },
        v_degree: {
            type: 'int',
            default: 3
        },
        x_count: {
            type: 'int',
            default: 2
        },
        y_count: {
            type: 'int',
            default: 2
        },
        ustep : {
            type: 'int',
            default: 20
        },
        draw_net: {
            type: 'bool',
            default: true
        },        
        draw_u: {
            type: 'bool',
            default: true
        },
        draw_v: {
            type: 'bool',
            default: true
        },        
        color: {default: '#000'},
        size: {type: 'number', default: 0.03}
    },

    subfunc: function (xend, yend, inv, P, material, gr) {
        var i, x1, y1;
        for (var y = 0; y < yend; y++) {
            var vertices = new Float32Array(xend * 3);
            i = 0;

            for (var x = 0; x < xend; x++) {
                if (inv) { x1 = y; y1 = x; }
                else { x1 = x; y1 = y; }
                var pp = P[x1][y1];
                vertices[i * 3] = pp.x;
                vertices[i * 3 + 1] = pp.y;
                vertices[i * 3 + 2] = pp.z;
                i++;
            }

            var geometry = new THREE.BufferGeometry();
            geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
            var mesh = new THREE.Line(geometry, material);
            mesh.computeLineDistances();
            gr.add(mesh);
        }
    },

    subLineV: function (p, q, U, V, P, u, vstep) {
        var target = new THREE.Vector3(0, 0, 0);
        var vertices = new Float32Array((vstep + 1) * 3);
        var k = 0;
        var mi = Math.min(...V);
        var ma = Math.max(...V);
        var dd = ma - mi
        for (var j = 0; j <= vstep; j++) {
            var v = mi + dd * j / vstep;
            NURBSUtils.calcSurfacePoint(p, q, U, V, P, u, v, target);
            vertices[k * 3] = target.x;
            vertices[k * 3 + 1] = target.y;
            vertices[k * 3 + 2] = target.z;
            k++;
        }
        return vertices;
    },

    subLineU: function (p, q, U, V, P, v, vstep) {
        var target = new THREE.Vector3(0, 0, 0);
        var vertices = new Float32Array((vstep + 1) * 3);
        var k = 0;
        var mi = Math.min(...U);
        var ma = Math.max(...U);
        var dd = ma - mi        
        for (var j = 0; j <= vstep; j++) {
            var u = mi + dd * j / vstep;
            NURBSUtils.calcSurfacePoint(p, q, U, V, P, u, v, target);
            vertices[k * 3] = target.x;
            vertices[k * 3 + 1] = target.y;
            vertices[k * 3 + 2] = target.z;
            k++;
        }
        return vertices;
    },

    makeMesh: function (vertices, material) {
        var vertices, geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
        return new THREE.Line(geometry, material);
    },

    init: function () {
        var group = new THREE.Group();
        var dlmaterial = new THREE.LineDashedMaterial({
            color: "#000",
            opacity: 1,
            transparent: false,
            visible: true,
            dashSize: 0.05,
            gapSize: 0.05
        });

        var psMaterial = new THREE.PointsMaterial({ color: this.data.color, size: this.data.size });
        var psGeometry = new THREE.Geometry();
        var P = [], k = 0;

        this.rendererSystem = this.el.sceneEl.systems.renderer;
        this.data.controlPoints =  this.data.controlPoints.map(Number);

        for (var x = 0; x < this.data.y_count; x++) {
            P.push([]);
            var ps = this.data.points[x];
            for (var y = 0; y < this.data.x_count; y++) {
                P[x].push(ps[y]);
            }
        }

        for (var x = 0; x < this.data.x_count; x++) {
            for (var y = 0; y < this.data.y_count; y++) {
                var pp = P[y][x];
                psGeometry.vertices.push(new THREE.Vector3(pp.x, pp.y, pp.z));
            }
        }

        if (this.data.draw_net) {
        
            var starField = new THREE.Points(psGeometry, psMaterial);
            group.add(starField);

            this.subfunc(this.data.x_count, this.data.y_count, true, P, dlmaterial, group);
            this.subfunc(this.data.y_count, this.data.x_count, false, P, dlmaterial, group);
        }

        var ustep = this.data.ustep, u, v;
        var p = this.data.u_degree, q = this.data.v_degree;
        var U = this.data.U, V = this.data.V;

        if (this.data.draw_u) {
            var mi = Math.min(...U);
            var ma = Math.max(...U);
            var dd = ma - mi
            for (var i = 0; i <= ustep; i++) {
                u = mi + dd * i / ustep;
                vertices = this.subLineU(q, p, V, U, P, u, ustep);
                group.add(this.makeMesh(vertices, psMaterial));
            }
        }

        if (this.data.draw_v) {
            var mi = Math.min(...V);
            var ma = Math.max(...V);
            var dd = ma - mi            
            for (var i = 0; i <= ustep; i++) {
                v = mi + dd * i / ustep;
                vertices = this.subLineV(q, p, V, U, P, v, ustep);
                group.add(this.makeMesh(vertices, psMaterial));
            }
        }

        this.el.setObject3D(this.attrName, group);

    }

});