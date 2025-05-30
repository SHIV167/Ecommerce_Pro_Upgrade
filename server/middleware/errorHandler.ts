import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    files: req.files
  });

  // Prevent HTML responses, always return JSON
  res.setHeader('Content-Type', 'application/json');
  
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: true,
      message: `File upload error: ${err.message}`,
      code: 'UPLOAD_ERROR'
    });
  }

  return res.status(500).json({
    error: true,
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
};
