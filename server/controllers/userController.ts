import { Request, Response } from 'express';
import UserModel from '../models/User';

// Get all users (excluding passwords)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find().select('-password');
    return res.status(200).json(users);
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ message: 'Error fetching users' });
  }
};

// Update user (e.g., isAdmin status)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;
    const user = await UserModel.findByIdAndUpdate(
      id,
      { isAdmin },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(user);
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ message: 'Error updating user' });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ message: 'Error deleting user' });
  }
};
