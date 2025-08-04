import Candidate from "@/models/candidate.model";
import { connectToDatabase } from "@/lib/db";

export interface IUser {
  firstname: string;
  lastname: string;
  email_address: string;
  contact_number: string;
}

export const createNewUser = async (user: IUser) => {
  try {
    await connectToDatabase();
    const response = await Candidate.create(user);
    return response;
  } catch (error) {
    console.error("Err in createNewUser:", error);
    throw error;
  }
};
