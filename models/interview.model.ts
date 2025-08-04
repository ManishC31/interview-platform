import mongoose, { Schema } from "mongoose";

export interface IInterview {
  _id?: mongoose.Types.ObjectId;
  position_id: mongoose.Types.ObjectId;
  candidate_id: mongoose.Types.ObjectId;
  start_date?: Date;
  expiry_date?: Date;
  organization_id: number;
  active?: boolean;
  status?: "not_started" | "in_progress" | "aborted" | "completed";
  conversation?: any[];
  interview_url?: string;
  result_status?: "not_attempted_yet" | "in_progress" | "completed";
  result?: Record<string, any>;
  started_on?: Date;
  ended_on?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const interviewSchema = new Schema<IInterview>(
  {
    position_id: {
      type: Schema.Types.ObjectId,
      ref: "genai_position",
      required: true,
    },
    candidate_id: {
      type: Schema.Types.ObjectId,
      ref: "genai_candidate",
      required: true,
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    expiry_date: {
      type: Date,
      default: Date.now,
    },
    organization_id: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      default: "not_started",
      enum: ["not_started", "in_progress", "aborted", "completed"],
    },
    conversation: {
      type: Array,
      default: [],
    },
    interview_url: {
      type: String,
      default: "",
    },
    result_status: {
      type: String,
      default: "not_attempted_yet",
      enum: ["not_attempted_yet", "in_progress", "completed"],
    },
    result: {
      type: Object,
      default: {},
    },
    started_on: {
      type: Date,
    },
    ended_on: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.models.genai_interview || mongoose.model("genai_interview", interviewSchema);
export default Interview;
