import multer from 'multer';
import { Request } from 'express';

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 只允许Excel文件
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持Excel文件格式 (.xlsx, .xls)'));
  }
};

// 配置multer
const upload = multer({
  storage: multer.memoryStorage(), // 使用内存存储
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制文件大小为10MB
    files: 1, // 只允许上传一个文件
  },
  fileFilter,
});

// 单文件上传中间件
export const uploadSingle = upload.single('file');

// 错误处理中间件
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大10MB）'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '只能上传一个文件'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: '上传的文件字段名不正确，请使用"file"字段'
      });
    }
  }
  
  if (error.message === '只支持Excel文件格式 (.xlsx, .xls)') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

export default upload;