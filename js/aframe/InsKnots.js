InsKnots = {
    CurveKnotlns: function (np, p, UP, Pw, u, k, s, r, nq, UQ, Qw) {
        /* Вычисление новой кривой после вставки узла */
        /* Вход: np, p, UP, Pw, u, к, s, r  */
        /* Выход: nq, UQ, Qw */

/*
np - количество точек - 1 в Pw
p - степень кривой
UP - узловой вектор
Pw - точки управляющего полигона
u - новый параметр
k - позиция для вставки
s - степень нового параметра (сколько он уже встречается в узловом векторе)
r - сколькой раз вставляем
nq - новое количество точек
UQ - новый узловой вектор
Qw - новые контрольные точки
*/
        var mp = np + p + 1;
        nq = np + r;
        /* Загружаем новый узловой вектор */
        for (var i = 0; i <= k; i++) UQ[i] = UP[i];
        for (var i = 1; i <= r; i++) UQ[k + i] = u;
        for (var i = k + 1; i <= mp; i++) UQ[i + r] = UP[i];
        /* Сохраняем контрольные точки */
        var Rw = []
        for (var i = 0; i <= k - p; i++) Qw[i] = Pw[i];
        for (var i = k - s; i <= np; i++) Qw[i + r] = Pw[i];
        for (var i = 0; i <= p - s; i++) Rw[i] = Pw[k - p + i];
        /* Вставляем узел r раз */
        for (var j = 1; j <= r; j++)       
        {
            L = k - p + j;
            for (var i = 0; i <= p - j - s; i++) {
                var alpha = (u - UP[L + i]) / (UP[i + k + 1] - UP[L + i]);
                var p1 = Rw[i];
                var p2 = Rw[i + 1];
                var x = alpha * p2.x + (1.0 - alpha) * p1.x;
                var y = alpha * p2.y + (1.0 - alpha) * p1.y;
                Rw[i] = new THREE.Vector2(x, y);
            }
            Qw[L] = Rw[0];
            Qw[k + r - j - s] = Rw[p - j - s];
        }
        /* Загружаем сохранённые контрольные точки */
        for(var i = L + 1; i < k-s; i++) Qw[i]  = Rw[i - L];
    },

    FindSpanMult: function(n, p, u, U) {
        var k = -1;
        var s = 0;
        var mp = n + p + 1;
        for (var i = p + 1; i <= mp; i++) {
            if (k < 0 & u <= U[i]) k = i;
            if (k > 0 & u == U[i]) s++; 
        }
        return {kk: k, ss: s};
    },

    CurvePntByCornerCut: function(n, p, U, Pw, u) {
        /* Вычисление точки на рациональной B-сплайн кривой */
        /* Вход: n, p, U, Pw, u */
        /* Выход: C */

        /* Конечная точка и частные случаии */
        if (u == U[0]) return Pw[0];
        if (u == U[n + p + 1]) return Pw[n];

        var ks = InsKnots.FindSpanMult(n, p, u, U);      /* Общий слчай */
        var r = p - ks.ss;
        var Rw = [];
        for (var i = 0; i <= r; i++) Rw[i] = Pw[ks.kk - p + i];
        for (var j = 1; j <= r; j++)
            for (var i = 0; i <= r - j; i++)
            {
                var alfa = (u - U[ks.kk - p + j + i])/(U[i + ks.kk + 1] - U[ks.kk - p + j + i]);
                //Rw[i] = alfa*Rw[i + 1] + (1.0 - alfa)*Rw[i];
                var p1 = Rw[i].clone();
                var p2 = Rw[i + 1].clone();
                Rw[i] = p2.multiplyScalar(alfa).add(p1.multiplyScalar(1.0 - alfa));
            }
        return Rw[0];
    },

    CurvePntByCornerCutW: function(n, p, U, Pw, u, C) {
        /* Вычисление точки на рациональной B-сплайн кривой */
        /* Вход: n, p, U, Pw, u */
        /* Выход: C */

        if (u == U[0]) /* Конечная точка и частные случаии */
        {
            С = Pw[0]/w;
            return;
        }
        if (u == U[n + p + 1])
        {
            С = Pw[n]/w;
            return;
        }

        var k = -2;
        var s = -1;
        InsKnots.FindSpanMult(n, p, u, U, k, s);      /* Общий слчай */
        r = p - s;
        for (var i = 0; i <= r; i++) Rw[i] = Pw[k - p + i];
        for (var j = 1; j <= r; j++)
            for (var i = 0; i <= r - j; i++)
            {
                var alfa = (u - U[k-p+j+i])/(U[i+k+1] - U[k-p+j+i]);
                Rw[i] = alfa*Rw[i+1] + (1.0 - alfa)*Rw[i];
            }
        С = Rw[0]/w;
    },

    SurfaceKnotIns: function(np, p, UP, mp, q, VP, Pw, dir, uv, k, s, r, nq, UQ, mq, VQ, Qw) {
        /* Вставка узла в поверхность */
        /* Вход: np, p, UP, mp, q, VP, Pu, dir, uv, k, s, r  */
        /* Выход: nq, UQ, mq, VQ, Qw */
        if   (dir == 'U_DIRECTION')
        {
            mp1 = np + p + 1;
            mp2 = mp + q + 1;
            nq = np + r;
            mq = mp;
            var alpha = []
            Qw = Array.from(Array(mq + 1), () => new Array(nq + 1))
            
            // загружаем u-vector как в A5.1
            for(var i = 0; i <= k; i++) UQ[i] = UP[i];
            for(var i = 1; i <= r; i++) UQ[k + i] = uv;
            for(var i = k + 1; i <= mp1; i++) UQ[i + r] = UP[i];
            // копируем v-vector в VQ */
            for(var i = 0; i <= mp2; i++) VQ[i] = VP[i];
            /* Сохраняем альфы */
            for (var j = 1; j <= r; j++)
            {
                var L = k - p + j;
                alpha[j] = []
                for (var i = 0; i <= p - j - s; i++)
                    alpha[j][i] = (uv - UP[L + i])/(UP[i + k + 1] - UP[L + i]);
            }

            for  (var row = 0; row <= mp; row++) /* Делаем для каждой строки */
            {
                var Rw = []
                /* Сохраняем неизменные контрольные точки */
                for (var i = 0; i <= k - p; i++) Qw[row][i] = Pw[row][i];
                for (var i = k - s; i <= np; i++) Qw[row][i + r] = Pw[row][i];
                /* Загружаем вспомогательные контрольные точки. */
                for (var i = 0; i <= p - s; i++) Rw[i] = Pw[row][k - p + i];
                for (var j = 1; j <= r; j++) /* Вставляем узел r раз */
                {
                    var L = k - p + j;
                    for (var i = 0; i <= p - j - s; i++) {
                        //Rw[i] = alpha[i][j]*Rw[i + 1] + (1.0-alpha[i][j])*Rw[i];
                        var alpha_ij = alpha[j][i]
                        var p1 = Rw[i].clone();
                        var p2 = Rw[i + 1].clone();
                        Rw[i] = p2.multiplyScalar(alpha_ij).add(p1.multiplyScalar(1.0 - alpha_ij));
                    }                        
                    Qw[row][L] = Rw[0];
                    Qw[row][k + r - j - s] = Rw[p - j - s];
                }
                /* Загружаем  сохранённые  контрольные  точки */
                for (var i = L + 1; i < k - s; i++) Qw[row][i] = Rw[i - L];
            }
        }
        if  (dir == 'V_DIRECTION')
        {
            //Аналогичный код, как описано выше с u- и v-направленным переключением параметров.
            mp1 = np + p + 1;
            mp2 = mp + q + 1;
            nq = np;
            mq = mp + r;
            var alpha = []
            Qw = Array.from(Array(mq + 1), () => new Array(nq + 1))

            // загружаем u-vector как в A5.1
            for(var i = 0; i <= k; i++) VQ[i] = VP[i];
            for(var i = 1; i <= r; i++) VQ[k + i] = uv;
            for(var i = k + 1; i <= mp2; i++) VQ[i + r] = VP[i];
            // копируем v-vector в VQ */
            for(var i = 0; i <= mp1; i++) UQ[i] = UP[i];
            /* Сохраняем альфы */
            for (var j = 1; j <= r; j++)
            {
                var L = k - q + j;
                alpha[j] = []
                for (var i = 0; i <= q - j - s; i++)
                    alpha[j][i] = (uv - VP[L + i])/(VP[i + k + 1] - VP[L + i]);
            }

            for  (var row = 0; row <= np; row++) /* Делаем для каждой строки */
            {
                var Rw = []
                /* Сохраняем неизменные контрольные точки */
                for (var i = 0; i <= k - q; i++) Qw[i][row] = Pw[i][row];
                for (var i = k - s; i <= mp; i++) Qw[i + r][row] = Pw[i][row];
                /* Загружаем вспомогательные контрольные точки. */
                for (var i = 0; i <= q - s; i++) Rw[i] = Pw[k - p + i][row];
                for (var j = 1; j <= r; j++) /* Вставляем узел r раз */
                {
                    var L = k - q + j;
                    for (var i = 0; i <= q - j - s; i++) {
                        //Rw[i] = alpha[i][j]*Rw[i + 1] + (1.0-alpha[i][j])*Rw[i];
                        var alpha_ij = alpha[j][i]
                        var p1 = Rw[i].clone();
                        var p2 = Rw[i + 1].clone();
                        Rw[i] = p2.multiplyScalar(alpha_ij).add(p1.multiplyScalar(1.0 - alpha_ij));
                    }                        
                    Qw[L][row] = Rw[0];
                    Qw[k + r - j - s][row] = Rw[q - j - s];
                }
                /* Загружаем  сохранённые  контрольные  точки */
                for (var i = L + 1; i < k - s; i++) Qw[i][row] = Rw[i - L];
            }
        }
        return { xx : nq, yy : mq, points : Qw };
    }
}