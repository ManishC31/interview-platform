import { connectToDatabase } from "@/lib/db";
import Position, { IPosition } from "@/models/position.model";
import { Types } from "mongoose";

export const getPositionById = async (id: Types.ObjectId): Promise<IPosition> => {
  try {
    await connectToDatabase();
    const response = await Position.findById(id);
    return response;
  } catch (error) {
    console.log("Err in createPosition:", error);
    throw error;
  }
};

export const getAllPositions = async (): Promise<IPosition[]> => {
  try {
    await connectToDatabase();
    const response = await Position.find();
    return response;
  } catch (error) {
    console.log("Err in getAllPositions:", error);
    throw error;
  }
};

export const createPosition = async (positionData: any): Promise<IPosition> => {
  try {
    await connectToDatabase();
    const response = await Position.create(positionData);
    return response;
  } catch (error) {
    console.log("Err in createPosition:", error);
    throw error;
  }
};
