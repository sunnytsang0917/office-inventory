import multer from 'multer';
import { Request } from 'express';
declare const upload: multer.Multer;
export declare const uploadSingle: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const handleUploadError: (error: any, req: Request, res: any, next: any) => any;
export default upload;
//# sourceMappingURL=upload.d.ts.map