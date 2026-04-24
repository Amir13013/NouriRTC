import mongoose from 'mongoose';

const muteSchema = new mongoose.Schema({
  userId:   { type: String, required: true },
  serverId: { type: String, required: true },
  expiresAt:{ type: Date,   required: true },
}, { timestamps: true });

muteSchema.index({ userId: 1, serverId: 1 }, { unique: true });

const MuteRecord = mongoose.model('MuteRecord', muteSchema);

export const muteUserService = async (userId, serverId, durationMs) => {
  const expiresAt = new Date(Date.now() + durationMs);
  await MuteRecord.findOneAndUpdate(
    { userId: String(userId), serverId: String(serverId) },
    { $set: { expiresAt } },
    { upsert: true, new: true }
  );
  return expiresAt;
};

export const isUserMutedService = async (userId, serverId) => {
  const mute = await MuteRecord.findOne({
    userId:   String(userId),
    serverId: String(serverId),
    expiresAt: { $gt: new Date() },
  });
  if (mute) return { muted: true, expiresAt: mute.expiresAt };
  await MuteRecord.deleteOne({ userId: String(userId), serverId: String(serverId) });
  return { muted: false };
};

export const unmuteUserService = async (userId, serverId) => {
  await MuteRecord.deleteOne({ userId: String(userId), serverId: String(serverId) });
};
