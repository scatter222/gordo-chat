// This file ensures all models are properly registered with Mongoose
// Import this file in any API route that uses populate() to avoid MissingSchemaError

import User from '@/models/User';
import Channel from '@/models/Channel';
import Message from '@/models/Message';

// Force registration of all models
export function ensureModelsAreRegistered() {
  // Simply accessing the models ensures they're registered
  const models = {
    User,
    Channel,
    Message
  };
  return models;
}

// Export all models for convenience
export { User, Channel, Message };

// Auto-register on import
ensureModelsAreRegistered();