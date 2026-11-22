const Direction = {
  U_DIRECTION: 'U_DIRECTION',
  V_DIRECTION: 'V_DIRECTION'
};

surfaces = {
    CreateCurve: function(n, p, UP, Ps) {
        return {
            count: n,
            degree: p,
            U: UP,
            points: Ps
        }
    },

    CreateSurf: function(np, p, UP, mp, q, VP, Pw) {
        return {
            x_count: np,
            y_count: mp,
            u_degree: p,
            v_degree: q,
            U: UP,
            V: VP,
            points: Pw
        }        
    },

    CreateCurveKnotInsertParams: function(u, k, s, r) {
        return {
            uv: u,
            k: k,
            s: s,
            r: r
        }
    },

    FindSpanMult1: function(n, p, U, uu) {
        var k = -1;
        var s = 0;
        var mp = n + p + 1;
        for (var i = p + 1; i <= mp; i++) {
            if (k < 0 & uu <= U[i]) k = i - 1;
            if (k > 0 & uu == U[i]) s++; 
        }
        return {kk: k, ss: s};
    },

    FindSpanMult: function(curve, u) {
        var k = -1;
        var s = 0;
        var mp = curve.count + curve.degree + 1;
        for (var i = curve.degree + 1; i <= mp; i++) {
            if (k < 0 & u <= curve.U[i]) k = i;
            if (k > 0 & u == curve.U[i]) s++; 
        }
        return {kk: k, ss: s};
    },

    CurvePntByCornerCutW: function(curve, u) {
        /* Вычисление точки на рациональной B-сплайн кривой */
        /* Вход: n, p, U, Pw, u */
        /* Выход: C */

        /* Конечная точка и частные случаии */
        if (u == curve.U[0]) return curve.points[0];
        if (u == curve.U[curve.count + curve.degree + 1]) return curve.points[curve.count];

        var ks = surfaces.FindSpanMult(curve, u);      /* Общий слчай */
        var r = curve.degree - ks.ss;
        var Rw = [];
        for (var i = 0; i <= r; i++) Rw[i] = curve.points[ks.kk - curve.degree + i];
        for (var j = 1; j <= r; j++)
            for (var i = 0; i <= r - j; i++)
            {
                var alfa = (u - curve.U[ks.kk - curve.degree + j + i])/(curve.U[i + ks.kk + 1] - curve.U[ks.kk - curve.degree + j + i]);
                //Rw[i] = alfa*Rw[i + 1] + (1.0 - alfa)*Rw[i];
                var p1 = Rw[i].clone();
                var p2 = Rw[i + 1].clone();
                Rw[i] = p2.multiplyScalar(alfa).add(p1.multiplyScalar(1.0 - alfa));
            }
        return Rw[0];
    },

    CurveKnotlns: function(curve, params) {
    /* Вычисление новой кривой после вставки узла */
    /* Вход: np, p, UP, Pw, u, к, s, r  */
    /* Выход: nq, UQ, Qw */
        //var mp = curve.count + curve.degree;
        var nq = curve.count + params.r;
        var UQ = surfaces.CloneKnotVector(curve.U, curve.count + curve.degree, params);
        var Qw = [];
        var Rw = [];
    /* Сохраняем контрольные точки */
        for(var i = 0; i <= params.k - curve.degree; i++) Qw[i] = curve.points[i];
        for(var i = params.k - params.s; i < curve.count; i++) Qw[i + params.r] = curve.points[i];
        for(var i = 0; i <= curve.degree - params.s; i++) Rw[i] = curve.points[params.k - curve.degree + i];
        for(var j = 1; j <= params.r; j++)
        /* Вставляем узел r раз */
        {
            var L = params.k - curve.degree + j;
            for(var i = 0; i <= curve.degree - j - params.s; i++)
            {
                var alpha = (params.uv - curve.U[L + i])/(curve.U[i + params.k + 1] - curve.U[L + i]);
                //Rw[i] = alpha*Rw[i + 1] + (1.0-alpha)*Rw[i];
                var p1 = Rw[i].clone();
                var p2 = Rw[i + 1].clone();
                Rw[i] = p2.multiplyScalar(alpha).add(p1.multiplyScalar(1.0 - alpha));
            }
            Qw[L] = Rw[0];
            Qw[params.k + params.r - j - params.s] = Rw[curve.degree - j - params.s];
        }
        /* Загружаем сохранённые контрольные точки */
        for(var i= L + 1; i < params.k - params.s; i++) Qw[i] = Rw[i - L];
        return surfaces.CreateCurve(nq, curve.degree, UQ, Qw);
    },

    DivedeKnotVector: function(UU, u) {
        var LU = [];
        var RU = [u];

        for (var i = 0; i < UU.length; i++) {
            var tu = UU[i];
            if (tu <= u) LU.push(tu);
            if (tu >= u) RU.push(tu);
        }

        LU.push(u);
        return { Left: LU, Right: RU };
    },

    DivedeCurve: function(curve, u) {
        var ks = surfaces.FindSpanMult(curve, u);
        var params = surfaces.CreateCurveKnotInsertParams(u, ks.kk, ks.ss, curve.degree - ks.ss);
        var ncurve = surfaces.CurveKnotlns(curve, params);
        var lr = surfaces.DivedeKnotVector(ncurve.U, u);
        var ks = params.k - params.s;
        //var kp = ncurve.points[ks];
        var lp = [];
        var rp = [];

        for (var i = 0; i < ncurve.points.length; i++) {
            if (i <= ks) {
                lp.push(ncurve.points[i]);
            }
            if (i >= ks) {
                rp.push(ncurve.points[i]);
            }
        }

        var lc = surfaces.CreateCurve(lp.length, ncurve.degree, lr.Left, lp);
        var rc = surfaces.CreateCurve(rp.length, ncurve.degree, lr.Right, rp);

        return { Left: lc, Right: rc };
    },

    CreateSurfKnotInsertParams: function(dir, uv, k, s, r) {
        return {
            dir: dir,
            uv: uv,
            k: k,
            s: s,
            r: r
        }
    },

    CloneKnotVector: function(U, mp1, params) {
        var UQ = [];
        for(var i = 0; i <= params.k; i++) UQ[i] = U[i];
        for(var i = 1; i <= params.r; i++) UQ[params.k + i] = params.uv;
        for(var i = params.k + 1; i <= mp1; i++) UQ[i + params.r] = U[i];
        return UQ;
    },

    GetAlpha: function(U, p, params) {
        var alpha = [];
        for (var j = 1; j <= params.r; j++)
        {
            var L = params.k - p + j;
            alpha[j] = []
            for (var i = 0; i <= p - j - params.s; i++)
                alpha[j][i] = (params.uv - U[L + i])/(U[i + params.k + 1] - U[L + i]);
        }
        return alpha;
    },

    SurfaceKnotIns: function(surf, params) {
        mp1 = surf.x_count + surf.u_degree;
        mp2 = surf.y_count + surf.v_degree;
        var nq = surf.x_count;
        var mq = surf.y_count;
        var alpha = [];
        var UQ, VQ, Qw;
        if (params.dir == Direction.U_DIRECTION) {
            nq = nq + params.r;
            Qw = Array.from(Array(mq), () => new Array(nq))
            // загружаем u-vector как в A5.1
            UQ = surfaces.CloneKnotVector(surf.U, mp1, params);
            // копируем v-vector в VQ */
            VQ = surf.V.slice();

            /* Сохраняем альфы */
            alpha = surfaces.GetAlpha(surf.U, surf.u_degree, params);

            for (var row = 0; row < surf.y_count; row++) /* Делаем для каждой строки */
            {
                var Rw = []
                /* Сохраняем неизменные контрольные точки */
                for (var i = 0; i <= params.k - surf.u_degree; i++) Qw[row][i] = surf.points[row][i];
                for (var i = params.k - params.s; i < surf.x_count; i++) Qw[row][i + params.r] = surf.points[row][i];
                /* Загружаем вспомогательные контрольные точки. */
                for (var i = 0; i <= surf.u_degree - params.s; i++) Rw[i] = surf.points[row][params.k - surf.u_degree + i];
                for (var j = 1; j <= params.r; j++) /* Вставляем узел r раз */
                {
                    var L = params.k - surf.u_degree + j;
                    for (var i = 0; i <= surf.u_degree - j - params.s; i++) {
                        //Rw[i] = alpha[i][j]*Rw[i + 1] + (1.0-alpha[i][j])*Rw[i];
                        var alpha_ij = alpha[j][i]
                        var p1 = Rw[i].clone();
                        var p2 = Rw[i + 1].clone();
                        Rw[i] = p2.multiplyScalar(alpha_ij).add(p1.multiplyScalar(1.0 - alpha_ij));
                    }                        
                    Qw[row][L] = Rw[0];
                    Qw[row][params.k + params.r - j - params.s] = Rw[surf.u_degree - j - params.s];
                }
                /* Загружаем  сохранённые  контрольные  точки */
                for (var i = L + 1; i < params.k - params.s; i++) Qw[row][i] = Rw[i - L];
            }
        }
        if (params.dir == Direction.V_DIRECTION) {
            mq = mq + params.r;
            Qw = Array.from(Array(mq), () => new Array(nq))
            //
            VQ = surfaces.CloneKnotVector(surf.V, mp2, params);
            // копируем v-vector в VQ */
            UQ = surf.U.slice();
            /* Сохраняем альфы */
            alpha = surfaces.GetAlpha(surf.V, surf.v_degree, params);

            for  (var row = 0; row < surf.x_count; row++) /* Делаем для каждой строки */
            {
                var Rw = []
                /* Сохраняем неизменные контрольные точки */
                for (var i = 0; i <= params.k - surf.v_degree; i++) Qw[i][row] = surf.points[i][row];
                for (var i = params.k - params.s; i < surf.y_count; i++) Qw[i + params.r][row] = surf.points[i][row];
                /* Загружаем вспомогательные контрольные точки. */
                for (var i = 0; i <= surf.v_degree - params.s; i++) Rw[i] = surf.points[params.k - surf.v_degree + i][row];
                for (var j = 1; j <= params.r; j++) /* Вставляем узел r раз */
                {
                    var L = params.k - surf.v_degree + j;
                    for (var i = 0; i <= surf.v_degree - j - params.s; i++) {
                        //Rw[i] = alpha[i][j]*Rw[i + 1] + (1.0-alpha[i][j])*Rw[i];
                        var alpha_ij = alpha[j][i]
                        var p1 = Rw[i].clone();
                        var p2 = Rw[i + 1].clone();
                        Rw[i] = p2.multiplyScalar(alpha_ij).add(p1.multiplyScalar(1.0 - alpha_ij));
                    }                        
                    Qw[L][row] = Rw[0];
                    Qw[params.k + params.r - j - params.s][row] = Rw[surf.v_degree - j - params.s];
                }
                /* Загружаем  сохранённые  контрольные  точки */
                for (var i = L + 1; i < params.k - params.s; i++) Qw[i][row] = Rw[i - L];
            }
        }

        return surfaces.CreateSurf(nq, surf.u_degree, UQ, mq, surf.v_degree, VQ, Qw);
    },

    DivedeSurface: function(surface, dir, uv) {
        var sm, r;

        if (dir == Direction.U_DIRECTION) {
            sm = surfaces.FindSpanMult1(surface.x_count, surface.u_degree, surface.U, uv); 
            r = surface.u_degree - sm.ss;
        }
        if (dir == Direction.V_DIRECTION) {
            sm = surfaces.FindSpanMult1(surface.y_count, surface.v_degree, surface.V, uv); 
            r = surface.v_degree - sm.ss;
        }

        var params = surfaces.CreateSurfKnotInsertParams(dir, uv, sm.kk, sm.ss, r);
        var surf = surfaces.SurfaceKnotIns(surface, params);

        var ks = params.k - params.s;

        var ps = surf.points;
        var lp = [];
        var rp = [];

        if (dir == Direction.U_DIRECTION) {
            var lr = surfaces.DivedeKnotVector(surf.U, uv);
            for (var i = 0; i < surf.y_count; i++) {
                lp.push([]);
                for (var j = 0; j <= ks; j++) {
                    lp[i].push(ps[i][j].clone());
                }

                rp.push([]);
                for (var j = ks; j < surf.x_count; j++) {
                    rp[i].push(ps[i][j].clone());
                }
            }

            var surf1 = surfaces.CreateSurf(ks + 1, surf.u_degree, lr.Left, surf.y_count, surf.v_degree, surf.V, lp);
            var surf2 = surfaces.CreateSurf(surf.x_count - ks, surf.u_degree, lr.Right, surf.y_count, surf.v_degree, surf.V, rp);
            return { Left: surf1, Right: surf2 };
        }
        if (dir == Direction.V_DIRECTION) {
            var lr = surfaces.DivedeKnotVector(surf.V, uv);
            for (var i = 0; i < surf.y_count; i++) {
                if (i <= ks) lp.push([]);
                if (i >= ks) rp.push([]);
                for (var j = 0; j < surf.x_count; j++) {
                    if (i <= ks) lp[i].push(ps[i][j].clone());
                    if (i >= ks) rp[rp.length - 1].push(ps[i][j].clone());
                }
            }

            var surf1 = surfaces.CreateSurf(surf.x_count, surf.u_degree, surf.U, ks + 1, surf.v_degree, lr.Left, lp);
            var surf2 = surfaces.CreateSurf(surf.x_count, surf.u_degree, surf.U, surf.y_count - ks, surf.v_degree, lr.Right, rp);
            return { Left: surf1, Right: surf2 };            
        }
        return surf;
    },

    MoveSurface: function(surface, vec) {
        surface.points.forEach((line) => line.forEach((p) => p.add(vec)));
    }
}