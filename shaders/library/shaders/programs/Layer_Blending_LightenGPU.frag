#ifdef GL_ES
precision mediump float;
#endif

uniform mat3 worldToOutput;
uniform sampler2D inputImage[2];
uniform mat3 outputToInput[2];
uniform float opacity;
uniform bool clippingMask;

vec3 depremultiply(vec4 color) {
    return color.a > 0.0 ? color.rgb / color.a : vec3(0.0);
}

vec3 layerBlendingAlgorithm(vec3 base, vec3 top) {
   return max(base, top); // Lighten blending
}

float calculateOutputAlpha(float baseAlpha, float topAlpha) {
    return clippingMask ? baseAlpha : baseAlpha + topAlpha * (1.0 - baseAlpha);
}

vec3 compositeColors(vec3 baseRGB, vec3 topRGB, vec3 blendedRGB, float baseAlpha, float topAlpha) {
    vec3 finalRGB = clippingMask ? vec3(0.0) : topRGB;
    return baseRGB * baseAlpha * (1.0 - topAlpha) + mix(finalRGB, blendedRGB, baseAlpha) * topAlpha;
}

void main(void) {
    vec2 topTexPos = (outputToInput[0] * vec3(gl_FragCoord.xy, 1.0)).xy;
    vec2 baseTexPos = (outputToInput[1] * vec3(gl_FragCoord.xy, 1.0)).xy;
    vec4 topColor = texture2D(inputImage[0], topTexPos);
    vec4 baseColor = texture2D(inputImage[1], baseTexPos);

    vec3 topRGB = depremultiply(topColor);
    vec3 baseRGB = depremultiply(baseColor);

    float topAlpha = topColor.a * opacity;
    float baseAlpha = baseColor.a;
    
    gl_FragColor.a = calculateOutputAlpha(baseAlpha, topAlpha);
    if (gl_FragColor.a <= 0.0) discard;

    vec3 blendedRGB = layerBlendingAlgorithm(baseRGB, topRGB);
    gl_FragColor.rgb = compositeColors(baseRGB, topRGB, blendedRGB, baseAlpha, topAlpha);
}
