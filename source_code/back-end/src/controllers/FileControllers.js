import path from 'path';
import fs from 'fs/promises';

export const downloadFile = async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Sanitize filename to prevent directory traversal
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(process.cwd(), 'uploads/training', sanitizedFilename);
        
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({ 
                error: true, 
                message: "File not found" 
            });
        }
        
        // Get file stats and extension
        const stats = await fs.stat(filePath);
        const ext = path.extname(filePath).toLowerCase();
        
        // Determine content type based on extension
        let contentType = 'application/octet-stream';
        const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
        const pdfExtensions = ['.pdf'];
        
        if (videoExtensions.includes(ext)) {
            contentType = `video/${ext.substring(1)}`;
            if (ext === '.mp4') contentType = 'video/mp4';
            if (ext === '.avi') contentType = 'video/x-msvideo';
            if (ext === '.mov') contentType = 'video/quicktime';
            if (ext === '.wmv') contentType = 'video/x-ms-wmv';
            if (ext === '.mkv') contentType = 'video/x-matroska';
        } else if (pdfExtensions.includes(ext)) {
            contentType = 'application/pdf';
        }
        
        // Set headers for streaming (inline display for video/pdf)
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Accept-Ranges', 'bytes');
        
        // Allow iframe embedding for PDF/video
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        res.removeHeader('X-Frame-Options'); // Remove default restrictive header
        
        // Handle range requests for video streaming
        const range = req.headers.range;
        if (range && videoExtensions.includes(ext)) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            const chunksize = (end - start) + 1;
            
            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
            res.setHeader('Content-Length', chunksize);
            
            const fileStream = await fs.readFile(filePath);
            res.send(fileStream.slice(start, end + 1));
        } else {
            // Stream entire file
            const fileStream = await fs.readFile(filePath);
            res.send(fileStream);
        }
        
    } catch (error) {
        console.error('Error downloading file:', error);
        return res.status(500).json({ 
            error: true, 
            message: "Internal server error" 
        });
    }
};
