import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    startsAt: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    mode: {
      type: String,
      enum: ["Competitive", "Premier", "Casual", "Wingman", "Deathmatch"],
      default: "Competitive"
    },
    skillLevel: {
      type: String,
      trim: true,
      maxlength: 60
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true }
);

sessionSchema.index({ startsAt: 1 });

export default mongoose.model("Session", sessionSchema);
