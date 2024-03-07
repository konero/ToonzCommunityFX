#ifdef GL_ES
precision mediump float;
#endif

uniform mat3 worldToOutput;
uniform vec4 outputRect;
varying vec4 inputRect[1];
varying mat3 worldToInput[1];

void main() {
    worldToInput[0] = worldToOutput;
    inputRect[0] = outputRect;
    gl_Position = vec4(0.0); // Required to compile, but not used
}
