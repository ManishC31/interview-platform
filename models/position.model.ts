import mongoose, { Schema } from "mongoose";

export interface IPosition {
  _id?: mongoose.Types.ObjectId;
  name: string;
  organization_id: number;
  job_description_url?: string;
  introduction_speech?: string;
  jd_text?: string;
  jd_object?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const positionSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Position name is required"],
      unique: [true, "Position name already exists"],
      maxlength: [200, "Position name cannot be more than 200 characters"],
    },
    organization_id: {
      type: Number,
      required: [true, "Organization id is required"],
    },
    job_description_url: {
      type: String,
    },
    introduction_speech: {
      type: String,
    },
    jd_text: {
      type: String,
    },
    jd_object: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

const Position = mongoose.models.genai2_position || mongoose.model("genai2_position", positionSchema);
export default Position;
