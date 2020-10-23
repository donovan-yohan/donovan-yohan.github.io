export default (totalColors) => `
const int TOTAL_COLORS = ${totalColors};

struct Wave {
    vec3 color;
    vec2 noiseFreq;
    float noiseSpeed;
    float noiseFlow;
    float noiseSeed;
    float noiseFloor;
    float noiseCeil;
    float offsetHorz;
    float offsetVert;
};

uniform vec2 iResolution;
uniform float iGlobalTime;
uniform float u_noise_magnitude;
uniform Wave u_waves[TOTAL_COLORS];

// From Stackoveflow
// http://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
    return (blend * opacity + base * (1.0 - opacity));
}

// Simplex 2D noise
// from https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return u_noise_magnitude * dot(m, g);
}

void main(void) {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;

    // Color mapping
    vec3 color = u_waves[0].color;
    
    for (int i = 0; i < u_waves.length(); i++) {
        Wave layer = u_waves[i];

        

        float noise = smoothstep(
            layer.noiseFloor,
            layer.noiseCeil,
            snoise(vec2(
                (uv.x * layer.noiseFreq.x + iGlobalTime * layer.noiseFlow * 0.001 + layer.noiseSeed) + 0.1 * layer.offsetHorz * sin(0.01 * iGlobalTime) * float(i),
                (uv.y * layer.noiseFreq.y + iGlobalTime * layer.noiseSpeed * 0.001 + layer.noiseSeed) + 0.1 * layer.offsetVert * cos(0.01 * iGlobalTime) * float(i)
            )) / 2.0 + 0.5
        );

        color = blendNormal(color, layer.color, pow(noise, float(i) * 0.2));
    }

    gl_FragColor = vec4(color, 1.0);
}
`