"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDomainOwnership = exports.optionalAuth = exports.authenticateToken = void 0;
const authService_1 = require("../services/authService");
// Middleware to verify JWT token
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        const decoded = yield authService_1.authService.verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
});
exports.authenticateToken = authenticateToken;
// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = yield authService_1.authService.verifyToken(token);
            req.user = decoded;
        }
        next();
    }
    catch (error) {
        // Continue without authentication
        next();
    }
});
exports.optionalAuth = optionalAuth;
// Middleware to check if user owns a domain
const checkDomainOwnership = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const domainId = parseInt(req.params.domainId || req.params.domain);
        if (!domainId || isNaN(domainId)) {
            return res.status(400).json({ error: 'Invalid domain ID' });
        }
        // Check if domain exists and belongs to user
        const { PrismaClient } = require('../../generated/prisma');
        const prisma = new PrismaClient();
        const domain = yield prisma.domain.findFirst({
            where: {
                id: domainId,
                userId: req.user.userId
            }
        });
        if (!domain) {
            return res.status(404).json({ error: 'Domain not found or access denied' });
        }
        next();
    }
    catch (error) {
        console.error('Domain ownership check error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.checkDomainOwnership = checkDomainOwnership;
