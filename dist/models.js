"use strict";
// This file ensures all models are properly registered with Mongoose
// Import this file in any API route that uses populate() to avoid MissingSchemaError
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = exports.Channel = exports.User = void 0;
exports.ensureModelsAreRegistered = ensureModelsAreRegistered;
var User_1 = __importDefault(require("@/models/User"));
exports.User = User_1.default;
var Channel_1 = __importDefault(require("@/models/Channel"));
exports.Channel = Channel_1.default;
var Message_1 = __importDefault(require("@/models/Message"));
exports.Message = Message_1.default;
// Force registration of all models
function ensureModelsAreRegistered() {
    // Simply accessing the models ensures they're registered
    var models = {
        User: User_1.default,
        Channel: Channel_1.default,
        Message: Message_1.default
    };
    return models;
}
// Auto-register on import
ensureModelsAreRegistered();
