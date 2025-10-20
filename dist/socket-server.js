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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocketServer = initializeSocketServer;
var socket_io_1 = require("socket.io");
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var mongodb_1 = require("./mongodb");
// Import all models from centralized location to ensure registration
var models_1 = require("./models");
var activeUsers = new Map();
function initializeSocketServer(httpServer) {
    var _this = this;
    var io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
    });
    // Authentication middleware
    io.use(function (socket, next) { return __awaiter(_this, void 0, void 0, function () {
        var token, decoded, user, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    token = socket.handshake.auth.token;
                    if (!token) {
                        return [2 /*return*/, next(new Error('Authentication required'))];
                    }
                    decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production');
                    return [4 /*yield*/, (0, mongodb_1.connectMongoose)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, models_1.User.findById(decoded.userId).select('-password')];
                case 2:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, next(new Error('User not found'))];
                    }
                    // Attach user to socket
                    socket.data.user = {
                        userId: user._id.toString(),
                        username: user.username,
                        socketId: socket.id,
                    };
                    next();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    next(new Error('Invalid token'));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    io.on('connection', function (socket) { return __awaiter(_this, void 0, void 0, function () {
        var user, userChannels, _i, userChannels_1, channel;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = socket.data.user;
                    console.log("User ".concat(user.username, " connected"));
                    // Add user to active users
                    activeUsers.set(user.userId, user);
                    // Update user status
                    return [4 /*yield*/, models_1.User.findByIdAndUpdate(user.userId, {
                            status: 'online',
                            lastSeen: new Date(),
                        })];
                case 1:
                    // Update user status
                    _a.sent();
                    return [4 /*yield*/, models_1.Channel.find({ members: user.userId })];
                case 2:
                    userChannels = _a.sent();
                    for (_i = 0, userChannels_1 = userChannels; _i < userChannels_1.length; _i++) {
                        channel = userChannels_1[_i];
                        socket.join(channel._id.toString());
                        socket.to(channel._id.toString()).emit('user:status', {
                            userId: user.userId,
                            status: 'online',
                        });
                    }
                    // Handle joining channels
                    socket.on('user:join', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                        var channel, isMember, error_2;
                        var channelId = _b.channelId;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, models_1.Channel.findById(channelId)];
                                case 1:
                                    channel = _c.sent();
                                    if (!channel) {
                                        socket.emit('error', { message: 'Channel not found' });
                                        return [2 /*return*/];
                                    }
                                    isMember = channel.members.includes(user.userId);
                                    if (!isMember && channel.type === 'private') {
                                        socket.emit('error', { message: 'Access denied' });
                                        return [2 /*return*/];
                                    }
                                    socket.join(channelId);
                                    socket.to(channelId).emit('user:join', {
                                        userId: user.userId,
                                        channelId: channelId,
                                    });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_2 = _c.sent();
                                    console.error('Error joining channel:', error_2);
                                    socket.emit('error', { message: 'Failed to join channel' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Handle leaving channels
                    socket.on('user:leave', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                        var channelId = _b.channelId;
                        return __generator(this, function (_c) {
                            socket.leave(channelId);
                            socket.to(channelId).emit('user:leave', {
                                userId: user.userId,
                                channelId: channelId,
                            });
                            return [2 /*return*/];
                        });
                    }); });
                    // Handle typing indicator
                    socket.on('user:typing', function (_a) {
                        var channelId = _a.channelId, isTyping = _a.isTyping;
                        socket.to(channelId).emit('user:typing', {
                            userId: user.userId,
                            channelId: channelId,
                            isTyping: isTyping,
                        });
                    });
                    // Handle sending messages
                    socket.on('message:send', function (data) { return __awaiter(_this, void 0, void 0, function () {
                        var channelId, content, attachments, replyTo, channel, isMember, message, error_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 7, , 8]);
                                    channelId = data.channelId, content = data.content, attachments = data.attachments, replyTo = data.replyTo;
                                    return [4 /*yield*/, models_1.Channel.findById(channelId)];
                                case 1:
                                    channel = _a.sent();
                                    if (!channel) {
                                        socket.emit('error', { message: 'Channel not found' });
                                        return [2 /*return*/];
                                    }
                                    isMember = channel.members.includes(user.userId);
                                    if (!isMember) {
                                        socket.emit('error', { message: 'You must be a member of the channel' });
                                        return [2 /*return*/];
                                    }
                                    message = new models_1.Message({
                                        channelId: channelId,
                                        userId: user.userId,
                                        content: content,
                                        type: (attachments === null || attachments === void 0 ? void 0 : attachments.length) > 0 ? 'file' : 'text',
                                        attachments: attachments,
                                        replyTo: replyTo,
                                        readBy: [user.userId],
                                    });
                                    return [4 /*yield*/, message.save()];
                                case 2:
                                    _a.sent();
                                    // Update channel
                                    channel.lastActivity = new Date();
                                    channel.lastMessage = message._id;
                                    return [4 /*yield*/, channel.save()];
                                case 3:
                                    _a.sent();
                                    // Populate message fields
                                    return [4 /*yield*/, message.populate('userId', 'username avatar status')];
                                case 4:
                                    // Populate message fields
                                    _a.sent();
                                    if (!replyTo) return [3 /*break*/, 6];
                                    return [4 /*yield*/, message.populate('replyTo')];
                                case 5:
                                    _a.sent();
                                    _a.label = 6;
                                case 6:
                                    // Emit to all channel members
                                    io.to(channelId).emit('message:receive', message.toJSON());
                                    return [3 /*break*/, 8];
                                case 7:
                                    error_3 = _a.sent();
                                    console.error('Error sending message:', error_3);
                                    socket.emit('error', { message: 'Failed to send message' });
                                    return [3 /*break*/, 8];
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Handle editing messages
                    socket.on('message:edit', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                        var message, error_4;
                        var messageId = _b.messageId, content = _b.content;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 4, , 5]);
                                    return [4 /*yield*/, models_1.Message.findById(messageId)];
                                case 1:
                                    message = _c.sent();
                                    if (!message) {
                                        socket.emit('error', { message: 'Message not found' });
                                        return [2 /*return*/];
                                    }
                                    if (message.userId.toString() !== user.userId) {
                                        socket.emit('error', { message: 'You can only edit your own messages' });
                                        return [2 /*return*/];
                                    }
                                    message.content = content;
                                    message.edited = true;
                                    message.editedAt = new Date();
                                    return [4 /*yield*/, message.save()];
                                case 2:
                                    _c.sent();
                                    return [4 /*yield*/, message.populate('userId', 'username avatar status')];
                                case 3:
                                    _c.sent();
                                    io.to(message.channelId.toString()).emit('message:edit', {
                                        messageId: messageId,
                                        content: content,
                                        editedAt: message.editedAt,
                                    });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_4 = _c.sent();
                                    console.error('Error editing message:', error_4);
                                    socket.emit('error', { message: 'Failed to edit message' });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Handle deleting messages
                    socket.on('message:delete', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                        var message, error_5;
                        var messageId = _b.messageId;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, models_1.Message.findById(messageId)];
                                case 1:
                                    message = _c.sent();
                                    if (!message) {
                                        socket.emit('error', { message: 'Message not found' });
                                        return [2 /*return*/];
                                    }
                                    if (message.userId.toString() !== user.userId) {
                                        socket.emit('error', { message: 'You can only delete your own messages' });
                                        return [2 /*return*/];
                                    }
                                    message.deletedAt = new Date();
                                    return [4 /*yield*/, message.save()];
                                case 2:
                                    _c.sent();
                                    io.to(message.channelId.toString()).emit('message:delete', {
                                        messageId: messageId,
                                    });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_5 = _c.sent();
                                    console.error('Error deleting message:', error_5);
                                    socket.emit('error', { message: 'Failed to delete message' });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Handle reactions
                    socket.on('message:react', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                        var message, reaction, userIndex, error_6;
                        var _c, _d;
                        var messageId = _b.messageId, emoji = _b.emoji;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    _e.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, models_1.Message.findById(messageId)];
                                case 1:
                                    message = _e.sent();
                                    if (!message) {
                                        socket.emit('error', { message: 'Message not found' });
                                        return [2 /*return*/];
                                    }
                                    reaction = (_c = message.reactions) === null || _c === void 0 ? void 0 : _c.find(function (r) { return r.emoji === emoji; });
                                    if (!reaction) {
                                        message.reactions = message.reactions || [];
                                        reaction = { emoji: emoji, users: [user.userId] };
                                        message.reactions.push(reaction);
                                    }
                                    else {
                                        userIndex = reaction.users.indexOf(user.userId);
                                        if (userIndex === -1) {
                                            reaction.users.push(user.userId);
                                        }
                                        else {
                                            reaction.users.splice(userIndex, 1);
                                            // Remove reaction if no users
                                            if (reaction.users.length === 0) {
                                                message.reactions = (_d = message.reactions) === null || _d === void 0 ? void 0 : _d.filter(function (r) { return r.emoji !== emoji; });
                                            }
                                        }
                                    }
                                    return [4 /*yield*/, message.save()];
                                case 2:
                                    _e.sent();
                                    io.to(message.channelId.toString()).emit('message:react', {
                                        messageId: messageId,
                                        reactions: message.reactions,
                                    });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_6 = _e.sent();
                                    console.error('Error reacting to message:', error_6);
                                    socket.emit('error', { message: 'Failed to react to message' });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Handle disconnect
                    socket.on('disconnect', function () { return __awaiter(_this, void 0, void 0, function () {
                        var userChannels, _i, userChannels_2, channel;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log("User ".concat(user.username, " disconnected"));
                                    // Remove from active users
                                    activeUsers.delete(user.userId);
                                    // Update user status
                                    return [4 /*yield*/, models_1.User.findByIdAndUpdate(user.userId, {
                                            status: 'offline',
                                            lastSeen: new Date(),
                                        })];
                                case 1:
                                    // Update user status
                                    _a.sent();
                                    return [4 /*yield*/, models_1.Channel.find({ members: user.userId })];
                                case 2:
                                    userChannels = _a.sent();
                                    for (_i = 0, userChannels_2 = userChannels; _i < userChannels_2.length; _i++) {
                                        channel = userChannels_2[_i];
                                        socket.to(channel._id.toString()).emit('user:status', {
                                            userId: user.userId,
                                            status: 'offline',
                                        });
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    }); });
    return io;
}
