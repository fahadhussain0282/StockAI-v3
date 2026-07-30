var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { authRouter } from './src/core/auth';
import { userRouter } from './src/core/users';
import { teamRouter } from './src/core/teams';
import { billingRouter } from './src/core/billing';
import { adminRouter } from './src/routes/admin-routes';
import { aiRouter } from './src/routes/ai-routes';
dotenv.config();
var app = express();
var PORT = Number(process.env.PORT || 3002);
// Increase payload limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Health Check API
app.get('/api/health', function (req, res) {
    var hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({
        status: 'ok',
        geminiConfigured: hasKey,
        timestamp: new Date().toISOString()
    });
});
// Register Module Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api', aiRouter);
app.use('/api', teamRouter);
app.use('/api', billingRouter);
app.use('/api/admin', adminRouter);
// Vite Middleware for development vs Static serving for production
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var createViteServer, vite, distPath_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(process.env.NODE_ENV !== 'production')) return [3 /*break*/, 3];
                    return [4 /*yield*/, import('vite')];
                case 1:
                    createViteServer = (_a.sent()).createServer;
                    return [4 /*yield*/, createViteServer({
                            server: { middlewareMode: true },
                            appType: 'spa'
                        })];
                case 2:
                    vite = _a.sent();
                    app.use(vite.middlewares);
                    return [3 /*break*/, 4];
                case 3:
                    distPath_1 = path.join(process.cwd(), 'dist');
                    app.use(express.static(distPath_1));
                    app.get('*', function (req, res) {
                        res.sendFile(path.join(distPath_1, 'index.html'));
                    });
                    _a.label = 4;
                case 4:
                    app.listen(PORT, '0.0.0.0', function () {
                        console.log("StockAI Server listening on http://0.0.0.0:".concat(PORT));
                        console.log('Enterprise Authentication & Access Control Active.');
                    });
                    return [2 /*return*/];
            }
        });
    });
}
// Export app for Vercel Serverless Functions
export default app;
// Only start the standalone server if NOT running on Vercel
if (!process.env.VERCEL) {
    startServer();
}
