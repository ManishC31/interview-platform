import Candidate from "@/models/candidate.model";
import { connectToDatabase } from "@/lib/db";

export interface IUser {
  firstname: string;
  lastname: string;
  email_address: string;
  contact_number: string;
}

export const getUserById = async (id: number) => {
  try {
    await connectToDatabase();
    const response = await Candidate.findById(id);
    return response;
  } catch (error) {
    console.error("Err in createNewUser:", error);
    throw error;
  }
};

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
