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
   return max(base, top); // Lighten blend mode
}

float calculateOutputAlpha(float baseAlpha, float topAlpha) {
    return clippingMask ? baseAlpha : baseAlpha + topAlpha * (1.0 - baseAlpha);
}

vec3 compositeColors(vec3 baseRGB, vec3 topRGB, vec3 blendedRGB, float baseAlpha, float topAlpha) {
    vec3 finalRGB = clippingMask ? vec3(0.0) : topRGB;
    return baseRGB * baseAlpha * (1.0 - topAlpha) + mix(finalRGB, blendedRGB, baseAlpha) * topAlpha;
}

// Detects OpenToonz empty frame artifacts: black RGB with non-zero alpha
// Returns true when content is effectively empty (RGB channels below threshold)
bool isEffectivelyEmpty(vec4 color) {
    float maxChannel = max(max(color.r, color.g), color.b);
    return maxChannel < 0.001;
}

void main(void) {
    vec2 topTexPos = (outputToInput[0] * vec3(gl_FragCoord.xy, 1.0)).xy;
    vec2 baseTexPos = (outputToInput[1] * vec3(gl_FragCoord.xy, 1.0)).xy;
    vec4 topColor = texture2D(inputImage[0], topTexPos);
    vec4 baseColor = texture2D(inputImage[1], baseTexPos);
    
    bool topIsEmpty = isEffectivelyEmpty(topColor);
    bool baseIsEmpty = isEffectivelyEmpty(baseColor);
    
    if (topIsEmpty && baseIsEmpty) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }
    
    vec4 effectiveTopColor = topIsEmpty ? vec4(0.0, 0.0, 0.0, 0.0) : topColor;
    vec4 effectiveBaseColor = baseIsEmpty ? vec4(0.0, 0.0, 0.0, 0.0) : baseColor;

    vec3 topRGB = depremultiply(effectiveTopColor);
    vec3 baseRGB = depremultiply(effectiveBaseColor);

    float topAlpha = effectiveTopColor.a * opacity;
    float baseAlpha = effectiveBaseColor.a;
    
    float outputAlpha = calculateOutputAlpha(baseAlpha, topAlpha);
    
    if (outputAlpha <= 0.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }

    vec3 blendedRGB = layerBlendingAlgorithm(baseRGB, topRGB);
    vec3 finalRGB = compositeColors(baseRGB, topRGB, blendedRGB, baseAlpha, topAlpha);
    
    gl_FragColor = vec4(finalRGB * outputAlpha, outputAlpha);
}
