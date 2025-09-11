import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import multer from "fastify-multer";
import multipart from "@fastify/multipart";

// Define uploads directory
export const uploadsDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({ storage });


// export const multipartConfig = {
//   limits: {
//     fileSize: 10 * 1024 * 1024,
//   },
// };

// export const registerMultipart = (fastify) => {
//   fastify.register(multipart, multipartConfig);
// };


export const registerMultipart = (fastify) => {
  fastify.register(multipart);
};