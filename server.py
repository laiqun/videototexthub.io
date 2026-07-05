#!/usr/bin/env python3

import os
import tempfile
import subprocess
import shlex
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
import uuid
import logging

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    'video': {'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'm4v', '3gp'},
    'audio': {'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'},
    'image': {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'}
}

def allowed_file(filename):
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    for category, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return True
    return False

def sanitize_command(command):
    """Basic command sanitization to prevent dangerous operations"""
    dangerous_patterns = [
        ';', '&&', '||', '|', '`', '$', 
        'rm ', 'mv ', 'cp ', 'chmod ', 'chown ',
        '/etc/', '/bin/', '/usr/', '/var/',
        'sudo', 'su ', 'passwd'
    ]
    
    for pattern in dangerous_patterns:
        if pattern in command.lower():
            raise ValueError(f"Dangerous pattern detected: {pattern}")
    
    return command

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "ffmpeg-container"})

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "service": "FFmpeg Container",
        "status": "running",
        "endpoints": {
            "POST /": "Process media files with FFmpeg",
            "GET /health": "Health check"
        },
        "usage": {
            "file": "Media file to process",
            "command": "FFmpeg command parameters (without 'ffmpeg' prefix)"
        }
    })

@app.route('/', methods=['POST'])
def process_media():
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        command = request.form.get('command', '')
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "File type not allowed"}), 400
        
        if not command.strip():
            return jsonify({"error": "No FFmpeg command provided"}), 400
        
        # Sanitize the command
        try:
            sanitized_command = sanitize_command(command)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        # Create temporary directories
        temp_dir = f"/tmp/ffmpeg_{session_id}"
        os.makedirs(temp_dir, exist_ok=True)
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        input_path = os.path.join(temp_dir, f"input_{filename}")
        file.save(input_path)
        
        logger.info(f"Session {session_id}: Processing file {filename}")
        logger.info(f"Session {session_id}: Command: {sanitized_command}")
        
        # Parse command and prepare FFmpeg execution
        # Replace 'input.*' or 'input.ext' with actual input file
        processed_command = sanitized_command.replace('input.*', input_path)
        processed_command = processed_command.replace('input.', input_path.rsplit('.', 1)[0] + '.')
        
        # If command still contains 'input' without extension, replace with input_path
        if 'input' in processed_command and input_path not in processed_command:
            processed_command = processed_command.replace('input', input_path)
        
        # Determine output file
        output_filename = "output"
        if 'output.' in processed_command:
            # Extract output filename from command
            parts = processed_command.split()
            for i, part in enumerate(parts):
                if part.startswith('output.'):
                    output_filename = part
                    break
        
        output_path = os.path.join(temp_dir, output_filename)
        processed_command = processed_command.replace(output_filename, output_path)
        
        # Build FFmpeg command
        ffmpeg_cmd = ['ffmpeg', '-y'] + shlex.split(processed_command)
        
        logger.info(f"Session {session_id}: Executing: {' '.join(ffmpeg_cmd)}")
        
        # Execute FFmpeg
        try:
            result = subprocess.run(
                ffmpeg_cmd,
                cwd=temp_dir,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                logger.error(f"Session {session_id}: FFmpeg failed: {result.stderr}")
                return jsonify({
                    "error": "FFmpeg processing failed",
                    "ffmpeg_error": result.stderr,
                    "command": ' '.join(ffmpeg_cmd)
                }), 500
            
            # Check if output file exists
            if not os.path.exists(output_path):
                # Try to find any output file in the directory
                output_files = [f for f in os.listdir(temp_dir) if f != f"input_{filename}"]
                if output_files:
                    output_path = os.path.join(temp_dir, output_files[0])
                else:
                    return jsonify({
                        "error": "No output file generated",
                        "ffmpeg_stdout": result.stdout,
                        "ffmpeg_stderr": result.stderr
                    }), 500
            
            logger.info(f"Session {session_id}: Processing successful")
            
            # Determine MIME type based on file extension
            output_ext = output_path.rsplit('.', 1)[-1].lower() if '.' in output_path else ''
            mime_type = 'application/octet-stream'
            
            if output_ext in ['mp4', 'webm', 'avi', 'mov']:
                mime_type = f'video/{output_ext}'
            elif output_ext in ['mp3', 'wav', 'ogg']:
                mime_type = f'audio/{output_ext}'
            elif output_ext in ['jpg', 'jpeg', 'png', 'gif']:
                mime_type = f'image/{output_ext}'
            
            # Return the processed file
            return send_file(
                output_path,
                as_attachment=True,
                download_name=f"ffmpeg_{output_filename}",
                mimetype=mime_type
            )
            
        except subprocess.TimeoutExpired:
            logger.error(f"Session {session_id}: FFmpeg timeout")
            return jsonify({"error": "Processing timeout (5 minutes exceeded)"}), 504
        
        except Exception as e:
            logger.error(f"Session {session_id}: Execution error: {str(e)}")
            return jsonify({"error": f"Execution failed: {str(e)}"}), 500
            
    except Exception as e:
        logger.error(f"Request processing error: {str(e)}")
        return jsonify({"error": f"Request processing failed: {str(e)}"}), 500
    
    finally:
        # Cleanup temporary files
        try:
            import shutil
            if 'temp_dir' in locals() and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
                logger.info(f"Session {session_id}: Cleaned up temporary files")
        except Exception as e:
            logger.warning(f"Cleanup failed: {str(e)}")

if __name__ == '__main__':
    logger.info("Starting FFmpeg container server on port 8080")
    app.run(host='0.0.0.0', port=8080, debug=False)