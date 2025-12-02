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
        
        // Get file stats
        const stats = await fs.stat(filePath);
        const originalName = sanitizedFilename.replace(/^.*_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}_\d+/, '');
        
        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // Stream file to response
        const fileStream = await fs.readFile(filePath);
        res.send(fileStream);
        
    } catch (error) {
        console.error('Error downloading file:', error);
        return res.status(500).json({ 
            error: true, 
            message: "Internal server error" 
        });
    }
};
