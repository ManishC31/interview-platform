import mongoose from "mongoose";

export interface ICandidate {
  _id?: mongoose.Types.ObjectId;
  firstname: string;
  lastname: string;
  email_address: string;
  contact_number: string;
  resume_url?: string;
  resume_text?: string;
  resume_object?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const candidateSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, "First name is required"],
      maxlength: [30, "First name cannot be more than 30 characters"],
    },
    lastname: {
      type: String,
      required: [true, "Last name is required"],
      maxlength: [30, "Last name cannot be more than 30 characters"],
    },
    email_address: {
      type: String,
      unique: true,
      required: [true, "Email address is required"],
    },
    contact_number: {
      type: String,
      required: [true, "Contact number is required"],
    },
    resume_url: {
      type: String,
    },
    resume_text: {
      type: String,
    },
    resume_object: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

const Candidate = mongoose.models.genai2_candidate || mongoose.model("genai2_candidate", candidateSchema);
export default Candidate;
