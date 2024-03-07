#version 130

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D inputImage[1];
uniform mat3 outputToInput[1];
uniform float threshold; // User-adjustable threshold for edge detection
uniform vec4 edgeColor; // User-adjustable edge color

void main() {
    vec2 texPos = (outputToInput[0] * vec3(gl_FragCoord.xy, 1.0)).xy;
    vec2 size = vec2(textureSize(inputImage[0], 0));
    vec2 texOffset = 1.0 / size; // Texture coordinate offset for neighboring pixels

    float gx = 0.0;
    float gy = 0.0;

    // Sobel operator kernels
    float edgeDetectKernelX[9] = float[9](-1, 0, 1, -2, 0, 2, -1, 0, 1);
    float edgeDetectKernelY[9] = float[9](-1, -2, -1, 0, 0, 0, 1, 2, 1);

    // Apply Sobel operator
    for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
            vec4 sample = texture2D(inputImage[0], texPos + vec2(i, j) * texOffset);
            float intensity = dot(sample.rgb, vec3(0.299, 0.587, 0.114)); // Convert to grayscale
            gx += intensity * edgeDetectKernelX[(i+1)*3 + j+1];
            gy += intensity * edgeDetectKernelY[(i+1)*3 + j+1];
        }
    }

    float edgeMagnitude = sqrt(gx * gx + gy * gy);
    if(edgeMagnitude > threshold) {
        gl_FragColor = edgeColor; // Use user-specified color for edge
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // No edge: Transparent
    }
}