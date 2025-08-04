import Position, { IPosition } from "@/models/position.model";
import { Types } from "mongoose";

export const getPositionById = async (id: Types.ObjectId): Promise<IPosition> => {
  try {
    const response = await Position.findById(id);
    return response;
  } catch (error) {
    console.log("Err in createPosition:", error);
    throw error;
  }
};

export const createPosition = async (positionData: any): Promise<IPosition> => {
  try {
    const response = await Position.create(positionData);
    return response;
  } catch (error) {
    console.log("Err in createPosition:", error);
    throw error;
  }
};
